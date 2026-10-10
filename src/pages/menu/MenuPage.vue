<template>
  <section class="flex flex-col lg:h-full">
    <page-header :title="label" :subtitle="`Your agent only offers what is listed here, at these prices. Changes are live right away.`">
      <template v-if="loaded" #actions>
        <button type="button" class="btn btn-secondary" @click="importOpen = !importOpen">
          <ph-upload-simple :size="16"></ph-upload-simple>
          Import CSV
        </button>
        <button type="button" class="btn btn-primary" @click="startAdd">
          <ph-plus :size="16" weight="bold"></ph-plus>
          Add {{ noun }}
        </button>
      </template>
      <template v-if="loaded && items.length" #tabs>
        <div class="flex flex-wrap-reverse items-end gap-x-8 gap-y-3 border-b border-hairline">
          <div class="tabs !border-b-0" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab"
              type="button"
              role="tab"
              :aria-selected="tab === category"
              class="tab"
              :class="{ 'tab-active': tab === category }"
              @click="category = tab"
            >
              {{ tab }}
            </button>
          </div>
          <label class="relative mb-2 ml-auto block w-full sm:w-64">
            <span class="sr-only">Search {{ label.toLowerCase() }}</span>
            <ph-magnifying-glass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></ph-magnifying-glass>
            <input v-model.trim="query" class="field !h-9 pl-9" type="search" :placeholder="`Search ${label.toLowerCase()}`" />
          </label>
        </div>
      </template>
    </page-header>

    <import-panel
      v-if="importOpen"
      :noun="noun"
      :current-count="items.length"
      @close="importOpen = false"
      @imported="onImported"
    ></import-panel>

    <p v-if="saveError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <ph-warning-circle :size="16" class="shrink-0"></ph-warning-circle>
      {{ saveError }}
    </p>

    <load-error v-if="loadError" :message="loadError" @retry="load"></load-error>

    <skeleton-rows v-else-if="!loaded" class="border-t border-hairline"></skeleton-rows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto" :class="{ 'border-t border-hairline': !items.length }">
      <div
        v-if="items.length || adding"
        class="sticky top-0 z-[1] hidden grid-cols-[minmax(0,1fr)_7rem_8.5rem_5rem] gap-x-4 border-b border-hairline bg-wash/95 px-8 py-2 text-xs font-semibold text-ink-soft backdrop-blur sm:grid"
      >
        <span>{{ noun[0].toUpperCase() + noun.slice(1) }}</span>
        <span class="text-right">{{ noun === 'doctor' ? 'Fee' : 'Price' }}</span>
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
        v-for="item in shown"
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

      <show-more v-if="filtered.length > shown.length" @more="limit += PAGE_SIZE"></show-more>

      <empty-state
        v-if="!items.length && !adding"
        :icon="icons.list"
        :title="`No ${noun}s yet`"
        :text="`Add them one at a time with Add ${noun}, or use Import CSV to bring in a whole spreadsheet at once. Your agent can only offer what is listed here.`"
      ></empty-state>

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
import { markRaw } from 'vue';
import { PhPlus, PhUploadSimple, PhMagnifyingGlass, PhWarningCircle, PhListBullets } from '@phosphor-icons/vue';

import ItemRow from '../../components/menu/ItemRow.vue';
import ImportPanel from '../../components/menu/ImportPanel.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchItems, replaceItems } from '../../api/agent.js';
import { makeCode } from '../../lib/slug.js';
import { itemNoun } from '../../lib/presets.js';

// The whole list comes in one request (the backend stores and saves it as one
// list, at most 2000 from a CSV), so search is instant in the browser. Drawing
// 2000 rows at once is what would be slow, so only this many are drawn.
const PAGE_SIZE = 50;

export default {
  components: {
    ItemRow,
    ImportPanel,
    SkeletonRows,
    PageHeader,
    EmptyState,
    ShowMore,
    LoadError,
    PhPlus,
    PhUploadSimple,
    PhMagnifyingGlass,
    PhWarningCircle,
  },
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
      limit: PAGE_SIZE,
      PAGE_SIZE,
      // markRaw: components are fixed, so Vue need not watch them for changes.
      icons: markRaw({ list: PhListBullets }),
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
            item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            (item.colours || []).some((colour) => colour.toLowerCase().includes(query)))
      );
    },
    shown() {
      return this.filtered.slice(0, this.limit);
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
        sizes: [],
        colours: [],
        stock: null,
      };
    },
  },
  watch: {
    // A new search or category starts from the top again.
    query() {
      this.limit = PAGE_SIZE;
    },
    category() {
      this.limit = PAGE_SIZE;
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
        this.$store.dispatch('agent/load', { force: true }).catch(() => {});
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
      this.$store.dispatch('agent/load', { force: true }).catch(() => {});
    },
  },
};
</script>
