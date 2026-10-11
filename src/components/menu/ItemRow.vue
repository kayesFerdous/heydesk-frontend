<template>
  <!-- Reading -->
  <div
    v-if="!editing"
    class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_8.5rem_5rem] sm:px-8"
  >
    <div class="min-w-0" :class="{ 'opacity-55': !item.available }">
      <p class="truncate text-sm font-semibold">{{ item.name }}</p>
      <p v-if="item.description" class="truncate text-sm text-ink-soft">{{ item.description }}</p>
      <p v-if="facts.length" class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span v-for="fact in facts" :key="fact.key" class="inline-flex items-center gap-1">
          <component :is="fact.icon" :size="13" class="text-ink-faint"></component>
          {{ fact.text }}
        </span>
      </p>
      <div v-if="item.tags.length" class="mt-1.5 flex flex-wrap gap-1.5">
        <span v-for="tag in item.tags" :key="tag" class="chip bg-hover !font-medium text-ink-soft">{{ tag }}</span>
      </div>
    </div>

    <p class="text-right text-sm font-semibold" :class="{ 'opacity-55': !item.available }">{{ formatMoney(item.price) }}</p>

    <!-- On a phone the switch and Edit share one line under the name. -->
    <div class="col-span-2 flex items-center justify-between sm:contents">
      <div class="flex items-center gap-2">
        <ToggleSwitch
          :model-value="item.available"
          :label="t('menu.row.isAvailable', { name: item.name })"
          @update:model-value="$emit('toggle')"
        ></ToggleSwitch>
        <span class="text-xs whitespace-nowrap text-ink-soft">{{ item.available ? t('menu.row.on') : offWord }}</span>
      </div>

      <div class="sm:text-right">
        <button type="button" class="btn btn-quiet btn-sm" @click="$emit('edit')">{{ t('common.edit') }}</button>
      </div>
    </div>
  </div>

  <!-- Editing, in the row itself -->
  <form v-else class="border-b border-hairline bg-brand-tint/40 px-5 py-5 sm:px-8" novalidate @submit.prevent="submit">
    <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="label" :for="`n-${uid}`">{{ t('menu.row.name') }}</label>
        <input :id="`n-${uid}`" ref="nameInput" v-model.trim="draft.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
        <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
      </div>
      <div>
        <label class="label" :for="`p-${uid}`">{{ kind === 'clinic' ? t('menu.fee') : t('menu.price') }} (৳)</label>
        <input :id="`p-${uid}`" v-model.trim="priceText" class="field" :class="{ 'field-invalid': errors.price }" type="text" inputmode="decimal" placeholder="450" />
        <p v-if="errors.price" class="error-text">{{ errors.price }}</p>
      </div>
      <div>
        <label class="label" :for="`c-${uid}`">{{ kind === 'clinic' ? t('menu.row.speciality') : t('menu.row.category') }}</label>
        <input :id="`c-${uid}`" v-model.trim="draft.category" class="field" :class="{ 'field-invalid': errors.category }" type="text" :list="`cats-${uid}`" />
        <datalist :id="`cats-${uid}`">
          <option v-for="category in categories" :key="category" :value="category"></option>
        </datalist>
        <p v-if="errors.category" class="error-text">{{ errors.category }}</p>
      </div>
      <div class="sm:col-span-2">
        <label class="label" :for="`d-${uid}`">{{ t('menu.row.description') }}</label>
        <input :id="`d-${uid}`" v-model="draft.description" class="field" type="text" />
      </div>
      <template v-if="kind === 'shop'">
        <div>
          <label class="label" :for="`sz-${uid}`">{{ t('menu.row.sizes') }}</label>
          <input :id="`sz-${uid}`" v-model="sizesText" class="field" type="text" placeholder="M, L, XL" />
          <p class="hint">{{ t('menu.row.sizesHint') }}</p>
        </div>
        <div>
          <label class="label" :for="`cl-${uid}`">{{ t('menu.row.colours') }}</label>
          <input :id="`cl-${uid}`" v-model="coloursText" class="field" type="text" placeholder="White, Navy" />
        </div>
        <div>
          <label class="label" :for="`st-${uid}`">{{ t('menu.row.inStock') }}</label>
          <input :id="`st-${uid}`" v-model.trim="stockText" class="field" :class="{ 'field-invalid': errors.stock }" type="text" inputmode="numeric" :placeholder="t('menu.row.notCounted')" />
          <p v-if="errors.stock" class="error-text">{{ errors.stock }}</p>
          <p v-else class="hint">{{ t('menu.row.stockHint') }}</p>
        </div>
      </template>
      <div v-else class="sm:col-span-2">
        <label class="label" :for="`t-${uid}`">{{ t('menu.row.tags') }}</label>
        <input :id="`t-${uid}`" v-model="tagsText" class="field" type="text" placeholder="popular, spicy, vegetarian" />
        <p class="hint">{{ t('menu.row.tagsHint') }}</p>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <button type="submit" class="btn btn-primary">{{ t('common.save') }}</button>
      <button type="button" class="btn btn-quiet" @click="$emit('cancel')">{{ t('common.cancel') }}</button>

      <template v-if="!isNew">
        <span class="flex-1"></span>
        <span v-if="confirming" class="flex items-center gap-2 text-sm">
          {{ t('menu.row.deleteThis', { noun }) }}
          <button type="button" class="btn btn-danger btn-sm" @click="$emit('remove')">{{ t('common.delete') }}</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="confirming = false">{{ t('common.keepIt') }}</button>
        </span>
        <button v-else type="button" class="btn btn-quiet !text-danger" @click="confirming = true">
          {{ t('menu.row.delete', { noun }) }}
        </button>
      </template>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalendarBlank, PhClock, PhInfo, PhPalette, PhPackage, PhRuler, PhTranslate } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { itemNoun } from '../../lib/presets.js';

// Known facts get an icon instead of a label.
const FACT_ICONS = {
  days: PhCalendarBlank,
  hours: PhClock,
  languages: PhTranslate,
};

// "M, L , XL" -> ["M", "L", "XL"]
function list(text) {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const props = defineProps({
  item: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  // The preset: "restaurant", "clinic" or "shop".
  kind: { type: String, default: null },
});
const emit = defineEmits(['toggle', 'edit', 'cancel', 'save', 'remove']);
const { t } = useI18n();

const uid = useId();
const nameInput = ref(null);
const draft = ref({});
const priceText = ref('');
const tagsText = ref('');
const sizesText = ref('');
const coloursText = ref('');
const stockText = ref('');
const errors = ref({});
const confirming = ref(false);

const noun = computed(() => itemNoun(props.kind));
const offWord = computed(() => (props.kind === 'clinic' ? t('menu.row.away') : t('menu.row.soldOut')));

// A business's own facts (a doctor's days, hours and languages) are shown
// but edited through the CSV import.
const facts = computed(() => {
  const item = props.item;
  if (props.kind === 'shop') {
    const shown = [];
    if (item.sizes?.length) shown.push({ key: 'sizes', icon: PhRuler, text: item.sizes.join(', ') });
    if (item.colours?.length) shown.push({ key: 'colours', icon: PhPalette, text: item.colours.join(', ') });
    if (item.stock > 0) shown.push({ key: 'stock', icon: PhPackage, text: t('menu.row.stockCount', { n: formatNumber(item.stock) }) });
    return shown;
  }
  const attributes = item.attributes || {};
  return Object.keys(attributes)
    .filter((key) => [].concat(attributes[key]).length)
    .map((key) => {
      const values = [].concat(attributes[key]).map((value) => capitalize(String(value))).join(', ');
      const icon = FACT_ICONS[key];
      return { key, icon: icon || PhInfo, text: icon ? values : `${capitalize(key)}: ${values}` };
    });
});

// Copy the item into the form each time editing starts.
function fillForm() {
  const item = props.item;
  draft.value = { ...item };
  priceText.value = item.price ? String(item.price / 100) : '';
  tagsText.value = item.tags.join(', ');
  sizesText.value = (item.sizes || []).join(', ');
  coloursText.value = (item.colours || []).join(', ');
  stockText.value = item.stock === null || item.stock === undefined ? '' : String(item.stock);
  errors.value = {};
  confirming.value = false;
}

watch(
  () => props.editing,
  (isEditing) => {
    if (!isEditing) return;
    fillForm();
    nextTick(() => nameInput.value?.focus());
  },
);

fillForm();
onMounted(() => {
  if (props.editing) nameInput.value?.focus();
});

function submit() {
  const found = {};
  const price = Number(priceText.value);
  const stock = stockText.value === '' ? null : Number(stockText.value);
  if (props.kind === 'shop' && stock !== null && !(Number.isInteger(stock) && stock >= 0)) {
    found.stock = t('menu.row.stockError');
  }
  if (!draft.value.name) found.name = t('menu.row.nameError');
  if (priceText.value === '' || Number.isNaN(price) || price < 0) found.price = t('menu.row.priceError');
  if (!draft.value.category) found.category = t('menu.row.categoryError');
  errors.value = found;
  if (Object.keys(found).length) return;

  const product =
    props.kind === 'shop'
      ? { sizes: list(sizesText.value), colours: list(coloursText.value), stock, available: stock !== 0 }
      : {};
  emit('save', {
    ...props.item,
    ...product,
    name: draft.value.name,
    description: draft.value.description,
    category: draft.value.category,
    price: Math.round(price * 100),
    tags: list(tagsText.value),
  });
}
</script>
