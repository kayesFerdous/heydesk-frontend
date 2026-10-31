<template>
  <!-- Two islands on the canvas under the status tabs: the list and the open
       record (its actions at the top). A phone shows the list, then one record with a way back. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full">
    <PageHeader :class="{ 'max-lg:hidden': opened }" :title="t('inbox.title')" :subtitle="t('inbox.subtitle')">
      <template #actions>
        <label class="relative w-full sm:w-60">
          <span class="sr-only">{{ t('inbox.search') }}</span>
          <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
          <input v-model.trim="query" class="field !border-transparent !bg-wash pl-9" type="search" :placeholder="t('inbox.searchHint')" @input="searchSoon" />
        </label>
        <div v-if="inbox.jobs.length > 1" class="tabs rounded-[0.875rem] bg-surface p-1" role="tablist">
          <button
            v-for="job in inbox.jobs"
            :key="job.job"
            type="button"
            role="tab"
            :aria-selected="job.job === currentJob"
            class="tab"
            :class="{ 'tab-active': job.job === currentJob }"
            @click="selectJob(job.job)"
          >
            {{ jobTab(job.job) }}
            <span v-if="job.waiting" class="count" :class="{ '!bg-ink !text-white': job.job === currentJob }">{{ formatNumber(job.waiting) }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <router-link
      v-if="inbox.needsHuman > 0"
      to="/conversations?filter=needs_human"
      class="island mb-3 flex items-center gap-3 p-3 pr-5 text-sm transition-shadow hover:shadow-[var(--shadow-lift)]"
      :class="{ 'max-lg:hidden': opened }"
    >
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-attention-tint text-attention" aria-hidden="true">
        <PhUserSound :size="20" weight="bold"></PhUserSound>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-bold text-ink">
          {{ t('inbox.waitingForPerson', { n: formatNumber(inbox.needsHuman) }, inbox.needsHuman) }}
        </span>
        <span class="block text-ink-soft">{{ t('inbox.handedOver') }}</span>
      </span>
      <span class="flex items-center gap-1 font-bold whitespace-nowrap">
        {{ t('common.open') }}
        <PhArrowRight :size="14" weight="bold"></PhArrowRight>
      </span>
    </router-link>

    <div v-if="noAgent" class="island">
      <EmptyState :icon="PhSparkle" :title="t('common.letsSetUp')" :text="t('inbox.setUpText')">
        <router-link to="/setup" class="btn btn-primary">{{ t('common.setUpYourAgent') }}</router-link>
      </EmptyState>
    </div>

    <LoadError v-else-if="error" class="island" :message="error" @retry="load"></LoadError>

    <template v-else>
      <button v-if="opened" type="button" class="btn btn-secondary mb-3 self-start lg:hidden" @click="opened = false">
        <PhArrowLeft :size="18"></PhArrowLeft>
        {{ t('inbox.back') }}
      </button>

      <!-- One island: the list on the left, the open record ruled off on the right. -->
      <div class="island flex flex-col overflow-hidden lg:min-h-0 lg:flex-1 lg:flex-row">
        <div class="flex min-w-0 flex-1 flex-col lg:min-h-0" :class="{ 'max-lg:hidden': opened }">
          <!-- The status tabs on one line: the road a record usually takes, in
               order, a caret between steps; then All; then More for the side roads. -->
          <div v-if="currentJob" class="flex shrink-0 items-center gap-1.5 border-b border-hairline p-2">
            <nav class="tabs min-w-0 flex-1 items-center !gap-0.5" :aria-label="t('inbox.statuses')">
              <template v-for="(s, index) in path" :key="s">
                <PhCaretRight v-if="index > 0" :size="12" weight="bold" class="shrink-0 text-ink-faint" aria-hidden="true"></PhCaretRight>
                <button type="button" :aria-pressed="s === status" class="tab" :class="{ 'tab-active': s === status }" @click="selectStatus(s)">
                  {{ statusLabel(s) }}
                  <span v-if="s === 'new' && waiting > 0" class="count" :class="{ '!bg-ink !text-white': s === status }">{{ formatNumber(waiting) }}</span>
                </button>
              </template>
              <span class="ml-auto pl-3" aria-hidden="true"></span>
              <button type="button" :aria-pressed="status === ALL" class="tab" :class="{ 'tab-active': status === ALL }" @click="selectStatus(ALL)">
                {{ t('inbox.all') }}
              </button>
            </nav>
            <div v-if="side.length" ref="sideRoot" class="relative shrink-0">
              <button
                type="button"
                class="tab"
                :class="onSide ? 'tab-active' : 'border border-hairline'"
                aria-haspopup="menu"
                :aria-expanded="sideOpen"
                @click="sideOpen = !sideOpen"
              >
                {{ onSide ? statusLabel(status) : t('inbox.more') }}
                <PhCaretDown :size="12" weight="bold"></PhCaretDown>
              </button>
              <div v-if="sideOpen" class="popover right-0 w-56" role="menu">
                <button
                  v-for="s in side"
                  :key="s"
                  type="button"
                  role="menuitemradio"
                  :aria-checked="s === status"
                  class="menu-item"
                  @click="pickSide(s)"
                >
                  <span class="flex-1">{{ statusLabel(s) }}</span>
                  <PhCheck v-if="s === status" :size="16" weight="bold"></PhCheck>
                </button>
              </div>
            </div>
          </div>

          <SkeletonRows v-if="isLoading"></SkeletonRows>

          <EmptyState
            v-else-if="records.length === 0"
            :icon="query ? PhMagnifyingGlass : filtered ? PhFunnelSimple : PhTray"
            :title="query ? t('inbox.noMatches') : filtered ? t('inbox.emptyStatusTitle') : t('inbox.emptyTitle')"
            :text="query ? t('inbox.noMatchesText') : filtered ? t('inbox.emptyStatusText') : t('inbox.emptyText')"
          >
            <button v-if="filtered && !query" type="button" class="btn btn-secondary" @click="selectStatus(ALL)">{{ t('inbox.seeAll') }}</button>
            <router-link v-else-if="!query" to="/channels" class="btn btn-secondary">{{ t('common.shareChatLink') }}</router-link>
          </EmptyState>

          <div v-else class="min-h-0 flex-1 overflow-y-auto">
            <!-- From 1024px a table; a phone keeps the rows. Same data, CSS picks. -->
            <RecordTable
              class="max-lg:hidden"
              :job="currentJob"
              :days="groups"
              :selected-id="selectedId"
              :show-status="status === ALL"
              @select="select"
            ></RecordTable>
            <div class="px-2 pb-2 lg:hidden">
              <div v-for="group in groups" :key="group.label">
                <h2 class="day-head !border-hairline !px-2.5 !pt-3">
                  {{ group.label }}
                  <span v-if="isOrders" class="font-medium text-ink-soft">{{ dayTotal(group) }}</span>
                </h2>
                <div class="flex flex-col gap-1 pt-1.5">
                  <RecordRow
                    v-for="record in group.items"
                    :key="record.id"
                    :record="record"
                    :selected="record.id === selectedId"
                    :show-status="status === ALL"
                    @select="select(record.id)"
                  ></RecordRow>
                </div>
              </div>
            </div>
            <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></ShowMore>
          </div>
        </div>

        <aside
          v-if="selected && !isLoading"
          class="shrink-0 lg:min-h-0 lg:w-[20rem] lg:overflow-y-auto lg:border-l lg:border-hairline xl:w-[24rem] 2xl:w-[27rem]"
          :class="{ 'max-lg:hidden': !opened }"
        >
          <RecordDetail :key="selected.id" :record="selected" :busy="isMoving" :error="moveError" @move="move"></RecordDetail>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhArrowLeft,
  PhArrowRight,
  PhCaretDown,
  PhCaretRight,
  PhCheck,
  PhFunnelSimple,
  PhMagnifyingGlass,
  PhSparkle,
  PhTray,
  PhUserSound,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import RecordTable from '../../components/records/RecordTable.vue';
import RecordRow from '../../components/records/RecordRow.vue';
import RecordDetail from '../../components/records/RecordDetail.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import { fetchRecords, fetchRecord, setRecordStatus } from '../../api/records.js';
import { usePopover } from '../../composables/usePopover.js';
import { pathOf, sideStatusesOf, statusLabel } from '../../lib/flows.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { jobTab } from '../../lib/records.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useAgentStore } from '../../stores/agent.js';

const route = useRoute();
const { t } = useI18n();
const inbox = useInboxStore();
const agent = useAgentStore();

// ?job=order&open=<id> opens one record straight away (links from Home).
const currentJob = ref(route.query.job || null);
const selectedId = ref(route.query.open || null);
// Desktop always shows the selected record beside the list; a phone shows it
// only once it was picked (or a link opened it), instead of under the list.
const opened = ref(Boolean(route.query.open));
// Every record of the job, whatever its status.
const ALL = 'all';
// Until the owner picks a tab, the Inbox opens on New when something waits,
// else on All. Decided once, when the counts arrive, so it does not jump.
const status = ref(null);
const { open: sideOpen, root: sideRoot } = usePopover();
const query = ref('');
const records = ref([]); // the pages loaded so far, newest first
const linked = ref(null); // the record a link asked for, when it is older than the first page
const hasMore = ref(false); // the last page was full, so there may be older records
const loadingMore = ref(false);
const moreError = ref(null);
const isLoading = ref(true);
const isMoving = ref(false);
const noAgent = ref(false);
const error = ref(null);
const moveError = ref(null);
let searchTimer = null;
let lastAsk = 0; // numbers each records request, so only the newest one counts

const waiting = computed(() => inbox.jobs.find((j) => j.job === currentJob.value)?.waiting ?? 0);
// A shop's orders have their own steps (lib/flows.js).
const flow = computed(() => (agent.kind === 'shop' && currentJob.value === 'order' ? 'shop_order' : currentJob.value));
const path = computed(() => (flow.value ? pathOf(flow.value) : []));
const side = computed(() => (flow.value ? sideStatusesOf(flow.value) : []));
const onSide = computed(() => side.value.includes(status.value));

const groups = computed(() => groupByDay(records.value));
// Orders carry money: their list gets an amount column and a total per day.
// An empty tab with no search is a quiet status, not an empty Inbox.
const filtered = computed(() => !query.value && status.value !== ALL);
const isOrders = computed(() => currentJob.value === 'order');

// "Today ৳2,450": what the day's orders on screen add up to, counted the same
// way as "Taken today" on Home.
function dayTotal(group) {
  return formatMoney(group.items.reduce((sum, record) => sum + (record.total || 0), 0));
}
const selected = computed(() => {
  const inList = records.value.find((record) => record.id === selectedId.value);
  if (inList) return inList;
  return linked.value && linked.value.id === selectedId.value ? linked.value : null;
});

async function load() {
  isLoading.value = true;
  error.value = null;
  noAgent.value = false;
  try {
    // The counts say which jobs exist; the first one is the default tab.
    await inbox.load();
    const known = inbox.jobs.some((job) => job.job === currentJob.value);
    if (!known && inbox.jobs.length) currentJob.value = inbox.jobs[0].job;
    pickDefaultStatus();
    await loadRecords();
    await openLinked();
  } catch (err) {
    // A new business has no agent yet: that is a first step, not a failure.
    if (err.status === 404 && err.code === 'not_found') noAgent.value = true;
    else error.value = err.message;
  }
  isLoading.value = false;
}

async function loadRecords() {
  // Typing "a1" then "a10" sends two searches, and the first can answer
  // last. An answer to an older request is dropped, so it cannot replace
  // the newer one on screen.
  const ask = ++lastAsk;
  const page = await fetchRecords({ job: currentJob.value, status: status.value === ALL ? undefined : status.value, q: query.value, limit: PAGE_SIZE });
  if (ask !== lastAsk) return;
  records.value = page;
  hasMore.value = page.length === PAGE_SIZE;
  moreError.value = null;
  // Keep the record asked for in the link if it is in the list; else the newest.
  if (!page.some((r) => r.id === selectedId.value)) {
    selectedId.value = page.length ? page[0].id : null;
  }
  moveError.value = null;
}

async function reload() {
  isLoading.value = true;
  try {
    await loadRecords();
    await openLinked();
  } catch (err) {
    error.value = err.message;
  }
  isLoading.value = false;
}

// A link from Home can name a waiting record older than the first page:
// fetch just that one for the detail pane. If it is gone, the newest stays open.
async function openLinked() {
  const id = route.query.open;
  if (!id || !currentJob.value || records.value.some((r) => r.id === id)) return;
  try {
    linked.value = await fetchRecord(currentJob.value, id);
    selectedId.value = id;
  } catch (err) {
    // Not found: nothing to open.
  }
}

// The next page: the records made before the oldest one on screen.
async function showMore() {
  const ask = lastAsk;
  const oldest = records.value[records.value.length - 1];
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchRecords({
      job: currentJob.value,
      status: status.value === ALL ? undefined : status.value,
      q: query.value,
      limit: PAGE_SIZE,
      before: oldest.created_at,
    });
    // A new search or tab started meanwhile: this page belongs to the old list.
    if (ask === lastAsk) {
      records.value = [...records.value, ...older];
      hasMore.value = older.length === PAGE_SIZE;
    }
  } catch (err) {
    moreError.value = err.message;
  }
  loadingMore.value = false;
}

function select(id) {
  selectedId.value = id;
  opened.value = true;
  moveError.value = null;
  window.scrollTo(0, 0); // a phone starts the record at its top
}

function pickDefaultStatus() {
  if (!status.value) status.value = waiting.value > 0 && !route.query.open ? 'new' : ALL;
}

function selectJob(job) {
  currentJob.value = job;
  status.value = null;
  pickDefaultStatus();
  selectedId.value = null;
  opened.value = false;
  reload();
}

function selectStatus(next) {
  status.value = next;
  selectedId.value = null;
  opened.value = false;
  reload();
}

function pickSide(next) {
  sideOpen.value = false;
  selectStatus(next);
}

async function search() {
  try {
    await loadRecords();
    await openLinked();
  } catch (err) {
    error.value = err.message;
  }
}

// Wait for a pause in typing before asking the server (debounce). The old
// results stay on screen until the new ones arrive, so the list does not
// flash a skeleton on every pause.
function searchSoon() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(search, 300);
}

async function move(to) {
  isMoving.value = true;
  moveError.value = null;
  try {
    const updated = await setRecordStatus(selectedId.value, to);
    const index = records.value.findIndex((r) => r.id === updated.id);
    if (index === -1) linked.value = updated;
    else records.value.splice(index, 1, updated);
    inbox.load().catch(() => {});
  } catch (err) {
    // e.g. 409: the status already changed elsewhere. Show the sentence.
    moveError.value = err.message;
  }
  isMoving.value = false;
}

load();
// New work came in (the counts went up): the list again, quietly, like a search.
watch(() => inbox.arrivals, search);
// The sidebar's count tiles link to /inbox?job=…, also while the Inbox is open.
watch(
  () => route.query.job,
  (job) => {
    if (job && job !== currentJob.value) selectJob(job);
  },
);
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>
