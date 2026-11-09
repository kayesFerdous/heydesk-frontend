<template>
  <!-- One island on the canvas: find a dish (words, then a category pill),
       bring a list in, and the list itself. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full" @keydown.esc="selecting && !confirmingDelete && stopSelecting()">
    <PageHeader :title="label" :tip="t('menu.subtitle')">
      <template v-if="loaded && auth.canManage" #actions>
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
            <button v-if="!linked" type="button" class="menu-item" role="menuitem" @click="openPanel('woo')">
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
      <!-- Checkboxes only once asked for, so the list stays a quiet list. -->
      <button v-if="auth.canManage && !selecting" type="button" class="btn btn-secondary" @click="selecting = true">
        <PhCheckSquare :size="16"></PhCheckSquare>
        {{ t('menu.select.start') }}
      </button>
    </div>

    <SheetBar v-if="sheet" :sheet="sheet" @synced="onSynced('sheet', $event)" @unlinked="sheet = null"></SheetBar>
    <WooBar v-if="woo" :woo="woo" @synced="onSynced('woo', $event)" @unlinked="woo = null"></WooBar>

    <!-- While selecting: how many are picked and the one action for all of them.
         Asks once before deleting. -->
    <div
      v-if="selecting"
      class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline bg-brand-tint px-5 py-2.5 sm:px-8"
      role="region"
      :aria-label="t('menu.select.count', { n: formatNumber(picked.length) })"
    >
      <template v-if="confirmingDelete">
        <p class="mr-auto min-w-0 text-sm">
          <span class="font-medium">{{ t('menu.select.confirm', { n: formatNumber(picked.length), nouns: itemNoun(picked.length) }) }}</span>
          <span v-if="linked" class="block text-ink-soft">{{ t('menu.select.linkedNote') }}</span>
        </p>
        <button type="button" class="btn btn-danger btn-sm" :disabled="saving" @click="removePicked">{{ t('common.delete') }}</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="confirmingDelete = false">{{ t('menu.select.keep') }}</button>
      </template>
      <template v-else>
        <span class="text-sm font-medium" aria-live="polite">
          {{ picked.length ? t('menu.select.count', { n: formatNumber(picked.length) }) : t('menu.select.hint', { nouns: itemNoun(2) }) }}
        </span>
        <button v-if="picked.length && picked.length < filtered.length" type="button" class="btn btn-quiet btn-sm" @click="pickAll">
          {{ t('menu.select.all', { n: formatNumber(filtered.length) }) }}
        </button>
        <button v-if="picked.length" type="button" class="btn btn-quiet btn-sm ml-auto !text-danger" @click="confirmingDelete = true">
          <PhTrash :size="16"></PhTrash>
          {{ t('menu.select.delete', { n: formatNumber(picked.length) }) }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm" :class="{ 'ml-auto': !picked.length }" @click="stopSelecting">{{ t('menu.select.done') }}</button>
      </template>
    </div>

    <p v-if="merged" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-success sm:px-8" role="status">
      <PhCheckCircle :size="16" class="shrink-0"></PhCheckCircle>
      {{ merged }}
    </p>

    <p v-if="saveError && !editor.mounted.value" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
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
        :sheet="importOpen === 'sheet'"
        @close="importOpen = null"
        @imported="onImported"
      ></ImportPanel>

      <div
        v-if="items.length || adding"
        class="ledger-head sticky top-0 z-[1] gap-x-4 bg-surface px-5 pt-2 sm:px-8 grid-cols-[minmax(0,1fr)_7rem_7.5rem_7rem]"
      >
        <span class="flex items-center gap-3">
          <input
            v-if="selecting && filtered.length"
            type="checkbox"
            class="check"
            :checked="allPicked"
            :indeterminate="picked.length > 0 && !allPicked"
            :aria-label="t('menu.select.every')"
            @change="allPicked ? clearPicked() : pickAll()"
          />
          {{ capitalize(noun) }}
        </span>
        <span class="text-right">{{ t('menu.price') }}</span>
        <span>{{ t('menu.available') }}</span>
        <span></span>
      </div>

      <ItemRow
        v-for="item in shown"
        :key="item.code"
        :item="item"
        :editing="editingCode === item.code"
        :public-key="agent.publicKey"
        :selectable="selecting"
        :selected="selection.has(item.code)"
        @select="pick(item, $event)"
        @toggle="toggle(item)"
        @edit="startEdit(item.code)"
      ></ItemRow>

      <ShowMore v-if="filtered.length > shown.length" @more="limit += PAGE_SIZE"></ShowMore>

      <EmptyState
        v-if="!items.length && !adding"
        :icon="PhListBullets"
        :title="t('menu.emptyTitle', { nouns: itemNoun(2) })"
        :text="t('menu.emptyText', { noun })"
      ></EmptyState>

      <p v-else-if="!filtered.length && !adding" class="px-5 py-10 text-sm text-ink-soft sm:px-8">
        {{ t('menu.noMatches', { nouns: itemNoun(2) }) }}
      </p>
    </div>
    </div>

    <ItemEditor
      v-if="editor.mounted.value && editing"
      :key="shownKey"
      :item="editing"
      :is-new="shownKey === NEW"
      :categories="allCategories"
      :saving="saving"
      :failed="saveError"
      :leaving="editor.leaving.value"
      @cancel="closeEditor"
      @save="saveItem"
      @remove="remove"
    ></ItemEditor>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhCaretDown, PhFileCsv, PhPlus, PhUploadSimple, PhMagnifyingGlass, PhWarningCircle, PhListBullets, PhStorefront, PhTable, PhCheckCircle, PhTrash, PhCheckSquare } from '@phosphor-icons/vue';

import ItemEditor from '../../components/menu/ItemEditor.vue';
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
import { usePresence } from '../../composables/usePresence.js';

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
const saving = ref(false);
const NEW = '\u0000new'; // the editor's key while adding: no product's code
const importOpen = ref(null); // 'file', 'sheet' or 'woo' while that panel is open
const sheet = ref(null); // the linked Google Sheet, { url, synced_at, problem }, or null
const woo = ref(null); // a shop's linked WooCommerce store, { url, products, synced_at, problem }, or null
const limit = ref(PAGE_SIZE);

// The list may come from a sheet or a store. They only add and update products,
// so the rows stay editable (backend D120).
const linked = computed(() => !!sheet.value || !!woo.value);
// "3 added, 5 updated" or "4 products deleted": what the last import or delete did.
const merged = ref(null);
const label = computed(() => itemsLabel());
const noun = computed(() => itemNoun());
const allCategories = computed(() => [...new Set(items.value.map((item) => item.category))]);
const filtered = computed(() => {
  const q = query.value.toLowerCase();
  return items.value.filter(
    (item) =>
      (category.value === null || item.category === category.value) &&
      (!q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
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
  videos: [],
  goes_with: [],
}));

// Rows picked with their checkboxes, by code. Codes no longer on the list
// (a sync took them) simply don't count.
const selection = ref(new Set());
const picked = computed(() => items.value.filter((item) => selection.value.has(item.code)));
const allPicked = computed(() => filtered.value.length > 0 && filtered.value.every((item) => selection.value.has(item.code)));
const selecting = ref(false); // the checkboxes show
const confirmingDelete = ref(false);
let lastPicked = null; // the code shift-click picks a run from

// Shift-click sets every row between the last one picked and this one.
function pick(item, shift) {
  const on = !selection.value.has(item.code);
  const codes = shown.value.map((i) => i.code);
  const from = shift && lastPicked !== null ? codes.indexOf(lastPicked) : -1;
  const to = codes.indexOf(item.code);
  const run = from === -1 ? [item.code] : codes.slice(Math.min(from, to), Math.max(from, to) + 1);
  const next = new Set(selection.value);
  run.forEach((code) => (on ? next.add(code) : next.delete(code)));
  selection.value = next;
  lastPicked = item.code;
}

// Every row the search and category show, drawn yet or not.
function pickAll() {
  selection.value = new Set(filtered.value.map((item) => item.code));
}

function clearPicked() {
  selection.value = new Set();
  confirmingDelete.value = false;
  lastPicked = null;
}

function stopSelecting() {
  clearPicked();
  selecting.value = false;
}

async function removePicked() {
  const gone = picked.value.length;
  if (selection.value.has(editingCode.value)) closeEditor();
  if (await persist(items.value.filter((item) => !selection.value.has(item.code)))) {
    stopSelecting();
    merged.value = t('menu.select.deleted', { n: formatNumber(gone), nouns: itemNoun(gone) });
  } else {
    confirmingDelete.value = false;
  }
}

// The editor sheet: which entry it shows, kept while it slides out after closing.
const editKey = computed(() => (adding.value ? NEW : editingCode.value));
const shownKey = ref(editKey.value);
watch(editKey, (key) => {
  if (key !== null) shownKey.value = key;
});
const editor = usePresence(() => editKey.value !== null, 250);
const editing = computed(() => (shownKey.value === NEW ? blank.value : items.value.find((item) => item.code === shownKey.value)));

function startEdit(code) {
  adding.value = false;
  editingCode.value = code;
}

function closeEditor() {
  adding.value = false;
  editingCode.value = null;
  saveError.value = null;
}

// A new search or category starts from the top again, with nothing picked,
// so Delete never takes rows the owner can no longer see.
watch([query, category], () => {
  limit.value = PAGE_SIZE;
  clearPicked();
});

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
    await agent.load();
    if (agent.noAgent) {
      router.replace('/setup');
      return;
    }
    [items.value, sheet.value, woo.value] = await Promise.all([
      fetchItems(),
      fetchSheet(),
      fetchWoo(),
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
  saving.value = true;
  try {
    await replaceItems(next);
    // `missing` on the Your agent page depends on there being items.
    agent.load({ force: true }).catch(() => {});
    return true;
  } catch (error) {
    items.value = previous;
    saveError.value = error.message;
    return false;
  } finally {
    saving.value = false;
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

async function saveItem(updated) {
  const code = shownKey.value;
  const next =
    code === NEW
      ? [...items.value, { ...updated, code: makeCode(updated.name, items.value.map((i) => i.code)) }]
      : items.value.map((i) => (i.code === code ? updated : i));
  if (await persist(next)) closeEditor();
}

async function remove() {
  if (await persist(items.value.filter((i) => i.code !== shownKey.value))) closeEditor();
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
