<template>
  <section class="flex flex-col lg:h-full">
    <PageHeader :title="label" :subtitle="t('menu.subtitle')">
      <template v-if="loaded" #actions>
        <button type="button" class="btn btn-secondary" @click="importOpen = !importOpen">
          <PhUploadSimple :size="16"></PhUploadSimple>
          {{ t('menu.importCsv') }}
        </button>
        <button type="button" class="btn btn-primary" @click="startAdd">
          <PhPlus :size="16" weight="bold"></PhPlus>
          {{ t('menu.add', { noun }) }}
        </button>
      </template>
      <template v-if="loaded && items.length" #tabs>
        <div class="flex flex-wrap-reverse items-end gap-x-8 gap-y-3 border-b border-hairline">
          <div class="tabs !border-b-0" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.value ?? 'all'"
              type="button"
              role="tab"
              :aria-selected="tab.value === category"
              class="tab"
              :class="{ 'tab-active': tab.value === category }"
              @click="category = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
          <label class="relative mb-2 ml-auto block w-full sm:w-64">
            <span class="sr-only">{{ t('menu.search', { list: label }) }}</span>
            <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
            <input v-model.trim="query" class="field !h-9 pl-9" type="search" :placeholder="t('menu.search', { list: label })" />
          </label>
        </div>
      </template>
    </PageHeader>

    <ImportPanel
      v-if="importOpen"
      :kind="agent.kind"
      :current-count="items.length"
      @close="importOpen = false"
      @imported="onImported"
    ></ImportPanel>

    <p v-if="saveError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <PhWarningCircle :size="16" class="shrink-0"></PhWarningCircle>
      {{ saveError }}
    </p>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto" :class="{ 'border-t border-hairline': !items.length }">
      <div
        v-if="items.length || adding"
        class="sticky top-0 z-[1] hidden grid-cols-[minmax(0,1fr)_7rem_8.5rem_5rem] gap-x-4 border-b border-hairline bg-wash/95 px-8 py-2 text-xs font-semibold text-ink-soft backdrop-blur sm:grid"
      >
        <span>{{ capitalize(noun) }}</span>
        <span class="text-right">{{ agent.kind === 'clinic' ? t('menu.fee') : t('menu.price') }}</span>
        <span>{{ t('menu.available') }}</span>
        <span></span>
      </div>

      <ItemRow
        v-if="adding"
        :item="blank"
        :editing="true"
        :is-new="true"
        :categories="allCategories"
        :kind="agent.kind"
        @save="saveNew"
        @cancel="adding = false"
      ></ItemRow>

      <ItemRow
        v-for="item in shown"
        :key="item.code"
        :item="item"
        :editing="editingCode === item.code"
        :categories="allCategories"
        :kind="agent.kind"
        @toggle="toggle(item)"
        @edit="editingCode = item.code"
        @cancel="editingCode = null"
        @save="saveEdit(item.code, $event)"
        @remove="remove(item.code)"
      ></ItemRow>

      <ShowMore v-if="filtered.length > shown.length" @more="limit += PAGE_SIZE"></ShowMore>

      <EmptyState
        v-if="!items.length && !adding"
        :icon="PhListBullets"
        :title="t('menu.emptyTitle', { nouns: itemNoun(agent.kind, 2) })"
        :text="t('menu.emptyText', { noun })"
      ></EmptyState>

      <p v-else-if="!filtered.length && !adding" class="px-5 py-10 text-sm text-ink-soft sm:px-8">
        {{ t('menu.noMatches', { nouns: itemNoun(agent.kind, 2) }) }}
      </p>

      <p v-if="items.length" class="px-5 py-4 text-sm text-ink-soft sm:px-8">
        {{ formatNumber(items.length) }} {{ itemNoun(agent.kind, items.length) }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
import { formatNumber } from '../../lib/format.js';
import { itemNoun, itemsLabel } from '../../lib/presets.js';
import { useAgentStore } from '../../stores/agent.js';

// The whole list comes in one request (the backend stores and saves it as one
// list, at most 2000 from a CSV), so search is instant in the browser. Drawing
// 2000 rows at once is what would be slow, so only this many are drawn.
const PAGE_SIZE = 50;

const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();

const items = ref([]);
const loaded = ref(false);
const loadError = ref(null);
const saveError = ref(null);
const category = ref(null); // null: every category
const query = ref('');
const editingCode = ref(null);
const adding = ref(false);
const importOpen = ref(false);
const limit = ref(PAGE_SIZE);

const label = computed(() => itemsLabel(agent.kind));
const noun = computed(() => itemNoun(agent.kind));
const allCategories = computed(() => [...new Set(items.value.map((item) => item.category))]);
const tabs = computed(() => [
  { value: null, label: t('menu.all') },
  ...allCategories.value.map((c) => ({ value: c, label: c })),
]);
const filtered = computed(() => {
  const q = query.value.toLowerCase();
  return items.value.filter(
    (item) =>
      (category.value === null || item.category === category.value) &&
      (!q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (item.colours || []).some((colour) => colour.toLowerCase().includes(q))),
  );
});
const shown = computed(() => filtered.value.slice(0, limit.value));
const blank = computed(() => ({
  code: '',
  name: '',
  description: '',
  price: 0,
  was_price: null,
  category: category.value ?? allCategories.value[0] ?? '',
  tags: [],
  available: true,
  attributes: {},
  sizes: [],
  colours: [],
  stock: null,
  variants: [],
}));

// A new search or category starts from the top again.
watch([query, category], () => (limit.value = PAGE_SIZE));

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function load() {
  loadError.value = null;
  try {
    // No agent yet: the items belong to it, so set it up first.
    await Promise.all([agent.load(), agent.loadPresets()]);
    if (agent.noAgent) {
      router.replace('/setup');
      return;
    }
    items.value = await fetchItems();
    loaded.value = true;
  } catch (error) {
    loadError.value = error.message;
  }
}

// The API replaces the whole list, so every change sends all of it. The screen
// updates at once and goes back if the server says no.
async function persist(next) {
  const previous = items.value;
  items.value = next;
  saveError.value = null;
  try {
    await replaceItems(next);
    // `missing` on the Your agent page depends on there being items.
    agent.load({ force: true }).catch(() => {});
    return true;
  } catch (error) {
    items.value = previous;
    saveError.value = error.message;
    return false;
  }
}

function startAdd() {
  editingCode.value = null;
  adding.value = true;
  importOpen.value = false;
}

function toggle(item) {
  persist(items.value.map((i) => (i.code === item.code ? { ...i, available: !i.available } : i)));
}

async function saveEdit(code, updated) {
  if (await persist(items.value.map((i) => (i.code === code ? updated : i)))) editingCode.value = null;
}

async function saveNew(draft) {
  const code = makeCode(draft.name, items.value.map((i) => i.code));
  if (await persist([...items.value, { ...draft, code }])) adding.value = false;
}

async function remove(code) {
  if (await persist(items.value.filter((i) => i.code !== code))) editingCode.value = null;
}

async function onImported() {
  importOpen.value = false;
  category.value = null;
  await load();
  agent.load({ force: true }).catch(() => {});
}

load();
</script>
