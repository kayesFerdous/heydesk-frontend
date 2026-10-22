<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <SettingsGroup :title="t('profile.nameAndGreeting')">
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel html-for="agent-name">{{ t('profile.agentName') }}</FieldLabel>
          <input id="agent-name" v-model.trim="form.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
          <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
        </div>
        <div>
          <FieldLabel html-for="business-name">{{ t('common.businessName') }}</FieldLabel>
          <input id="business-name" v-model.trim="form.business_name" class="field" :class="{ 'field-invalid': errors.business_name }" type="text" />
          <p v-if="errors.business_name" class="error-text">{{ errors.business_name }}</p>
        </div>
      </div>
      <div>
        <FieldLabel html-for="greeting" :tip="t('profile.greetingHint', { placeholder: '{business_name}' })">{{ t('profile.greeting') }}</FieldLabel>
        <textarea id="greeting" v-model="form.greeting" class="field" :class="{ 'field-invalid': errors.greeting }" rows="2"></textarea>
        <p v-if="errors.greeting" class="error-text">{{ errors.greeting }}</p>
        <!-- The {business_name} placeholder is a system word: show what it becomes. -->
        <p v-else-if="greetingPreview" class="hint">{{ t('profile.greetingPreview', { text: greetingPreview }) }}</p>
      </div>
    </SettingsGroup>

    <SettingsGroup v-if="fields.length" :title="t('profile.about')">
      <div v-for="field in fields" :key="field.key">
        <FieldLabel :html-for="`k-${field.key}`" :tip="field.help">{{ field.label }}</FieldLabel>
        <textarea
          v-if="field.long"
          :id="`k-${field.key}`"
          v-model="form.knowledge[field.key]"
          class="field"
          :class="{ 'field-invalid': errors[field.key] }"
          rows="3"
        ></textarea>
        <input
          v-else
          :id="`k-${field.key}`"
          v-model.trim="form.knowledge[field.key]"
          class="field"
          :class="{ 'field-invalid': errors[field.key] }"
          type="text"
        />
        <p v-if="errors[field.key]" class="error-text">{{ errors[field.key] }}</p>
      </div>
    </SettingsGroup>

    <!-- What the agent does is fixed per kind of business; shown, not edited. -->
    <SettingsGroup :title="t('profile.canDo')" :tip="t('profile.canDoText')">
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="job in agent.jobs"
          :key="job"
          class="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-wash py-1.5 pr-2 pl-3 text-sm font-medium"
        >
          <PhCheckCircle :size="16" weight="fill" class="shrink-0 text-brand"></PhCheckCircle>
          {{ t(`jobs.${agent.kind}.${job}.label`) }}
          <InfoTip :text="t(`jobs.${agent.kind}.${job}.text`)" :label="t(`jobs.${agent.kind}.${job}.label`)"></InfoTip>
        </li>
      </ul>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import InfoTip from '../../components/ui/InfoTip.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';

// Edited on the Delivery and payments section, not here.
// Fields with a section of their own: hours, and a shop's calls (backend D89).
const OWN_SECTION = ['hours', 'calls'];
const PAYMENT_FIELDS = ['delivers', 'delivery_charge', 'deposit', 'pay_first', 'delivery', 'free_delivery_over'];

// Fields with friendlier words than the schema's names (`profile.fields.<key>`);
// the long ones get a textarea.
const KNOWN_FIELDS = ['address', 'policies', 'about', 'services', 'emergency_phone', 'size_guide', 'exchange_days'];
const LONG_FIELDS = ['policies', 'about', 'services', 'size_guide'];

const { t, te } = useI18n();
const agent = useAgentStore();

// A desk's own details come from its schema; hours have their own section.
const fields = computed(() => {
  const properties = agent.preset?.knowledge_schema.properties ?? {};
  return Object.keys(properties)
    .filter((key) => !OWN_SECTION.includes(key) && !PAYMENT_FIELDS.includes(key))
    .map((key) => {
      const known = KNOWN_FIELDS.includes(key);
      const helpKey = `profile.fields.${key}.help`;
      return {
        key,
        label: known ? t(`profile.fields.${key}.label`) : sentenceCase(properties[key].title || key),
        long: LONG_FIELDS.includes(key),
        help: known && te(helpKey, 'en') ? t(helpKey) : '',
      };
    });
});

// A field this page has no words for yet shows the schema's title ("Exchange
// Days", "exchange_days") in sentence case: "Exchange days".
function sentenceCase(title) {
  const words = title.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const knowledge = {};
    fields.value.forEach(({ key }) => (knowledge[key] = config.knowledge[key] || ''));
    return {
      name: config.name,
      business_name: config.business_name,
      greeting: config.greeting,
      knowledge,
    };
  },
  patchFrom: (f) => ({ ...f }),
  previewFrom: (f) => ({ name: f.name, business_name: f.business_name, greeting: f.greeting }),
});

// The greeting as a customer reads it, when it uses the placeholder.
const greetingPreview = computed(() => {
  const greeting = form.value?.greeting ?? '';
  if (!greeting.includes('{business_name}')) return '';
  return greeting.replaceAll('{business_name}', form.value.business_name || t('common.businessName'));
});

// The preset (and so the fields) can arrive after the config.
watch(
  () => agent.preset,
  () => {
    if (!isDirty.value && agent.config) resetForm();
  },
);
</script>
