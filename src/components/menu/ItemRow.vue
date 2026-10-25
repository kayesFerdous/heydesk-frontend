<template>
  <!-- Reading: name (with its tags), price, whether it is offered, edit. -->
  <div
    v-if="!editing"
    class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_7.5rem_2.5rem] sm:px-8"
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

      <div class="sm:text-right">
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

  <!-- Editing, in the row itself -->
  <form v-else class="border-b border-hairline bg-wash px-5 py-5 sm:px-8" novalidate @submit.prevent="submit">
    <p v-if="locked" class="hint mb-4 !mt-0">{{ t('menu.sheet.onlyPhotos') }}</p>
    <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
      <!-- While a Google Sheet is the list, only photos change here (D58). -->
      <fieldset :disabled="locked" class="contents">
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
          <FieldLabel :html-for="`w-${uid}`" :tip="t('menu.row.wasPriceHint')">{{ t('menu.row.wasPrice') }} (৳)</FieldLabel>
          <input :id="`w-${uid}`" v-model.trim="wasText" class="field" :class="{ 'field-invalid': errors.was_price }" type="text" inputmode="decimal" />
          <p v-if="errors.was_price" class="error-text">{{ errors.was_price }}</p>
        </div>
        <div>
          <FieldLabel :html-for="`sz-${uid}`" :tip="t('menu.row.sizesHint')">{{ t('menu.row.sizes') }}</FieldLabel>
          <input :id="`sz-${uid}`" v-model="sizesText" class="field" type="text" placeholder="M, L, XL" />
        </div>
        <div>
          <label class="label" :for="`cl-${uid}`">{{ t('menu.row.colours') }}</label>
          <input :id="`cl-${uid}`" v-model="coloursText" class="field" type="text" placeholder="White, Navy" />
        </div>
        <div v-if="!counts.length">
          <FieldLabel :html-for="`st-${uid}`" :tip="t('menu.row.stockHint')">{{ t('menu.row.inStock') }}</FieldLabel>
          <input :id="`st-${uid}`" v-model.trim="stockText" class="field" :class="{ 'field-invalid': errors.stock }" type="text" inputmode="numeric" :placeholder="t('menu.row.notCounted')" />
          <p v-if="errors.stock" class="error-text">{{ errors.stock }}</p>
          <button v-if="sizeChoices.length || colourChoices.length" type="button" class="btn btn-quiet btn-sm mt-1 !px-0" @click="addCount">
            {{ t('menu.row.countBySize') }}
          </button>
        </div>
        <!-- Videos and what goes with it (backend D125). -->
        <div class="sm:col-span-2">
          <FieldLabel :html-for="`v-${uid}`" :tip="t('menu.row.videosHint')">{{ t('menu.row.videos') }}</FieldLabel>
          <input :id="`v-${uid}`" v-model="videosText" class="field" :class="{ 'field-invalid': errors.videos }" type="text" inputmode="url" placeholder="https://youtu.be/…" />
          <p v-if="errors.videos" class="error-text">{{ errors.videos }}</p>
        </div>
        <div class="sm:col-span-2">
          <FieldLabel :html-for="`g-${uid}`" :tip="t('menu.row.goesWithHint')">{{ t('menu.row.goesWith') }}</FieldLabel>
          <input :id="`g-${uid}`" v-model="goesWithText" class="field" :class="{ 'field-invalid': errors.goes_with }" type="text" placeholder="pajama-white, tupi" />
          <p v-if="errors.goes_with" class="error-text">{{ errors.goes_with }}</p>
        </div>
      </template>
      <div v-else class="sm:col-span-2">
        <FieldLabel :html-for="`t-${uid}`" :tip="t('menu.row.tagsHint')">{{ t('menu.row.tags') }}</FieldLabel>
        <input :id="`t-${uid}`" v-model="tagsText" class="field" type="text" placeholder="popular, spicy, vegetarian" />
      </div>
      </fieldset>

      <template v-if="kind === 'shop'">

        <!-- Photos (D57): uploaded at once, kept when the product is saved. -->
        <div class="sm:col-span-2">
          <p class="label flex items-center gap-1.5">{{ t('menu.row.photos') }} <InfoTip :text="t('menu.row.photosHint')"></InfoTip></p>
          <div class="flex flex-wrap items-center gap-2">
            <div v-for="(url, index) in photos" :key="url" class="relative">
              <img :src="url" :alt="t('menu.row.photoOf', { name: draft.name, n: index + 1 })" class="size-20 rounded-[var(--radius-thumb)] object-cover ring-1 ring-hairline" />
              <button
                type="button"
                class="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-surface text-ink-soft shadow-[var(--shadow-lift)] ring-1 ring-hairline hover:text-danger"
                :aria-label="t('menu.row.removePhoto', { n: index + 1 })"
                @click="photos.splice(index, 1)"
              >
                <PhX :size="12" weight="bold"></PhX>
              </button>
            </div>
            <label v-if="photos.length < MAX_PHOTOS" class="btn btn-secondary btn-sm cursor-pointer" :class="{ 'pointer-events-none opacity-60': uploading }">
              <PhImage :size="16"></PhImage>
              {{ uploading ? t('menu.row.addingPhoto') : t('menu.row.addPhoto') }}
              <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="uploading" @change="addPhoto" />
            </label>
          </div>
          <p v-if="errors.photos" class="error-text">{{ errors.photos }}</p>
        </div>

        <!-- Stock per size and colour: one line per count, "any" for every size or colour. -->
        <fieldset v-if="counts.length" :disabled="locked" class="sm:col-span-2">
          <p class="label flex items-center gap-1.5">{{ t('menu.row.stockBySize') }} <InfoTip :text="t('menu.row.stockBySizeHint')"></InfoTip></p>
          <div class="flex flex-col gap-2">
            <div v-for="(count, index) in counts" :key="index" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem_auto] items-center gap-2">
              <select v-model="count.size" class="field" :aria-label="t('menu.row.sizes')">
                <option value="">{{ t('menu.row.anySize') }}</option>
                <option v-for="size in sizeChoices" :key="size" :value="size">{{ size }}</option>
              </select>
              <select v-model="count.colour" class="field" :aria-label="t('menu.row.colours')">
                <option value="">{{ t('menu.row.anyColour') }}</option>
                <option v-for="colour in colourChoices" :key="colour" :value="colour">{{ colour }}</option>
              </select>
              <input v-model.trim="count.stock" class="field" :class="{ 'field-invalid': errors.variants }" type="text" inputmode="numeric" :aria-label="t('menu.row.inStock')" />
              <button type="button" class="btn btn-quiet !px-2.5" :aria-label="t('menu.row.removeCount')" @click="counts.splice(index, 1)">
                <PhTrash :size="18"></PhTrash>
              </button>
            </div>
          </div>
          <p v-if="errors.variants" class="error-text">{{ errors.variants }}</p>
          <button type="button" class="btn btn-secondary btn-sm mt-2" @click="addCount">
            <PhPlus :size="14" weight="bold"></PhPlus>
            {{ t('menu.row.addCount') }}
          </button>
        </fieldset>
      </template>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <button type="submit" class="btn btn-primary">{{ t('common.save') }}</button>
      <button type="button" class="btn btn-quiet" @click="$emit('cancel')">{{ t('common.cancel') }}</button>

      <template v-if="!isNew && !locked">
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
import { PhCalendarBlank, PhClock, PhImage, PhInfo, PhPalette, PhPackage, PhPencilSimple, PhPlus, PhRuler, PhTranslate, PhTrash, PhX } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import FieldLabel from '../ui/FieldLabel.vue';
import InfoTip from '../ui/InfoTip.vue';
import { uploadProductPhoto } from '../../api/agent.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { itemNoun } from '../../lib/presets.js';

// Known facts get an icon instead of a label.
const FACT_ICONS = {
  days: PhCalendarBlank,
  hours: PhClock,
  languages: PhTranslate,
};

const MAX_PHOTOS = 3; // a product's photos; the first is the one the agent shows
const MAX_LINKS = 3; // a product's videos, and the products that go with it (backend D125)

// "M, L , XL" -> ["M", "L", "XL"]
function list(text) {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

// "L/White", "L" or "White": one count's size and colour.
function variantLabel(variant) {
  return [variant.size, variant.colour].filter(Boolean).join('/');
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
  // A Google Sheet is the list: only a shop's photos change here (backend D58).
  locked: { type: Boolean, default: false },
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
// Stock per size and colour (D56): [{ size, colour, stock }], "" for any size or colour.
const counts = ref([]);
const wasText = ref('');
const videosText = ref('');
const goesWithText = ref('');
const photos = ref([]); // their URLs, as the backend gave them
const uploading = ref(false);
const errors = ref({});
const confirming = ref(false);

const noun = computed(() => itemNoun(props.kind));
const onSale = computed(() => props.kind === 'shop' && props.item.was_price > props.item.price);
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

// What a count can name: the sizes and colours as typed above.
const sizeChoices = computed(() => list(sizesText.value));
const colourChoices = computed(() => list(coloursText.value));

function addCount() {
  counts.value.push({ size: sizeChoices.value[0] || '', colour: '', stock: '' });
}

// Copy the item into the form each time editing starts.
function fillForm() {
  const item = props.item;
  draft.value = { ...item };
  priceText.value = item.price ? String(item.price / 100) : '';
  tagsText.value = item.tags.join(', ');
  sizesText.value = (item.sizes || []).join(', ');
  coloursText.value = (item.colours || []).join(', ');
  stockText.value = item.stock === null || item.stock === undefined ? '' : String(item.stock);
  counts.value = (item.variants || []).map((v) => ({ size: v.size, colour: v.colour, stock: String(v.stock) }));
  wasText.value = item.was_price ? String(item.was_price / 100) : '';
  videosText.value = (item.videos || []).join(', ');
  goesWithText.value = (item.goes_with || []).join(', ');
  photos.value = [...(item.photos || [])];
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

// The photo goes up now (the backend makes it a JPEG and indexes it); the
// product keeps it when it's saved.
async function addPhoto(event) {
  const file = event.target.files[0];
  event.target.value = ''; // the same file can be picked again
  if (!file) return;
  uploading.value = true;
  errors.value = { ...errors.value, photos: null };
  try {
    photos.value.push((await uploadProductPhoto(file)).url);
  } catch (error) {
    errors.value = { ...errors.value, photos: error.message };
  }
  uploading.value = false;
}

function submit() {
  const found = {};
  const price = Number(priceText.value);
  const stock = stockText.value === '' ? null : Number(stockText.value);
  const was = wasText.value === '' ? null : Number(wasText.value);
  if (props.kind === 'shop' && was !== null && !(was > price)) found.was_price = t('menu.row.wasPriceError');
  if (props.kind === 'shop' && stock !== null && !(Number.isInteger(stock) && stock >= 0)) {
    found.stock = t('menu.row.stockError');
  }
  const variants = counts.value.map((c) => ({ size: c.size, colour: c.colour, stock: Number(c.stock) }));
  if (counts.value.some((c) => c.stock === '' || !(Number.isInteger(Number(c.stock)) && Number(c.stock) >= 0))) {
    found.variants = t('menu.row.stockBySizeError');
  }
  const videos = list(videosText.value);
  const goesWith = list(goesWithText.value);
  if (videos.length > MAX_LINKS || videos.some((link) => !/^https?:\/\//.test(link))) {
    found.videos = t('menu.row.videosError');
  }
  if (goesWith.length > MAX_LINKS) found.goes_with = t('menu.row.goesWithError');
  if (!draft.value.name) found.name = t('menu.row.nameError');
  if (priceText.value === '' || Number.isNaN(price) || price < 0) found.price = t('menu.row.priceError');
  if (!draft.value.category) found.category = t('menu.row.categoryError');
  errors.value = found;
  if (Object.keys(found).length) return;

  const product =
    props.kind === 'shop'
      ? {
          sizes: list(sizesText.value),
          colours: list(coloursText.value),
          // With counts per size and colour, they hold the stock (D56).
          stock: variants.length ? null : stock,
          variants,
          available: variants.length ? true : stock !== 0,
          was_price: was === null ? null : Math.round(was * 100),
          photos: photos.value,
          videos,
          goes_with: goesWith,
        }
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
