<template>
  <div class="border-y border-hairline bg-wash px-5 py-6 sm:px-8">
    <div class="max-w-2xl">
      <h2 class="section-title">{{ t('menu.import.title') }}</h2>
      <p class="mt-1 text-sm text-ink-soft">{{ t('menu.import.intro') }}</p>

      <div class="mt-4">
        <label class="btn btn-secondary cursor-pointer">
          <PhUploadSimple :size="18"></PhUploadSimple>
          {{ fileName || t('menu.import.choose') }}
          <input class="sr-only" type="file" accept=".csv,text/csv" @change="pick" />
        </label>
      </div>

      <p v-if="reading" class="mt-4 text-sm text-ink-soft">{{ t('menu.import.reading') }}</p>

      <!-- Which of their columns is which of our fields. -->
      <div v-if="suggestion" class="mt-6">
        <h3 class="text-sm font-semibold">{{ t('menu.import.matchTitle') }}</h3>
        <p class="mt-1 text-sm text-ink-soft">
          {{ suggestion.by_ai ? t('menu.import.matchedByAi') : t('menu.import.matchByHand') }}
        </p>
        <ul class="mt-3 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline bg-surface">
          <li
            v-for="column in suggestion.columns"
            :key="column.name"
            class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div class="min-w-0">
              <label class="text-sm font-medium" :for="`col-${column.name}`">
                {{ fieldLabel(column.name) }}
                <span v-if="column.required" class="text-ink-soft">({{ t('menu.import.required') }})</span>
              </label>
              <p class="truncate text-xs text-ink-soft">{{ column.about }}</p>
            </div>
            <div class="w-full shrink-0 sm:w-56">
              <select
                :id="`col-${column.name}`"
                v-model="mapping[column.name]"
                class="field !h-9"
                :class="{ 'field-invalid': column.required && !mapping[column.name] }"
              >
                <option value="">{{ t('menu.import.notInFile') }}</option>
                <option v-for="header in suggestion.headers" :key="header" :value="header">{{ header }}</option>
              </select>
              <p v-if="example(column.name)" class="mt-1 truncate text-xs text-ink-soft">
                {{ t('menu.import.example', { value: example(column.name) }) }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div class="mt-5">
        <FormProblems :message="error" :problems="problems"></FormProblems>
      </div>

      <!-- The rows as they'll be saved. -->
      <div v-if="result">
        <p class="text-sm font-semibold">
          {{ t('menu.import.found', { n: formatNumber(result.count), noun: itemNoun(kind, result.count) }) }}
        </p>
        <ul class="mt-3 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline bg-surface text-sm">
          <li v-for="item in result.preview" :key="item.code" class="flex justify-between gap-4 px-4 py-2.5">
            <span class="truncate">{{ item.name }}</span>
            <span class="font-semibold">{{ formatMoney(item.price) }}</span>
          </li>
        </ul>
        <p class="mt-3 text-sm text-attention">
          {{ t('menu.import.replaces', { n: formatNumber(currentCount), noun: itemNoun(kind, currentCount) }) }}
        </p>
      </div>

      <div class="mt-5 flex gap-2">
        <button v-if="result" type="button" class="btn btn-primary" :disabled="busy" @click="confirm">
          {{ busy ? t('menu.import.importing') : t('menu.import.replaceWith', { n: formatNumber(result.count) }) }}
        </button>
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="$emit('close')">{{ t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUploadSimple } from '@phosphor-icons/vue';

import FormProblems from '../ui/FormProblems.vue';
import { importItems, suggestColumns } from '../../api/agent.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { itemNoun } from '../../lib/presets.js';

defineProps({
  // The desk: "restaurant", "clinic" or "shop". Only used for the words.
  kind: { type: String, default: null },
  currentCount: { type: Number, default: 0 },
});
const emit = defineEmits(['close', 'imported']);
const { t, te } = useI18n();

const csv = ref('');
const fileName = ref('');
const suggestion = ref(null); // { columns, headers, samples, mapping, by_ai }
const mapping = ref({}); // our field → their column; "" when the file has none
const result = ref(null); // the check: { count, preview }
const error = ref(null);
const problems = ref([]);
const reading = ref(false);
const busy = ref(false);

function fieldLabel(name) {
  const key = `menu.import.fields.${name}`;
  return te(key) ? t(key) : name;
}

// What the chosen column holds in the file's first row.
function example(name) {
  const header = mapping.value[name];
  return header ? suggestion.value.samples[0]?.[header] : '';
}

function showError(err) {
  error.value = err.message;
  problems.value = Object.entries(err.fields || {}).map(([where, what]) => `${where}: ${what}`);
}

function clearError() {
  error.value = null;
  problems.value = [];
}

// The mapping as the backend wants it: only the fields that have a column.
function chosen() {
  return Object.fromEntries(Object.entries(mapping.value).filter(([, header]) => header));
}

async function pick(event) {
  const file = event.target.files[0];
  if (!file) return;
  fileName.value = file.name;
  suggestion.value = null;
  result.value = null;
  clearError();
  reading.value = true;
  try {
    csv.value = await file.text();
    // The AI's guess first. The owner checks it below; nothing is saved yet.
    const found = await suggestColumns(csv.value);
    mapping.value = Object.fromEntries(found.columns.map((c) => [c.name, found.mapping[c.name] || '']));
    suggestion.value = found;
  } catch (err) {
    showError(err);
  }
  reading.value = false;
}

// Every change to the matches checks the file again, so the preview is
// always what "Replace" would save.
watch(mapping, check, { deep: true });

async function check() {
  if (!suggestion.value) return;
  result.value = null;
  clearError();
  const missing = suggestion.value.columns.filter((c) => c.required && !mapping.value[c.name]);
  if (missing.length) {
    error.value = t('menu.import.pickRequired', { fields: missing.map((c) => fieldLabel(c.name)).join(', ') });
    return;
  }
  busy.value = true;
  try {
    result.value = await importItems(csv.value, chosen(), true);
  } catch (err) {
    showError(err);
  }
  busy.value = false;
}

async function confirm() {
  busy.value = true;
  clearError();
  try {
    await importItems(csv.value, chosen(), false);
    emit('imported');
  } catch (err) {
    showError(err);
  }
  busy.value = false;
}
</script>
