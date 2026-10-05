<template>
  <section class="flex flex-col lg:h-full">
    <header class="px-5 pt-6 sm:px-8 sm:pt-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-[1.75rem] font-semibold tracking-tight">{{ label }}</h1>
          <p class="mt-1 max-w-xl text-ink-soft">
            Your agent reads this when customers ask or order. Changes are live right away.
          </p>
        </div>
        <div v-if="loaded" class="flex gap-2">
          <button type="button" class="btn btn-secondary" @click="importOpen = !importOpen">
            <ph-upload-simple :size="18"></ph-upload-simple>
            Import CSV
          </button>
          <button type="button" class="btn btn-primary" @click="startAdd">
            <ph-plus :size="18" weight="bold"></ph-plus>
            Add {{ noun }}
          </button>
        </div>
      </div>

      <div v-if="loaded && items.length" class="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-hairline">
        <div class="flex gap-6 overflow-x-auto" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="tab === category"
            class="tab-button"
            :class="{ 'tab-button-active': tab === category }"
            @click="category = tab"
          >
            {{ tab }}
          </button>
        </div>
        <label class="relative mb-2 ml-auto block w-full sm:w-64">
          <span class="sr-only">Search {{ label.toLowerCase() }}</span>
          <ph-magnifying-glass :size="18" class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"></ph-magnifying-glass>
          <input v-model.trim="query" class="field !h-10 pl-10" type="search" :placeholder="`Search ${label.toLowerCase()}`" />
        </label>
      </div>
    </header>

    <import-panel
      v-if="importOpen"
      :noun="noun"
      :current-count="items.length"
      @close="importOpen = false"
      @imported="onImported"
    ></import-panel>

    <p v-if="saveError" class="px-5 py-3 text-sm text-danger sm:px-8" role="alert">{{ saveError }}</p>

    <p v-if="loadError" class="px-5 py-10 text-sm sm:px-8" role="alert">
      <span class="text-danger">{{ loadError }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
    </p>

    <skeleton-rows v-else-if="!loaded" class="mt-4"></skeleton-rows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <div
        v-if="items.length || adding"
        class="hidden grid-cols-[minmax(0,1fr)_7rem_8.5rem_5rem] gap-x-4 border-b border-hairline bg-wash px-8 py-2.5 text-xs font-semibold text-ink-soft sm:grid"
      >
        <span>{{ noun[0].toUpperCase() + noun.slice(1) }}</span>
        <span class="text-right">Price</span>
        <span>Available</span>
        <span></span>
      </div>

      <item-row
        v-if="adding"
        :item="blank"
        :editing="true"
        :is-new="true"
        :categories="allCategories"
        :noun="noun"
        @save="saveNew"
        @cancel="adding = false"
      ></item-row>

      <item-row
        v-for="item in filtered"
        :key="item.code"
        :item="item"
        :editing="editingCode === item.code"
        :categories="allCategories"
        :noun="noun"
        @toggle="toggle(item)"
        @edit="editingCode = item.code"
        @cancel="editingCode = null"
        @save="saveEdit(item.code, $event)"
        @remove="remove(item.code)"
      ></item-row>

      <div v-if="!items.length && !adding" class="px-5 py-16 sm:px-8">
        <div class="max-w-md">
          <h2 class="text-xl font-semibold tracking-tight">No {{ noun }}s yet</h2>
          <p class="mt-2 text-ink-soft">
            Add them one at a time, or import a spreadsheet to add them all at once.
            Your agent can only talk about what is listed here.
          </p>
          <div class="mt-6 flex gap-2">
            <button type="button" class="btn btn-primary" @click="startAdd">Add {{ noun }}</button>
            <button type="button" class="btn btn-secondary" @click="importOpen = true">Import CSV</button>
          </div>
        </div>
      </div>

      <p v-else-if="!filtered.length && !adding" class="px-5 py-10 text-sm text-ink-soft sm:px-8">
        No {{ noun }}s match that.
      </p>

      <p v-if="items.length" class="px-5 py-4 text-sm text-ink-soft sm:px-8">
        {{ items.length }} {{ items.length === 1 ? noun : noun + 's' }}
      </p>
    </div>
  </section>
</template>

<script>
import { PhPlus, PhUploadSimple, PhMagnifyingGlass } from '@phosphor-icons/vue';

import ItemRow from '../../components/menu/ItemRow.vue';
import ImportPanel from '../../components/menu/ImportPanel.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchItems, replaceItems } from '../../api/agent.js';
import { makeCode } from '../../lib/slug.js';
import { itemNoun } from '../../lib/presets.js';

export default {
  components: { ItemRow, ImportPanel, SkeletonRows, PhPlus, PhUploadSimple, PhMagnifyingGlass },
  data() {
    return {
      items: [],
      loaded: false,
      loadError: null,
      saveError: null,
      category: 'All',
      query: '',
      editingCode: null,
      adding: false,
      importOpen: false,
    };
  },
  computed: {
    label() {
      return this.$store.getters['agent/itemsLabel'];
    },
    noun() {
      const config = this.$store.getters['agent/config'];
      return itemNoun(config && config.preset);
    },
    allCategories() {
      return [...new Set(this.items.map((item) => item.category))];
    },
    tabs() {
      return ['All', ...this.allCategories];
    },
    filtered() {
      const query = this.query.toLowerCase();
      return this.items.filter(
        (item) =>
          (this.category === 'All' || item.category === this.category) &&
          (!query ||
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    },
    blank() {
      return {
        code: '',
        name: '',
        description: '',
        price: 0,
        category: this.category === 'All' ? this.allCategories[0] || '' : this.category,
        tags: [],
        available: true,
        attributes: {},
      };
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loadError = null;
      try {
        // No agent yet: the items belong to it, so set it up first.
        await Promise.all([
          this.$store.dispatch('agent/load'),
          this.$store.dispatch('agent/loadPresets'),
        ]);
        if (this.$store.getters['agent/noAgent']) {
          this.$router.replace('/setup');
          return;
        }
        this.items = await fetchItems(this.$store.getters['auth/token']);
        this.loaded = true;
      } catch (error) {
        this.loadError = error.message;
      }
    },
    // The API replaces the whole list, so every change sends all of it. The screen
    // updates at once and goes back if the server says no.
    async persist(next) {
      const previous = this.items;
      this.items = next;
      this.saveError = null;
      try {
        await replaceItems(this.$store.getters['auth/token'], next);
        // `missing` on the Your agent page depends on there being items.
        this.$store.dispatch('agent/load').catch(() => {});
        return true;
      } catch (error) {
        this.items = previous;
        this.saveError = error.message;
        return false;
      }
    },
    startAdd() {
      this.editingCode = null;
      this.adding = true;
      this.importOpen = false;
    },
    toggle(item) {
      this.persist(this.items.map((i) => (i.code === item.code ? { ...i, available: !i.available } : i)));
    },
    async saveEdit(code, updated) {
      if (await this.persist(this.items.map((i) => (i.code === code ? updated : i)))) {
        this.editingCode = null;
      }
    },
    async saveNew(draft) {
      const code = makeCode(draft.name, this.items.map((i) => i.code));
      if (await this.persist([...this.items, { ...draft, code }])) {
        this.adding = false;
      }
    },
    async remove(code) {
      if (await this.persist(this.items.filter((i) => i.code !== code))) {
        this.editingCode = null;
      }
    },
    async onImported() {
      this.importOpen = false;
      this.category = 'All';
      await this.load();
      this.$store.dispatch('agent/load').catch(() => {});
    },
  },
};
</script>

<style scoped>
.tab-button {
  flex-shrink: 0;
  white-space: nowrap;
  margin-bottom: -1px;
  height: 2.75rem;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-soft);
  transition: color 0.2s var(--ease-settle), border-color 0.2s var(--ease-settle);
}

.tab-button:hover {
  color: var(--color-ink);
}

.tab-button-active {
  color: var(--color-brand);
  border-bottom-color: var(--color-brand);
}
</style>
