<template>
  <section class="flex flex-col lg:h-full">
    <PageHeader :title="t('inbox.title')" :subtitle="t('inbox.subtitle')">
      <template #actions>
        <label class="relative block w-full sm:w-72">
          <span class="sr-only">{{ t('inbox.search') }}</span>
          <PhMagnifyingGlass
            :size="16"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"
          ></PhMagnifyingGlass>
          <input
            v-model.trim="query"
            class="field pl-9"
            type="search"
            :placeholder="t('inbox.search')"
            @input="searchSoon"
          />
        </label>
      </template>
      <template v-if="inbox.jobs.length > 1" #tabs>
        <div class="tabs" role="tablist">
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
            <span v-if="job.waiting" class="count">{{ formatNumber(job.waiting) }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <router-link
      v-if="inbox.needsHuman > 0"
      to="/conversations?filter=needs_human"
      class="notice mx-5 mb-4 items-center transition-colors hover:bg-wash sm:mx-8"
      :class="{ 'mt-4': inbox.jobs.length > 1 }"
    >
      <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold text-ink">
          {{ t('inbox.waitingForPerson', { n: formatNumber(inbox.needsHuman) }, inbox.needsHuman) }}
        </span>
        <span class="mt-0.5 block text-ink-soft">{{ t('inbox.handedOver') }}</span>
      </span>
      <span class="flex items-center gap-1 font-semibold whitespace-nowrap text-brand">
        {{ t('common.open') }}
        <PhArrowRight :size="14" weight="bold"></PhArrowRight>
      </span>
    </router-link>

    <EmptyState
      v-if="noAgent"
      :icon="PhSparkle"
      :title="t('common.letsSetUp')"
      :text="t('inbox.setUpText')"
    >
      <router-link to="/setup" class="btn btn-primary">{{ t('common.setUpYourAgent') }}</router-link>
    </EmptyState>

    <LoadError v-else-if="error" :message="error" @retry="load"></LoadError>

    <SkeletonRows v-else-if="isLoading" :class="{ 'border-t border-hairline': inbox.jobs.length <= 1 }"></SkeletonRows>

    <EmptyState
      v-else-if="records.length === 0"
      :icon="query ? PhMagnifyingGlass : PhTray"
      :title="query ? t('inbox.noMatches') : t('inbox.emptyTitle')"
      :text="query ? t('inbox.noMatchesText') : t('inbox.emptyText')"
    >
      <router-link v-if="!query" to="/channels" class="btn btn-secondary">{{ t('common.shareChatLink') }}</router-link>
    </EmptyState>

    <div
      v-else
      class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]"
      :class="{ 'border-t border-hairline': inbox.jobs.length <= 1 }"
    >
      <div class="lg:min-h-0 lg:overflow-y-auto">
        <div v-for="group in groups" :key="group.label">
          <h2 class="sticky top-0 z-[1] border-b border-hairline bg-wash/95 px-5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur sm:px-8">
            {{ group.label }}
          </h2>
          <RecordRow
            v-for="record in group.items"
            :key="record.id"
            :record="record"
            :selected="record.id === selectedId"
            @select="select(record.id)"
          ></RecordRow>
        </div>
        <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></ShowMore>
      </div>

      <aside
        v-if="selected"
        class="border-t border-hairline bg-wash lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l"
      >
        <RecordDetail
          :record="selected"
          :busy="isMoving"
          :error="moveError"
          @move="move"
        ></RecordDetail>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhArrowRight,
  PhMagnifyingGlass,
  PhSparkle,
  PhTray,
  PhUserSound,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import RecordRow from '../../components/records/RecordRow.vue';
import RecordDetail from '../../components/records/RecordDetail.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import { fetchRecords, fetchRecord, setRecordStatus } from '../../api/records.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber } from '../../lib/format.js';
import { jobTab } from '../../lib/records.js';
import { useInboxStore } from '../../stores/inbox.js';

const route = useRoute();
const { t } = useI18n();
const inbox = useInboxStore();

// ?job=order&open=<id> opens one record straight away (links from Home).
const currentJob = ref(route.query.job || null);
const selectedId = ref(route.query.open || null);
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

const groups = computed(() => groupByDay(records.value));
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
  const page = await fetchRecords({ job: currentJob.value, q: query.value, limit: PAGE_SIZE });
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
  moveError.value = null;
}

function selectJob(job) {
  currentJob.value = job;
  selectedId.value = null;
  reload();
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

async function move(status, extra) {
  isMoving.value = true;
  moveError.value = null;
  try {
    const updated = await setRecordStatus(selectedId.value, status, extra);
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
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>
