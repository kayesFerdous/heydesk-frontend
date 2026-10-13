<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <div class="flex flex-col gap-5">
      <h2 class="section-title">{{ t('profile.nameAndGreeting') }}</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class="label" for="agent-name">{{ t('profile.agentName') }}</label>
          <input id="agent-name" v-model.trim="form.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
          <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
        </div>
        <div>
          <label class="label" for="business-name">{{ t('common.businessName') }}</label>
          <input id="business-name" v-model.trim="form.business_name" class="field" :class="{ 'field-invalid': errors.business_name }" type="text" />
          <p v-if="errors.business_name" class="error-text">{{ errors.business_name }}</p>
        </div>
      </div>
      <div>
        <label class="label" for="greeting">{{ t('profile.greeting') }}</label>
        <textarea id="greeting" v-model="form.greeting" class="field" :class="{ 'field-invalid': errors.greeting }" rows="2"></textarea>
        <p class="hint">{{ t('profile.greetingHint', { placeholder: '{business_name}' }) }}</p>
      </div>
    </div>

    <div v-if="fields.length" class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
      <h2 class="section-title">{{ t('profile.about') }}</h2>
      <div v-for="field in fields" :key="field.key">
        <label class="label" :for="`k-${field.key}`">{{ field.label }}</label>
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
        <p v-if="field.help" class="hint">{{ field.help }}</p>
      </div>
    </div>

    <!-- What the agent does is fixed per kind of business; shown, not edited. -->
    <div class="mt-10 border-t border-hairline pt-8">
      <h2 class="section-title">{{ t('profile.canDo') }}</h2>
      <p class="mt-1 text-sm text-ink-soft">{{ t('profile.canDoText') }}</p>
      <ul class="mt-4 flex flex-col gap-3">
        <li v-for="job in agent.jobs" :key="job" class="flex gap-3">
          <PhCheckCircle :size="20" weight="fill" class="mt-px shrink-0 text-brand"></PhCheckCircle>
          <div>
            <p class="text-sm font-semibold">{{ t(`jobs.${agent.kind}.${job}.label`) }}</p>
            <p class="mt-0.5 text-sm text-ink-soft">{{ t(`jobs.${agent.kind}.${job}.text`) }}</p>
          </div>
        </li>
      </ul>
    </div>

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
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';

// Edited on the Delivery and payments section, not here.
const PAYMENT_FIELDS = ['delivers', 'delivery_charge', 'deposit', 'pay_first', 'delivery', 'free_delivery_over'];

// Fields with friendlier words than the schema's names (`profile.fields.<key>`);
// the long ones get a textarea.
const KNOWN_FIELDS = ['address', 'policies', 'about', 'services', 'emergency_phone', 'size_guide'];
const LONG_FIELDS = ['policies', 'about', 'services', 'size_guide'];

const { t, te } = useI18n();
const agent = useAgentStore();

// A desk's own details come from its schema; hours have their own section.
const fields = computed(() => {
  const properties = agent.preset?.knowledge_schema.properties ?? {};
  return Object.keys(properties)
    .filter((key) => key !== 'hours' && !PAYMENT_FIELDS.includes(key))
    .map((key) => {
      const known = KNOWN_FIELDS.includes(key);
      const helpKey = `profile.fields.${key}.help`;
      return {
        key,
        label: known ? t(`profile.fields.${key}.label`) : properties[key].title || key,
        long: LONG_FIELDS.includes(key),
        help: known && te(helpKey, 'en') ? t(helpKey) : '',
      };
    });
});

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
});

// The preset (and so the fields) can arrive after the config.
watch(
  () => agent.preset,
  () => {
    if (!isDirty.value && agent.config) resetForm();
  },
);
</script>
