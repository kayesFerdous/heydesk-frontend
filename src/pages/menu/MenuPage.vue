<template>
  <!-- One island on the canvas: find a dish (words, then a category pill),
       bring a list in, and the list itself. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full">
    <PageHeader :title="label" :tip="t('menu.subtitle')">
      <template v-if="loaded && !locked && auth.canManage" #actions>
        <!-- The ways to bring a whole list in, behind one button. -->
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
            <button v-if="!linked" type="button" class="menu-item" role="menuitem" @click="openPanel('sheet')">
              <PhTable :size="18" class="text-ink-soft"></PhTable>
              {{ t('menu.sheet.fromSheet') }}
            </button>
            <button v-if="agent.kind === 'shop' && !linked" type="button" class="menu-item" role="menuitem" @click="openPanel('woo')">
              <PhStorefront :size="18" class="text-ink-soft"></PhStorefront>
              {{ t('menu.woo.fromWoo') }}
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-primary" @click="startAdd">
          <PhPlus :size="16" weight="bold"></PhPlus>
          {{ t('menu.add', { noun }) }}
        </button>
      </template>
    </PageHeader>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>

    <div v-else class="island flex flex-col overflow-hidden lg:min-h-0 lg:flex-1">
    <!-- Find a dish: words, then a category. The count says how big the list is. -->
    <div v-if="loaded && items.length" class="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:px-5 sm:pt-4">
      <label class="relative block w-full sm:w-64">
        <span class="sr-only">{{ t('menu.search', { list: label.toLowerCase() }) }}</span>
        <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
        <input v-model.trim="query" class="field !border-transparent !bg-wash pl-10" type="search" :placeholder="t('menu.search', { list: label.toLowerCase() })" />
      </label>
      <div class="tabs min-w-0 flex-1" role="group" :aria-label="t('menu.row.category')">
        <button type="button" class="tab" :class="{ 'tab-active': category === null }" :aria-pressed="category === null" @click="category = null">
          {{ t('menu.all') }}
          <span class="count" :class="{ '!bg-ink !text-white': category === null }">{{ formatNumber(items.length) }}</span>
        </button>
        <button
          v-for="c in allCategories"
          :key="c"
          type="button"
          class="tab"
          :class="{ 'tab-active': category === c }"
          :aria-pressed="category === c"
          @click="category = c"
        >
          {{ c }}
          <span class="count" :class="{ '!bg-ink !text-white': category === c }">{{ formatNumber(countIn(c)) }}</span>
        </button>
      </div>
    </div>

    <SheetBar v-if="sheet" :sheet="sheet" :kind="agent.kind" @synced="onSynced('sheet', $event)" @unlinked="sheet = null"></SheetBar>
    <WooBar v-if="woo" :woo="woo" @synced="onSynced('woo', $event)" @unlinked="woo = null"></WooBar>

    <p v-if="merged" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-success sm:px-8" role="status">
      <PhCheckCircle :size="16" class="shrink-0"></PhCheckCircle>
      {{ merged }}
    </p>

    <p v-if="saveError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <PhWarningCircle :size="16" class="shrink-0"></PhWarningCircle>
      {{ saveError }}
    </p>

    <SkeletonRows v-if="!loaded"></SkeletonRows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <!-- In the scrolling part, so a long column list can be scrolled to. -->
      <WooPanel
        v-if="importOpen === 'woo'"
        :current-count="items.length"
        @close="importOpen = null"
        @linked="onWooLinked"
      ></WooPanel>

      <ImportPanel
        v-else-if="importOpen"
        :key="importOpen"
        :kind="agent.kind"
        :current-count="items.length"
        :sheet="importOpen === 'sheet'"
        @close="importOpen = null"
        @imported="onImported"
      ></ImportPanel>

      <div v-if="items.length || adding" class="ledger-head sticky top-0 z-[1] grid-cols-[minmax(0,1fr)_7rem_7.5rem_2.5rem] gap-x-4 bg-surface px-5 pt-2 sm:px-8">
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
        :locked="locked"
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
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhCaretDown, PhFileCsv, PhPlus, PhUploadSimple, PhMagnifyingGlass, PhWarningCircle, PhListBullets, PhStorefront, PhTable, PhCheckCircle } from '@phosphor-icons/vue';

import ItemRow from '../../components/menu/ItemRow.vue';
import ImportPanel from '../../components/menu/ImportPanel.vue';
import SheetBar from '../../components/menu/SheetBar.vue';
import WooBar from '../../components/menu/WooBar.vue';
import WooPanel from '../../components/menu/WooPanel.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchItems, fetchSheet, fetchWoo, replaceItems } from '../../api/agent.js';
import { makeCode } from '../../lib/slug.js';
import { formatNumber } from '../../lib/format.js';
import { itemNoun, itemsLabel } from '../../lib/presets.js';
import { useAgentStore } from '../../stores/agent.js';
import { useAuthStore } from '../../stores/auth.js';
import { usePopover } from '../../composables/usePopover.js';

// The whole list comes in one request (the backend stores and saves it as one
// list, at most 2000 from a CSV), so search is instant in the browser. Drawing
// 2000 rows at once is what would be slow, so only this many are drawn.
const PAGE_SIZE = 50;

const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();
const auth = useAuthStore();

const items = ref([]);
const loaded = ref(false);
const loadError = ref(null);
const saveError = ref(null);
const category = ref(null); // null: every category
const query = ref('');
const editingCode = ref(null);
const adding = ref(false);
const importOpen = ref(null); // 'file', 'sheet' or 'woo' while that panel is open
const sheet = ref(null); // the linked Google Sheet, { url, synced_at, problem }, or null
const woo = ref(null); // a shop's linked WooCommerce store, { url, products, synced_at, problem }, or null
const limit = ref(PAGE_SIZE);

// The list comes from a sheet or a store. It's changed there, so the rows are locked,
// except a shop's: its sheet or store only adds and updates its own products (backend D120).
const linked = computed(() => !!sheet.value || !!woo.value);
const locked = computed(() => linked.value && agent.kind !== 'shop');
// "3 added, 5 updated": what a shop's last import did.
const merged = ref(null);
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
    [items.value, sheet.value, woo.value] = await Promise.all([
      fetchItems(),
      fetchSheet(),
      agent.kind === 'shop' ? fetchWoo() : null,
    ]);
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

// The sheet read or the store synced now: the list may have changed with it.
async function onSynced(source, read) {
  if (source === 'sheet') sheet.value = read;
  else woo.value = read;
  items.value = await fetchItems();
}

// The store's products are the list now.
async function onWooLinked(linkedStore) {
  woo.value = linkedStore;
  await onImported();
}

async function onImported(saved) {
  merged.value =
    saved?.added != null
      ? t('menu.import.merged', { added: formatNumber(saved.added), updated: formatNumber(saved.count - saved.added) })
      : null;
  importOpen.value = null;
  category.value = null;
  await load();
  agent.load({ force: true }).catch(() => {});
}

load();
</script>
