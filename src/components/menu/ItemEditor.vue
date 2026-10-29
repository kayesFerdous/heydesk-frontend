<template>
  <!-- The form for one entry, in a sheet over the list from the right: the list stays
       in view, the form has the room it needs, and Save is always at the bottom.
       Mounted each time editing starts, so it begins from the item as saved. -->
  <Teleport to="body">
    <div class="overlay fixed inset-0 z-40 flex justify-end" :class="{ 'is-leaving': leaving }">
      <div class="absolute inset-0 bg-ink/30" @click="close"></div>
      <form
        class="slide-from-right relative flex h-full w-full max-w-xl flex-col bg-surface shadow-[var(--shadow-float)]"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        novalidate
        @submit.prevent="submit"
      >
        <header class="flex items-center gap-3 border-b border-hairline px-5 py-4 sm:px-6">
          <img v-if="shop && photos[0]" :src="photos[0]" alt="" class="size-10 rounded-[var(--radius-thumb)] object-cover ring-1 ring-hairline" />
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold">{{ title }}</h2>
            <p v-if="!isNew" class="truncate text-sm text-ink-soft">{{ item.name }}</p>
          </div>
          <button type="button" class="btn btn-quiet btn-icon" :aria-label="t('common.close')" @click="close">
            <PhX :size="20"></PhX>
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p v-if="locked" class="hint mx-5 mt-4 sm:mx-6">{{ t('menu.sheet.onlyPhotos') }}</p>

          <!-- Photos (D57): uploaded at once, kept when the product is saved. The first is the one the agent shows. -->
          <section v-if="shop" class="section">
            <h3 class="mb-3 text-sm font-semibold">{{ t('menu.row.photos') }}</h3>
            <div class="flex flex-wrap gap-3">
              <div v-for="(url, index) in photos" :key="url" class="relative">
                <img :src="url" :alt="t('menu.row.photoOf', { name, n: index + 1 })" class="size-24 rounded-[var(--radius-card)] object-cover ring-1 ring-hairline" />
                <span v-if="index === 0 && photos.length > 1" class="chip absolute bottom-1.5 left-1.5 bg-surface/90 !py-0 text-[0.6875rem]">{{ t('menu.editor.mainPhoto') }}</span>
                <button
                  type="button"
                  class="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-surface text-ink-soft shadow-[var(--shadow-lift)] ring-1 ring-hairline hover:text-danger"
                  :aria-label="t('menu.row.removePhoto', { n: index + 1 })"
                  @click="photos.splice(index, 1)"
                >
                  <PhX :size="12" weight="bold"></PhX>
                </button>
              </div>
              <label
                v-if="photos.length < MAX_PHOTOS"
                class="grid size-24 cursor-pointer place-items-center rounded-[var(--radius-card)] border border-dashed border-ink-faint text-ink-soft transition-colors hover:border-ink hover:text-ink"
                :class="{ 'pointer-events-none opacity-60': uploading }"
              >
                <span class="flex flex-col items-center gap-1 text-xs font-medium">
                  <PhImage :size="22"></PhImage>
                  {{ uploading ? t('menu.row.addingPhoto') : t('menu.row.addPhoto') }}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="uploading" @change="addPhoto" />
              </label>
            </div>
            <p class="hint">{{ t('menu.row.photosHint') }}</p>
            <p v-if="errors.photos" class="error-text">{{ errors.photos }}</p>
          </section>

          <!-- While a Google Sheet is the list, only photos change here (D58). -->
          <fieldset :disabled="locked" class="contents">
            <section class="section">
              <h3 class="mb-3 text-sm font-semibold">{{ t('menu.editor.details') }}</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="label" :for="`n-${uid}`">{{ t('menu.row.name') }}</label>
                  <input :id="`n-${uid}`" ref="nameInput" v-model.trim="name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
                  <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
                </div>
                <div class="sm:col-span-2">
                  <label class="label" :for="`d-${uid}`">{{ t('menu.row.description') }}</label>
                  <textarea :id="`d-${uid}`" v-model="description" rows="3" class="field resize-y"></textarea>
                </div>
                <div :class="{ 'sm:col-span-2': shop }">
                  <label class="label" :for="`c-${uid}`">{{ kind === 'clinic' ? t('menu.row.speciality') : t('menu.row.category') }}</label>
                  <input :id="`c-${uid}`" v-model.trim="category" class="field" :class="{ 'field-invalid': errors.category }" type="text" :list="`cats-${uid}`" />
                  <datalist :id="`cats-${uid}`">
                    <option v-for="c in categories" :key="c" :value="c"></option>
                  </datalist>
                  <p v-if="errors.category" class="error-text">{{ errors.category }}</p>
                </div>
                <template v-if="!shop">
                  <div>
                    <label class="label" :for="`p-${uid}`">{{ kind === 'clinic' ? t('menu.fee') : t('menu.price') }} (৳)</label>
                    <input :id="`p-${uid}`" v-model.trim="priceText" class="field" :class="{ 'field-invalid': errors.price }" type="text" inputmode="decimal" placeholder="450" />
                    <p v-if="errors.price" class="error-text">{{ errors.price }}</p>
                  </div>
                  <div class="sm:col-span-2">
                    <FieldLabel :html-for="`t-${uid}`" :tip="t('menu.row.tagsHint')">{{ t('menu.row.tags') }}</FieldLabel>
                    <input :id="`t-${uid}`" v-model="tagsText" class="field" type="text" placeholder="popular, spicy, vegetarian" />
                  </div>
                </template>
              </div>
            </section>

            <template v-if="shop">
              <section class="section">
                <h3 class="mb-3 text-sm font-semibold">{{ t('menu.price') }}</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="label" :for="`p-${uid}`">{{ t('menu.price') }} (৳)</label>
                    <input :id="`p-${uid}`" v-model.trim="priceText" class="field" :class="{ 'field-invalid': errors.price }" type="text" inputmode="decimal" placeholder="450" />
                    <p v-if="errors.price" class="error-text">{{ errors.price }}</p>
                  </div>
                  <div>
                    <FieldLabel :html-for="`w-${uid}`" :tip="t('menu.row.wasPriceHint')">{{ t('menu.row.wasPrice') }} (৳)</FieldLabel>
                    <input :id="`w-${uid}`" v-model.trim="wasText" class="field" :class="{ 'field-invalid': errors.was_price }" type="text" inputmode="decimal" />
                    <p v-if="errors.was_price" class="error-text">{{ errors.was_price }}</p>
                    <p v-else-if="off > 0" class="hint">{{ t('menu.editor.showsOff', { n: off }) }}</p>
                  </div>
                </div>
              </section>

              <section class="section">
                <h3 class="mb-3 text-sm font-semibold">{{ t('menu.editor.stock') }}</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel :html-for="`sz-${uid}`" :tip="t('menu.row.sizesHint')">{{ t('menu.row.sizes') }}</FieldLabel>
                    <input :id="`sz-${uid}`" v-model="sizesText" class="field" type="text" placeholder="M, L, XL" />
                  </div>
                  <div>
                    <label class="label" :for="`cl-${uid}`">{{ t('menu.row.colours') }}</label>
                    <input :id="`cl-${uid}`" v-model="coloursText" class="field" type="text" placeholder="White, Navy" />
                  </div>

                  <!-- Stock per size and colour: one line per count, "any" for every size or colour. -->
                  <div v-if="counts.length" class="sm:col-span-2">
                    <p class="label flex items-center gap-1.5">{{ t('menu.row.stockBySize') }} <InfoTip :text="t('menu.row.stockBySizeHint')"></InfoTip></p>
                    <div class="flex flex-col gap-2">
                      <div v-for="(count, index) in counts" :key="index" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] items-center gap-2">
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
                  </div>
                  <div v-else>
                    <FieldLabel :html-for="`st-${uid}`" :tip="t('menu.row.stockHint')">{{ t('menu.row.inStock') }}</FieldLabel>
                    <input :id="`st-${uid}`" v-model.trim="stockText" class="field" :class="{ 'field-invalid': errors.stock }" type="text" inputmode="numeric" :placeholder="t('menu.row.notCounted')" />
                    <p v-if="errors.stock" class="error-text">{{ errors.stock }}</p>
                    <button v-if="sizeChoices.length || colourChoices.length" type="button" class="btn btn-quiet btn-sm mt-1 !px-0" @click="addCount">
                      {{ t('menu.row.countBySize') }}
                    </button>
                  </div>
                </div>
              </section>

              <!-- Videos and what goes with it (backend D125). -->
              <section class="section">
                <h3 class="mb-3 text-sm font-semibold">{{ t('menu.editor.more') }}</h3>
                <div class="grid gap-4">
                  <div>
                    <FieldLabel :html-for="`v-${uid}`" :tip="t('menu.row.videosHint')">{{ t('menu.row.videos') }}</FieldLabel>
                    <input :id="`v-${uid}`" v-model="videosText" class="field" :class="{ 'field-invalid': errors.videos }" type="text" inputmode="url" placeholder="https://youtu.be/…" />
                    <p v-if="errors.videos" class="error-text">{{ errors.videos }}</p>
                  </div>
                  <div>
                    <FieldLabel :html-for="`g-${uid}`" :tip="t('menu.row.goesWithHint')">{{ t('menu.row.goesWith') }}</FieldLabel>
                    <input :id="`g-${uid}`" v-model="goesWithText" class="field" :class="{ 'field-invalid': errors.goes_with }" type="text" placeholder="pajama-white, tupi" />
                    <p v-if="errors.goes_with" class="error-text">{{ errors.goes_with }}</p>
                  </div>
                </div>
              </section>
            </template>
          </fieldset>
        </div>

        <p v-if="failed" class="border-t border-hairline px-5 py-2.5 text-sm text-danger sm:px-6" role="alert">{{ failed }}</p>
        <footer class="flex flex-wrap items-center gap-2 border-t border-hairline bg-surface px-5 py-3.5 sm:px-6">
          <template v-if="discarding">
            <span class="mr-auto text-sm font-medium">{{ t('menu.editor.discardThis') }}</span>
            <button type="button" class="btn btn-danger btn-sm" @click="$emit('cancel')">{{ t('common.discard') }}</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="discarding = false">{{ t('menu.editor.keepEditing') }}</button>
          </template>
          <template v-else-if="confirming">
            <span class="mr-auto text-sm font-medium">{{ t('menu.row.deleteThis', { noun }) }}</span>
            <button type="button" class="btn btn-danger btn-sm" @click="$emit('remove')">{{ t('common.delete') }}</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="confirming = false">{{ t('common.keepIt') }}</button>
          </template>
          <template v-else>
            <button type="submit" class="btn btn-primary" :disabled="saving || uploading">{{ t('common.save') }}</button>
            <button type="button" class="btn btn-quiet" @click="close">{{ t('common.cancel') }}</button>
            <button v-if="!isNew && !locked" type="button" class="btn btn-quiet ml-auto !text-danger" @click="confirming = true">
              <PhTrash :size="16"></PhTrash>
              {{ t('menu.row.delete', { noun }) }}
            </button>
          </template>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhImage, PhPlus, PhTrash, PhX } from '@phosphor-icons/vue';

import FieldLabel from '../ui/FieldLabel.vue';
import InfoTip from '../ui/InfoTip.vue';
import { uploadProductPhoto } from '../../api/agent.js';
import { itemNoun } from '../../lib/presets.js';

const MAX_PHOTOS = 3; // a product's photos; the first is the one the agent shows
const MAX_LINKS = 3; // a product's videos, and the products that go with it (backend D125)

// "M, L , XL" -> ["M", "L", "XL"]
function list(text) {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const wholeCount = (text) => Number.isInteger(Number(text)) && Number(text) >= 0;

const props = defineProps({
  item: { type: Object, required: true },
  isNew: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  // The preset: "restaurant", "clinic" or "shop".
  kind: { type: String, default: null },
  // A Google Sheet is the list: only a shop's photos change here (backend D58).
  locked: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  // Why the last save didn't go through, from the server.
  failed: { type: String, default: null },
  // Closed, and sliding out (usePresence in MenuPage).
  leaving: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'save', 'remove']);
const { t } = useI18n();

const uid = useId();
const nameInput = ref(null);
const item = props.item;
const shop = props.kind === 'shop';
const noun = itemNoun(props.kind);

const name = ref(item.name);
const description = ref(item.description);
const category = ref(item.category);
const priceText = ref(item.price ? String(item.price / 100) : '');
const tagsText = ref(item.tags.join(', '));
const sizesText = ref((item.sizes || []).join(', '));
const coloursText = ref((item.colours || []).join(', '));
const stockText = ref(item.stock === null || item.stock === undefined ? '' : String(item.stock));
const wasText = ref(item.was_price ? String(item.was_price / 100) : '');
// Stock per size and colour (D56): [{ size, colour, stock }], "" for any size or colour.
const counts = ref((item.variants || []).map((v) => ({ size: v.size, colour: v.colour, stock: String(v.stock) })));
const videosText = ref((item.videos || []).join(', '));
const goesWithText = ref((item.goes_with || []).join(', '));
const photos = ref([...(item.photos || [])]); // their URLs, as the backend gave them
const uploading = ref(false);
const errors = ref({});
const confirming = ref(false);
// Closing with changes not saved asks first: a click beside the sheet is easy to make.
const discarding = ref(false);

// Everything the form holds, to tell whether anything changed since it opened.
const snapshot = () =>
  JSON.stringify([name.value, description.value, category.value, priceText.value, tagsText.value, sizesText.value, coloursText.value, stockText.value, wasText.value, counts.value, videosText.value, goesWithText.value, photos.value]);
const opened = snapshot();
const changed = computed(() => snapshot() !== opened);

const title = computed(() => (props.isNew ? t('menu.editor.newTitle', { noun }) : t('menu.editor.editTitle', { noun })));

// What a count can name: the sizes and colours as typed above.
const sizeChoices = computed(() => list(sizesText.value));
const colourChoices = computed(() => list(coloursText.value));
// "Shows as 24% off", once both prices make sense.
const off = computed(() => {
  const price = Number(priceText.value);
  const was = Number(wasText.value);
  return shop && priceText.value && wasText.value && was > price && price >= 0 ? Math.round(((was - price) * 100) / was) : 0;
});

function close() {
  if (changed.value) discarding.value = true;
  else emit('cancel');
}

function onKey(event) {
  if (event.key === 'Escape') close();
}
onMounted(() => {
  document.addEventListener('keydown', onKey);
  if (props.isNew) nameInput.value?.focus();
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));

function addCount() {
  counts.value.push({ size: sizeChoices.value[0] || '', colour: '', stock: '' });
}

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
  if (shop && was !== null && !(was > price)) found.was_price = t('menu.row.wasPriceError');
  if (shop && stock !== null && !wholeCount(stockText.value)) found.stock = t('menu.row.stockError');
  if (counts.value.some((c) => c.stock === '' || !wholeCount(c.stock))) found.variants = t('menu.row.stockBySizeError');
  const videos = list(videosText.value);
  const goesWith = list(goesWithText.value);
  if (videos.length > MAX_LINKS || videos.some((link) => !/^https?:\/\//.test(link))) found.videos = t('menu.row.videosError');
  if (goesWith.length > MAX_LINKS) found.goes_with = t('menu.row.goesWithError');
  if (!name.value) found.name = t('menu.row.nameError');
  if (priceText.value === '' || Number.isNaN(price) || price < 0) found.price = t('menu.row.priceError');
  if (!category.value) found.category = t('menu.row.categoryError');
  errors.value = found;
  if (Object.keys(found).length) return;

  const variants = counts.value.map((c) => ({ size: c.size, colour: c.colour, stock: Number(c.stock) }));
  const product = shop
    ? {
        sizes: sizeChoices.value,
        colours: colourChoices.value,
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
    ...item,
    ...product,
    name: name.value,
    description: description.value,
    category: category.value,
    price: Math.round(price * 100),
    tags: list(tagsText.value),
  });
}
</script>

<style scoped>
.section {
  border-bottom: 1px solid var(--color-hairline);
  padding: 1.25rem 1.25rem;
}
.section:last-child {
  border-bottom: 0;
}
@media (min-width: 640px) {
  .section {
    padding-inline: 1.5rem;
  }
}
</style>
