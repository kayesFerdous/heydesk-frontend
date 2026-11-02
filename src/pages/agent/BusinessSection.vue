<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <SettingsGroup :title="t('profile.about')">
      <div>
        <FieldLabel html-for="business-name">{{ t('common.businessName') }}</FieldLabel>
        <input id="business-name" v-model.trim="form.business_name" class="field" :class="{ 'field-invalid': errors.business_name }" type="text" />
        <p v-if="errors.business_name" class="error-text">{{ errors.business_name }}</p>
      </div>

      <div v-for="field in fields" :key="field.key">
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

    <SettingsGroup v-if="hasHours" :title="t('hours.title')" :tip="t('hours.text')">
      <HoursEditor v-model="form.hours"></HoursEditor>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import HoursEditor from '../../components/agent/HoursEditor.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { normalizeHours, DAYS } from '../../lib/hours.js';

// The facts about the business the agent answers from. Fields edited on other
// sections: hours (below, from their own editor), a shop's calls, the
// cash-order switch and delivery (Delivery and payments), and lists such as
// saved replies (Answers).
const ELSEWHERE = ['hours', 'calls', 'call_to_confirm', 'delivers', 'delivery_charge', 'deposit', 'pay_first', 'delivery', 'free_delivery_over'];

// Fields with friendlier words than the schema's names (`profile.fields.<key>`);
// the long ones get a textarea.
const KNOWN_FIELDS = ['address', 'policies', 'about', 'services', 'emergency_phone', 'size_guide', 'exchange_days'];
const LONG_FIELDS = ['policies', 'about', 'services', 'size_guide'];

const { t, te } = useI18n();
const agent = useAgentStore();

const properties = computed(() => agent.preset?.knowledge_schema.properties ?? {});

// Only a desk whose schema has hours (not every kind of business keeps them).
const hasHours = computed(() => 'hours' in properties.value);

// A desk's own details come from its schema.
const fields = computed(() =>
  Object.keys(properties.value)
    .filter((key) => !ELSEWHERE.includes(key) && properties.value[key].type !== 'array')
    .map((key) => {
      const property = properties.value[key];
      const known = KNOWN_FIELDS.includes(key);
      const words = (name) => (known && te(`profile.fields.${key}.${name}`, 'en') ? t(`profile.fields.${key}.${name}`) : '');
      return {
        key,
        label: known ? t(`profile.fields.${key}.label`) : sentenceCase(property.title || key),
        long: LONG_FIELDS.includes(key),
        help: words('help'),
        boolean: property.type === 'boolean',
        number: property.type === 'integer',
        default: property.default,
        min: property.minimum,
        max: property.maximum,
        on: words('on'),
        off: words('off'),
      };
    }),
);

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
      // A switch or a number keeps its own type (the schema's default when unset); text fields start empty.
      const saved = config.knowledge[field.key];
      if (field.boolean) knowledge[field.key] = saved ?? field.default ?? false;
      else if (field.number) knowledge[field.key] = saved ?? field.default ?? 0;
      else knowledge[field.key] = saved || '';
    });
    return { business_name: config.business_name, knowledge, hours: normalizeHours(config.knowledge.hours) };
  },
  // An emptied number goes back to its default; closed days go to the API as null.
  patchFrom: (f) => {
    const knowledge = { ...f.knowledge };
    fields.value.forEach((field) => {
      if (field.number && knowledge[field.key] === '') knowledge[field.key] = field.default ?? 0;
    });
    if (hasHours.value) {
      const hours = {};
      DAYS.forEach((key) => (hours[key] = f.hours[key]));
      knowledge.hours = hours;
    }
    return { business_name: f.business_name, knowledge };
  },
});

// The preset (and so the fields) can arrive after the config.
watch(
  () => agent.preset,
  () => {
    if (!isDirty.value && agent.config) resetForm();
  },
);
</script>
