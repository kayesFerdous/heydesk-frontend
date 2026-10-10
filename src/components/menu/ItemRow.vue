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

    <p class="text-right text-sm font-semibold" :class="{ 'opacity-55': !item.available }">{{ money(item.price) }}</p>

    <!-- On a phone the switch and Edit share one line under the name. -->
    <div class="col-span-2 flex items-center justify-between sm:contents">
      <div class="flex items-center gap-2">
        <toggle-switch
          :model-value="item.available"
          :label="`${item.name} is available`"
          @update:model-value="$emit('toggle')"
        ></toggle-switch>
        <span class="text-xs whitespace-nowrap text-ink-soft">{{ item.available ? 'On' : offWord }}</span>
      </div>

      <div class="sm:text-right">
        <button type="button" class="btn btn-quiet btn-sm" @click="$emit('edit')">Edit</button>
      </div>
    </div>
  </div>

  <!-- Editing, in the row itself -->
  <form v-else class="border-b border-hairline bg-brand-tint/40 px-5 py-5 sm:px-8" novalidate @submit.prevent="submit">
    <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="label" :for="`n-${uid}`">Name</label>
        <input :id="`n-${uid}`" ref="name" v-model.trim="draft.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
        <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
      </div>
      <div>
        <label class="label" :for="`p-${uid}`">{{ noun === 'doctor' ? 'Fee' : 'Price' }} (৳)</label>
        <input :id="`p-${uid}`" v-model.trim="priceText" class="field" :class="{ 'field-invalid': errors.price }" type="text" inputmode="decimal" placeholder="450" />
        <p v-if="errors.price" class="error-text">{{ errors.price }}</p>
      </div>
      <div>
        <label class="label" :for="`c-${uid}`">{{ noun === 'doctor' ? 'Speciality' : 'Category' }}</label>
        <input :id="`c-${uid}`" v-model.trim="draft.category" class="field" :class="{ 'field-invalid': errors.category }" type="text" :list="`cats-${uid}`" />
        <datalist :id="`cats-${uid}`">
          <option v-for="category in categories" :key="category" :value="category"></option>
        </datalist>
        <p v-if="errors.category" class="error-text">{{ errors.category }}</p>
      </div>
      <div class="sm:col-span-2">
        <label class="label" :for="`d-${uid}`">Description</label>
        <input :id="`d-${uid}`" v-model="draft.description" class="field" type="text" />
      </div>
      <template v-if="noun === 'product'">
        <div>
          <label class="label" :for="`sz-${uid}`">Sizes</label>
          <input :id="`sz-${uid}`" v-model="sizesText" class="field" type="text" placeholder="M, L, XL" />
          <p class="hint">Separate with commas. Leave empty if it has none.</p>
        </div>
        <div>
          <label class="label" :for="`cl-${uid}`">Colours</label>
          <input :id="`cl-${uid}`" v-model="coloursText" class="field" type="text" placeholder="White, Navy" />
        </div>
        <div>
          <label class="label" :for="`st-${uid}`">In stock</label>
          <input :id="`st-${uid}`" v-model.trim="stockText" class="field" :class="{ 'field-invalid': errors.stock }" type="text" inputmode="numeric" placeholder="Not counted" />
          <p v-if="errors.stock" class="error-text">{{ errors.stock }}</p>
          <p v-else class="hint">Empty: not counted. Each order takes from it; 0 is sold out.</p>
        </div>
      </template>
      <div v-else class="sm:col-span-2">
        <label class="label" :for="`t-${uid}`">Tags</label>
        <input :id="`t-${uid}`" v-model="tagsText" class="field" type="text" placeholder="popular, spicy, vegetarian" />
        <p class="hint">Separate with commas. Your agent uses tags to recommend.</p>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <button type="submit" class="btn btn-primary">Save</button>
      <button type="button" class="btn btn-quiet" @click="$emit('cancel')">Cancel</button>

      <template v-if="!isNew">
        <span class="flex-1"></span>
        <span v-if="confirming" class="flex items-center gap-2 text-sm">
          Delete this {{ noun }}?
          <button type="button" class="btn btn-danger btn-sm" @click="$emit('remove')">Delete</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="confirming = false">Keep it</button>
        </span>
        <button v-else type="button" class="btn btn-quiet !text-danger" @click="confirming = true">
          Delete {{ noun }}
        </button>
      </template>
    </div>
  </form>
</template>

<script>
import { PhCalendarBlank, PhClock, PhInfo, PhPalette, PhPackage, PhRuler, PhTranslate } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { formatMoney } from '../../lib/format.js';

let nextUid = 0;

// Known facts get an icon instead of a label.
const FACTS = {
  days: { icon: PhCalendarBlank },
  hours: { icon: PhClock },
  languages: { icon: PhTranslate },
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

export default {
  components: { ToggleSwitch },
  props: {
    item: { type: Object, required: true },
    editing: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    categories: { type: Array, default: () => [] },
    noun: { type: String, default: 'item' },
  },
  emits: ['toggle', 'edit', 'cancel', 'save', 'remove'],
  data() {
    nextUid += 1;
    return {
      uid: nextUid,
      draft: { ...this.item },
      priceText: this.item.price ? String(this.item.price / 100) : '',
      tagsText: this.item.tags.join(', '),
      ...this.productTexts(),
      errors: {},
      confirming: false,
    };
  },
  computed: {
    // A business's own facts (a doctor's days, hours and languages) are shown
    // but edited through the CSV import.
    facts() {
      if (this.noun === 'product') {
        const item = this.item;
        const facts = [];
        if (item.sizes && item.sizes.length) facts.push({ key: 'sizes', icon: PhRuler, text: item.sizes.join(', ') });
        if (item.colours && item.colours.length) facts.push({ key: 'colours', icon: PhPalette, text: item.colours.join(', ') });
        if (item.stock > 0) facts.push({ key: 'stock', icon: PhPackage, text: `${item.stock} in stock` });
        return facts;
      }
      const attributes = this.item.attributes || {};
      return Object.keys(attributes)
        .filter((key) => [].concat(attributes[key]).length)
        .map((key) => {
          const values = [].concat(attributes[key]).map((value) => capitalize(String(value)));
          const look = FACTS[key] || { icon: PhInfo, label: capitalize(key) + ': ' };
          return { key, icon: look.icon, text: (look.label || '') + values.join(', ') };
        });
    },
    offWord() {
      return this.noun === 'doctor' ? 'Away' : 'Sold out';
    },
  },
  watch: {
    editing(isEditing) {
      if (isEditing) {
        this.draft = { ...this.item };
        this.priceText = this.item.price ? String(this.item.price / 100) : '';
        this.tagsText = this.item.tags.join(', ');
        Object.assign(this, this.productTexts());
        this.errors = {};
        this.confirming = false;
        this.$nextTick(() => this.$refs.name && this.$refs.name.focus());
      }
    },
  },
  mounted() {
    if (this.editing) this.$refs.name && this.$refs.name.focus();
  },
  methods: {
    money: formatMoney,
    productTexts() {
      const item = this.item;
      return {
        sizesText: (item.sizes || []).join(', '),
        coloursText: (item.colours || []).join(', '),
        stockText: item.stock === null || item.stock === undefined ? '' : String(item.stock),
      };
    },
    submit() {
      this.errors = {};
      const price = Number(this.priceText);
      const stock = this.stockText === '' ? null : Number(this.stockText);
      if (this.noun === 'product' && stock !== null && !(Number.isInteger(stock) && stock >= 0)) {
        this.errors.stock = 'Enter a whole number, or leave it empty.';
      }
      if (!this.draft.name) this.errors.name = 'Enter a name.';
      if (this.priceText === '' || Number.isNaN(price) || price < 0) {
        this.errors.price = 'Enter a price, like 450.';
      }
      if (!this.draft.category) this.errors.category = 'Enter a category.';
      if (Object.keys(this.errors).length) return;

      const product =
        this.noun === 'product'
          ? { sizes: list(this.sizesText), colours: list(this.coloursText), stock, available: stock !== 0 }
          : {};
      this.$emit('save', {
        ...this.item,
        ...product,
        name: this.draft.name,
        description: this.draft.description,
        category: this.draft.category,
        price: Math.round(price * 100),
        tags: this.tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    },
  },
};
</script>
