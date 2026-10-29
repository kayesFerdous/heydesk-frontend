<template>
  <!-- One entry on the list: name (with its tags), price, whether it is offered, edit.
       Edit opens the form in a sheet (ItemEditor); `editing` marks its row meanwhile. -->
  <div
    class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-8"
    :class="[columns, { 'row-selected': editing }]"
  >
    <div class="flex min-w-0 items-center gap-3" :class="{ 'opacity-55': !item.available }">
      <img v-if="item.photos?.length" :src="item.photos[0]" alt="" class="size-10 shrink-0 rounded-[var(--radius-thumb)] object-cover ring-1 ring-hairline" />
      <div class="min-w-0">
        <p class="flex min-w-0 items-center gap-2">
          <span class="truncate text-sm font-semibold">{{ item.name }}</span>
          <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="chip hidden shrink-0 bg-wash !py-0 !font-medium text-ink-soft sm:inline-flex">{{ tag }}</span>
        </p>
        <p v-if="item.description" class="truncate text-sm text-ink-soft">{{ item.description }}</p>
        <p v-if="facts.length" class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span v-for="fact in facts" :key="fact.key" class="inline-flex items-center gap-1">
            <component :is="fact.icon" :size="13" class="text-ink-faint"></component>
            {{ fact.text }}
          </span>
        </p>
      </div>
    </div>

    <div class="text-right" :class="{ 'opacity-55': !item.available }">
      <p class="text-sm font-semibold">{{ formatMoney(item.price) }}</p>
      <p v-if="onSale" class="text-xs text-ink-soft line-through">{{ t('menu.row.was', { price: formatMoney(item.was_price) }) }}</p>
    </div>

    <!-- On a phone the switch and Edit share one line under the name. -->
    <div class="col-span-2 flex items-center justify-between sm:contents">
      <!-- Counted per size and colour: the counts say what's sold out, not a switch. -->
      <span v-if="item.variants?.length" class="text-xs whitespace-nowrap text-ink-soft">{{ t('menu.row.bySize') }}</span>
      <span v-else-if="locked" class="text-xs whitespace-nowrap text-ink-soft">{{ item.available ? t('menu.row.on') : offWord }}</span>
      <div v-else class="flex items-center gap-2">
        <ToggleSwitch
          :model-value="item.available"
          :label="t('menu.row.isAvailable', { name: item.name })"
          @update:model-value="$emit('toggle')"
        ></ToggleSwitch>
        <!-- Only the exception is spelled out: a switch that is on says enough. -->
        <span v-if="!item.available" class="text-xs font-medium whitespace-nowrap text-ink-soft">{{ offWord }}</span>
      </div>

      <div class="flex items-center justify-end gap-1">
        <template v-if="page">
          <a
            :href="page"
            target="_blank"
            rel="noopener"
            class="btn btn-quiet btn-icon !h-8 !w-8"
            :aria-label="t('menu.row.openPageOf', { name: item.name })"
            :title="t('menu.row.openPage')"
          >
            <PhArrowSquareOut :size="18"></PhArrowSquareOut>
          </a>
          <button
            type="button"
            class="btn btn-quiet btn-icon !h-8 !w-8"
            :aria-label="copied ? t('menu.row.linkCopied') : t('menu.row.copyLinkOf', { name: item.name })"
            :title="copied ? t('menu.row.linkCopied') : t('menu.row.copyLink')"
            @click="copyLink"
          >
            <component :is="copied ? PhCheck : PhLinkSimple" :size="18" :class="{ 'text-success': copied }"></component>
          </button>
        </template>
        <button
          v-if="!locked || kind === 'shop'"
          type="button"
          class="btn btn-quiet btn-icon !h-8 !w-8"
          :aria-label="locked ? t('menu.row.photosOf', { name: item.name }) : t('menu.row.editName', { name: item.name })"
          :title="locked ? t('menu.row.photos') : t('common.edit')"
          @click="$emit('edit')"
        >
          <component :is="locked ? PhImage : PhPencilSimple" :size="18"></component>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhCalendarBlank, PhCheck, PhClock, PhImage, PhInfo, PhLinkSimple, PhPalette, PhPackage, PhPencilSimple, PhRuler, PhTranslate } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { productLink } from '../../lib/presets.js';

// Known facts get an icon instead of a label.
const FACT_ICONS = {
  days: PhCalendarBlank,
  hours: PhClock,
  languages: PhTranslate,
};

// "L/White", "L" or "White": one count's size and colour.
function variantLabel(variant) {
  return [variant.size, variant.colour].filter(Boolean).join('/');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const props = defineProps({
  item: { type: Object, required: true },
  editing: { type: Boolean, default: false }, // its sheet is open
  // The preset: "restaurant", "clinic" or "shop".
  kind: { type: String, default: null },
  // The agent's key: a shop's product then shows its public page (backend D121, D161).
  publicKey: { type: String, default: null },
  // A Google Sheet is the list: only a shop's photos change here (backend D58).
  locked: { type: Boolean, default: false },
});
defineEmits(['toggle', 'edit']);
const { t } = useI18n();

// The list's columns, as its header's (MenuPage): a shop's last one holds its page's two buttons too.
const columns = computed(() =>
  props.kind === 'shop' ? 'sm:grid-cols-[minmax(0,1fr)_7rem_7.5rem_7rem]' : 'sm:grid-cols-[minmax(0,1fr)_7rem_7.5rem_2.5rem]',
);

const onSale = computed(() => props.kind === 'shop' && props.item.was_price > props.item.price);
const offWord = computed(() => (props.kind === 'clinic' ? t('menu.row.away') : t('menu.row.soldOut')));
const page = computed(() => (props.kind === 'shop' && props.publicKey ? productLink(props.publicKey, props.item.code) : ''));

// The link, on the clipboard for two seconds (a tick on the button). A blocked
// clipboard does nothing: Open shows the page to copy from.
const copied = ref(false);
let timer = null;
async function copyLink() {
  try {
    await navigator.clipboard.writeText(page.value);
  } catch (error) {
    return;
  }
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 2000);
}
onBeforeUnmount(() => clearTimeout(timer));

// A business's own facts (a doctor's days, hours and languages) are shown
// but edited through the CSV import.
const facts = computed(() => {
  const item = props.item;
  if (props.kind === 'shop') {
    const shown = [];
    if (item.sizes?.length) shown.push({ key: 'sizes', icon: PhRuler, text: item.sizes.join(', ') });
    if (item.colours?.length) shown.push({ key: 'colours', icon: PhPalette, text: item.colours.join(', ') });
    if (item.stock > 0) shown.push({ key: 'stock', icon: PhPackage, text: t('menu.row.stockCount', { n: formatNumber(item.stock) }) });
    if (item.variants?.length) {
      const text = item.variants.map((v) => `${variantLabel(v)} ${formatNumber(v.stock)}`).join(', ');
      shown.push({ key: 'variants', icon: PhPackage, text });
    }
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
</script>
