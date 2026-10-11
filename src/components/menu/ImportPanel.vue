<template>
  <div class="border-y border-hairline bg-wash px-5 py-6 sm:px-8">
    <div class="max-w-2xl">
      <h2 class="section-title">{{ t('menu.import.title') }}</h2>
      <p class="mt-1 text-sm text-ink-soft">
        {{ t('menu.import.intro') }}
        {{ columns }}
      </p>

      <div class="mt-4">
        <label class="btn btn-secondary cursor-pointer">
          <PhUploadSimple :size="18"></PhUploadSimple>
          {{ fileName || t('menu.import.choose') }}
          <input class="sr-only" type="file" accept=".csv,text/csv" @change="pick" />
        </label>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

      <div v-if="result" class="mt-5">
        <p class="text-sm font-semibold">
          {{ t('menu.import.found', { n: formatNumber(result.count), noun: itemNoun(kind, result.count) }) }}
        </p>
        <p v-if="result.attributes.length" class="mt-1 text-sm text-ink-soft">
          {{ t('menu.import.extraColumns', { columns: result.attributes.join(', ') }) }}
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
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUploadSimple } from '@phosphor-icons/vue';

import { importItems } from '../../api/agent.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { itemNoun } from '../../lib/presets.js';

const props = defineProps({
  // The preset: "restaurant", "clinic" or "shop". Decides the CSV's columns.
  kind: { type: String, default: null },
  currentCount: { type: Number, default: 0 },
});
const emit = defineEmits(['close', 'imported']);
const { t } = useI18n();

const csv = ref('');
const fileName = ref('');
const result = ref(null);
const error = ref(null);
const busy = ref(false);

const columns = computed(() => {
  if (props.kind === 'clinic') return t('menu.import.columnsClinic');
  if (props.kind === 'shop') return t('menu.import.columnsShop');
  return t('menu.import.columnsMenu');
});

async function pick(event) {
  const file = event.target.files[0];
  if (!file) return;
  fileName.value = file.name;
  result.value = null;
  error.value = null;
  busy.value = true;
  try {
    csv.value = await file.text();
    // Check the file first. Nothing is saved until the owner confirms.
    result.value = await importItems(csv.value, true);
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

async function confirm() {
  busy.value = true;
  error.value = null;
  try {
    await importItems(csv.value, false);
    emit('imported');
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}
</script>
