<template>
  <section class="flex flex-col lg:h-full">
    <PageHeader :title="label" :tip="t('menu.subtitle')">
      <template v-if="loaded && !sheet" #actions>
        <!-- Two ways to bring a whole list in, behind one button. -->
        <div ref="importRoot" class="relative">
          <button type="button" class="btn btn-secondary" aria-haspopup="menu" :aria-expanded="importMenu" @click="importMenu = !importMenu">
            <PhUploadSimple :size="16"></PhUploadSimple>
            {{ t('menu.import.button') }}
            <PhCaretDown :size="14" class="text-ink-soft"></PhCaretDown>
          </button>
          <div v-if="importMenu" class="popover right-0 w-60" role="menu">
            <button type="button" class="menu-item" role="menuitem" @click="openPanel('file')">
              <PhFileCsv :size="18" class="text-ink-soft"></PhFileCsv>
              {{ t('menu.import.fromFile') }}
            </button>
            <button type="button" class="menu-item" role="menuitem" @click="openPanel('sheet')">
              <PhTable :size="18" class="text-ink-soft"></PhTable>
              {{ t('menu.sheet.fromSheet') }}
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-primary" @click="startAdd">
          <PhPlus :size="16" weight="bold"></PhPlus>
          {{ t('menu.add', { noun }) }}
        </button>
      </template>
    </PageHeader>

    <!-- Find a dish: words, then a category. The count says how big the list is. -->
    <div v-if="loaded && items.length" class="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-8">
      <label class="relative block w-full sm:w-64">
        <span class="sr-only">{{ t('menu.search', { list: label }) }}</span>
        <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
        <input v-model.trim="query" class="field !h-9 pl-9" type="search" :placeholder="t('menu.search', { list: label })" />
      </label>
      <label class="w-full sm:w-auto">
        <span class="sr-only">{{ t('menu.row.category') }}</span>
        <select v-model="category" class="field !h-9 sm:!w-56">
          <option :value="null">{{ t('menu.allCategories') }}</option>
          <option v-for="c in allCategories" :key="c" :value="c">{{ c }} ({{ formatNumber(countIn(c)) }})</option>
        </select>
      </label>
      <p class="ml-auto hidden text-sm text-ink-soft sm:block">
        {{ formatNumber(items.length) }} {{ itemNoun(agent.kind, items.length) }}
      </p>
    </div>

    <ImportPanel
      v-if="importOpen"
      :key="importOpen"
      :kind="agent.kind"
      :current-count="items.length"
      :sheet="importOpen === 'sheet'"
      @close="importOpen = null"
      @imported="onImported"
    ></ImportPanel>

    <SheetBar v-if="sheet" :sheet="sheet" @synced="onSynced" @unlinked="sheet = null"></SheetBar>

    <p v-if="saveError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <PhWarningCircle :size="16" class="shrink-0"></PhWarningCircle>
      {{ saveError }}
    </p>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <div v-if="items.length || adding" class="ledger-head sticky top-0 z-[1] grid-cols-[minmax(0,1fr)_7rem_7.5rem_2.5rem] gap-x-4 bg-surface px-5 pt-1 sm:px-8">
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
        :locked="!!sheet"
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

    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhCaretDown, PhFileCsv, PhPlus, PhUploadSimple, PhMagnifyingGlass, PhWarningCircle, PhListBullets, PhTable } from '@phosphor-icons/vue';

import ItemRow from '../../components/menu/ItemRow.vue';
import ImportPanel from '../../components/menu/ImportPanel.vue';
import SheetBar from '../../components/menu/SheetBar.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchItems, fetchSheet, replaceItems } from '../../api/agent.js';
import { makeCode } from '../../lib/slug.js';
import { formatNumber } from '../../lib/format.js';
import { itemNoun, itemsLabel } from '../../lib/presets.js';
import { useAgentStore } from '../../stores/agent.js';
import { usePopover } from '../../composables/usePopover.js';

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
const importOpen = ref(null); // 'file' or 'sheet' while that panel is open
const sheet = ref(null); // the linked Google Sheet, { url, synced_at, problem }, or null
const limit = ref(PAGE_SIZE);

const label = computed(() => itemsLabel(agent.kind));
const noun = computed(() => itemNoun(agent.kind));
const allCategories = computed(() => [...new Set(items.value.map((item) => item.category))]);
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
  photos: [],
}));

// A new search or category starts from the top again.
watch([query, category], () => (limit.value = PAGE_SIZE));

// The Import menu in the header.
const { open: importMenu, root: importRoot } = usePopover();

// How many items a category holds, for its line in the category list.
function countIn(name) {
  return items.value.filter((item) => item.category === name).length;
}

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
    [items.value, sheet.value] = await Promise.all([fetchItems(), fetchSheet()]);
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
  importOpen.value = null;
}

function openPanel(source) {
  importMenu.value = false;
  adding.value = false;
  importOpen.value = source;
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

// Read now: the list may have changed with it.
async function onSynced(read) {
  sheet.value = read;
  items.value = await fetchItems();
}

async function onImported() {
  importOpen.value = null;
  category.value = null;
  await load();
  agent.load({ force: true }).catch(() => {});
}

load();
</script>
