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

    <SettingsGroup v-if="aboutFields.length" :title="t('profile.about')">
      <div v-for="field in aboutFields" :key="field.key">
        <!-- A yes or no is a switch, with a line saying what the choice does. -->
        <div v-if="field.boolean" class="flex items-start justify-between gap-4 rounded-[var(--radius-card)] border border-hairline px-4 py-3">
          <div class="min-w-0">
            <label class="text-sm font-medium" :for="`k-${field.key}`">{{ field.label }}</label>
            <p v-if="field.on" class="hint !mt-0.5">{{ form.knowledge[field.key] ? field.on : field.off }}</p>
          </div>
          <ToggleSwitch :id="`k-${field.key}`" v-model="form.knowledge[field.key]" :label="field.label" class="mt-0.5"></ToggleSwitch>
        </div>
        <template v-else>
          <FieldLabel :html-for="`k-${field.key}`" :tip="field.help">{{ field.label }}</FieldLabel>
          <textarea
            v-if="field.long"
            :id="`k-${field.key}`"
            v-model="form.knowledge[field.key]"
            class="field"
            :class="{ 'field-invalid': errors[field.key] }"
            rows="3"
          ></textarea>
          <!-- A whole number (a shop's exchange_days), within the schema's limits. -->
          <input
            v-else-if="field.number"
            :id="`k-${field.key}`"
            v-model.number="form.knowledge[field.key]"
            class="field max-w-40"
            :class="{ 'field-invalid': errors[field.key] }"
            type="number"
            inputmode="numeric"
            step="1"
            :min="field.min"
            :max="field.max"
          />
          <input
            v-else
            :id="`k-${field.key}`"
            v-model.trim="form.knowledge[field.key]"
            class="field"
            :class="{ 'field-invalid': errors[field.key] }"
            type="text"
          />
        </template>
        <p v-if="errors[field.key]" class="error-text">{{ errors[field.key] }}</p>
      </div>
    </SettingsGroup>

    <!-- A list of short texts (a shop's saved replies): one box each, added and removed here. -->
    <SettingsGroup v-for="field in listFields" :key="field.key" :title="field.label" :tip="field.help">
      <ul v-if="form.knowledge[field.key].length" class="flex flex-col gap-2">
        <li v-for="(item, i) in form.knowledge[field.key]" :key="i">
          <div class="flex items-start gap-2">
            <textarea
              :id="`k-${field.key}-${i}`"
              v-model="form.knowledge[field.key][i]"
              class="field max-h-40 min-h-9 !py-1.5 [field-sizing:content]"
              :class="{ 'field-invalid': errors[`${field.key}.${i}`] }"
              rows="1"
              :maxlength="field.itemMax"
              :aria-label="t('profile.list.item', { label: field.label, n: formatNumber(i + 1) })"
            ></textarea>
            <button
              type="button"
              class="btn btn-quiet btn-icon shrink-0"
              :aria-label="t('profile.list.remove', { n: formatNumber(i + 1) })"
              @click="form.knowledge[field.key].splice(i, 1)"
            >
              <PhTrash :size="16"></PhTrash>
            </button>
          </div>
          <p v-if="errors[`${field.key}.${i}`]" class="error-text">{{ errors[`${field.key}.${i}`] }}</p>
        </li>
      </ul>
      <p v-else class="hint !mt-0">{{ field.empty }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="form.knowledge[field.key].length >= field.max"
          @click="addItem(field)"
        >
          <PhPlus :size="14" weight="bold"></PhPlus>
          {{ t('profile.list.add') }}
        </button>
        <span v-if="form.knowledge[field.key].length" class="text-[0.8125rem] text-ink-soft">
          {{ t('profile.list.count', { n: formatNumber(form.knowledge[field.key].length), max: formatNumber(field.max) }) }}
        </span>
      </div>
      <p v-if="errors[field.key]" class="error-text">{{ errors[field.key] }}</p>
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
import { computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle, PhPlus, PhTrash } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import InfoTip from '../../components/ui/InfoTip.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { formatNumber } from '../../lib/format.js';

// Edited on the Delivery and payments section, not here.
// Fields with a section of their own: hours, and a shop's calls (backend D89).
const OWN_SECTION = ['hours', 'calls'];
const PAYMENT_FIELDS = ['delivers', 'delivery_charge', 'deposit', 'pay_first', 'delivery', 'free_delivery_over'];

// Fields with friendlier words than the schema's names (`profile.fields.<key>`);
// the long ones get a textarea.
const KNOWN_FIELDS = ['address', 'policies', 'about', 'services', 'emergency_phone', 'size_guide', 'exchange_days', 'call_to_confirm', 'saved_replies'];
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
        // A true/false field (a shop's call_to_confirm) is a switch; its on and off lines, if it has words.
        boolean: properties[key].type === 'boolean',
        number: properties[key].type === 'integer',
        // A list of texts (saved replies): its own group, as many boxes as it has items.
        list: properties[key].type === 'array',
        default: properties[key].default,
        min: properties[key].minimum,
        max: properties[key].maximum ?? properties[key].maxItems,
        itemMax: properties[key].items?.maxLength,
        empty: known && te(`profile.fields.${key}.empty`, 'en') ? t(`profile.fields.${key}.empty`) : '',
        on: known && te(`profile.fields.${key}.on`, 'en') ? t(`profile.fields.${key}.on`) : '',
        off: known && te(`profile.fields.${key}.off`, 'en') ? t(`profile.fields.${key}.off`) : '',
      };
    });
});

const aboutFields = computed(() => fields.value.filter((field) => !field.list));
const listFields = computed(() => fields.value.filter((field) => field.list));

// A new empty box at the end of a list, with the cursor in it.
async function addItem(field) {
  form.value.knowledge[field.key].push('');
  await nextTick();
  document.getElementById(`k-${field.key}-${form.value.knowledge[field.key].length - 1}`)?.focus();
}

// A field this page has no words for yet shows the schema's title ("Exchange
// Days", "exchange_days") in sentence case: "Exchange days".
function sentenceCase(title) {
  const words = title.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const knowledge = {};
    fields.value.forEach((field) => {
      // A switch, a number or a list keeps its own type (the schema's default when unset); text fields start empty.
      const saved = config.knowledge[field.key];
      if (field.boolean) knowledge[field.key] = saved ?? field.default ?? false;
      else if (field.number) knowledge[field.key] = saved ?? field.default ?? 0;
      else if (field.list) knowledge[field.key] = [...(saved ?? field.default ?? [])];
      else knowledge[field.key] = saved || '';
    });
    return {
      name: config.name,
      business_name: config.business_name,
      greeting: config.greeting,
      knowledge,
    };
  },
  // An emptied number goes back to its default; a list drops its empty boxes.
  patchFrom: (f) => {
    const knowledge = { ...f.knowledge };
    fields.value.forEach((field) => {
      if (field.number && knowledge[field.key] === '') knowledge[field.key] = field.default ?? 0;
      if (field.list) knowledge[field.key] = knowledge[field.key].map((item) => item.trim()).filter(Boolean);
    });
    return { ...f, knowledge };
  },
  // The page's chat preview shows the name and greeting as they are typed.
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
