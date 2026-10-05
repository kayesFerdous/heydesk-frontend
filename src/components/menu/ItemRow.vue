<template>
  <!-- Reading -->
  <div
    v-if="!editing"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-hairline px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_8.5rem_5rem] sm:px-8"
    :class="{ 'opacity-60': !item.available }"
  >
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-navy">{{ item.name }}</p>
      <p v-if="item.description" class="truncate text-sm text-ink-soft">{{ item.description }}</p>
      <p v-if="factsText" class="truncate text-xs text-ink-soft">{{ factsText }}</p>
      <div v-if="item.tags.length" class="mt-1.5 flex flex-wrap gap-1.5">
        <span v-for="tag in item.tags" :key="tag" class="chip bg-wash !font-medium text-ink-soft">{{ tag }}</span>
      </div>
    </div>

    <p class="text-right text-sm font-semibold sm:order-none">{{ money(item.price) }}</p>

    <!-- On a phone the switch and Edit share one line under the name. -->
    <div class="col-span-2 flex items-center justify-between sm:contents">
      <div class="flex items-center gap-2">
        <toggle-switch
          :model-value="item.available"
          :label="`${item.name} is available`"
          @update:model-value="$emit('toggle')"
        ></toggle-switch>
        <span v-if="!item.available" class="text-xs whitespace-nowrap text-ink-soft">Sold out</span>
      </div>

      <div class="sm:text-right">
        <button type="button" class="btn btn-quiet !h-9 !px-3" @click="$emit('edit')">Edit</button>
      </div>
    </div>
  </div>

  <!-- Editing, in the row itself -->
  <form v-else class="border-b border-hairline bg-wash px-5 py-5 sm:px-8" novalidate @submit.prevent="submit">
    <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="label" :for="`n-${uid}`">Name</label>
        <input :id="`n-${uid}`" ref="name" v-model.trim="draft.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
        <p v-if="errors.name" class="mt-1.5 text-sm text-danger">{{ errors.name }}</p>
      </div>
      <div>
        <label class="label" :for="`p-${uid}`">Price</label>
        <input :id="`p-${uid}`" v-model.trim="priceText" class="field" :class="{ 'field-invalid': errors.price }" type="text" inputmode="decimal" placeholder="450" />
        <p v-if="errors.price" class="mt-1.5 text-sm text-danger">{{ errors.price }}</p>
      </div>
      <div>
        <label class="label" :for="`c-${uid}`">Category</label>
        <input :id="`c-${uid}`" v-model.trim="draft.category" class="field" :class="{ 'field-invalid': errors.category }" type="text" :list="`cats-${uid}`" />
        <datalist :id="`cats-${uid}`">
          <option v-for="category in categories" :key="category" :value="category"></option>
        </datalist>
        <p v-if="errors.category" class="mt-1.5 text-sm text-danger">{{ errors.category }}</p>
      </div>
      <div class="sm:col-span-2">
        <label class="label" :for="`d-${uid}`">Description</label>
        <input :id="`d-${uid}`" v-model="draft.description" class="field" type="text" />
      </div>
      <div class="sm:col-span-2">
        <label class="label" :for="`t-${uid}`">Tags</label>
        <input :id="`t-${uid}`" v-model="tagsText" class="field" type="text" placeholder="popular, spicy, vegetarian" />
        <p class="mt-1.5 text-xs text-ink-soft">Separate with commas. Your agent uses tags to recommend.</p>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <button type="submit" class="btn btn-primary">Save</button>
      <button type="button" class="btn btn-quiet" @click="$emit('cancel')">Cancel</button>

      <template v-if="!isNew">
        <span class="flex-1"></span>
        <span v-if="confirming" class="flex items-center gap-2 text-sm">
          Delete this {{ noun }}?
          <button type="button" class="btn btn-danger !h-9" @click="$emit('remove')">Delete</button>
          <button type="button" class="btn btn-secondary !h-9" @click="confirming = false">Keep it</button>
        </span>
        <button v-else type="button" class="btn btn-quiet !text-danger" @click="confirming = true">
          Delete {{ noun }}
        </button>
      </template>
    </div>
  </form>
</template>

<script>
import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { formatMoney } from '../../lib/format.js';

let nextUid = 0;

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
      errors: {},
      confirming: false,
    };
  },
  computed: {
    // A business's own facts (a doctor's days, a snack's calories) are shown
    // but edited through the CSV import.
    factsText() {
      const attributes = this.item.attributes || {};
      return Object.keys(attributes)
        .map((key) => `${key}: ${[].concat(attributes[key]).join(', ')}`)
        .join(' · ');
    },
  },
  watch: {
    editing(isEditing) {
      if (isEditing) {
        this.draft = { ...this.item };
        this.priceText = this.item.price ? String(this.item.price / 100) : '';
        this.tagsText = this.item.tags.join(', ');
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
    submit() {
      this.errors = {};
      const price = Number(this.priceText);
      if (!this.draft.name) this.errors.name = 'Enter a name.';
      if (this.priceText === '' || Number.isNaN(price) || price < 0) {
        this.errors.price = 'Enter a price, like 450.';
      }
      if (!this.draft.category) this.errors.category = 'Enter a category.';
      if (Object.keys(this.errors).length) return;

      this.$emit('save', {
        ...this.item,
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
