<template>
  <section class="flex flex-col lg:h-full">
    <page-header title="Inbox" subtitle="What your agent took, waiting for you. Every item was confirmed by the customer.">
      <template #actions>
        <label class="relative block w-full sm:w-72">
          <span class="sr-only">Search by name, phone or code</span>
          <ph-magnifying-glass
            :size="16"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"
          ></ph-magnifying-glass>
          <input
            v-model.trim="query"
            class="field pl-9"
            type="search"
            placeholder="Search by name, phone or code"
            @input="searchSoon"
          />
        </label>
      </template>
      <template v-if="jobs.length > 1" #tabs>
        <div class="tabs" role="tablist">
          <button
            v-for="job in jobs"
            :key="job.job"
            type="button"
            role="tab"
            :aria-selected="job.job === currentJob"
            class="tab"
            :class="{ 'tab-active': job.job === currentJob }"
            @click="selectJob(job.job)"
          >
            {{ tabLabel(job) }}
            <span v-if="job.waiting" class="count">{{ job.waiting }}</span>
          </button>
        </div>
      </template>
    </page-header>

    <router-link
      v-if="needsHuman > 0"
      to="/conversations?filter=needs_human"
      class="notice mx-5 mb-4 items-center transition-colors hover:bg-wash sm:mx-8"
      :class="{ 'mt-4': jobs.length > 1 }"
    >
      <ph-user-sound :size="20" weight="bold" class="shrink-0 text-attention"></ph-user-sound>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold text-ink">
          {{ needsHuman }} {{ needsHuman === 1 ? 'customer is' : 'customers are' }} waiting for a person
        </span>
        <span class="mt-0.5 block text-ink-soft">Your agent handed these chats over. Read them, then call back.</span>
      </span>
      <span class="flex items-center gap-1 font-semibold whitespace-nowrap text-brand">
        Open
        <ph-arrow-right :size="14" weight="bold"></ph-arrow-right>
      </span>
    </router-link>

    <empty-state
      v-if="noAgent"
      :icon="icons.sparkle"
      title="Let's set up your agent"
      text="Pick a starting point, add your details, and try it out. It takes about five minutes. Orders and messages will show up here."
    >
      <router-link to="/setup" class="btn btn-primary">Set up your agent</router-link>
    </empty-state>

    <load-error v-else-if="error" :message="error" @retry="load"></load-error>

    <skeleton-rows v-else-if="isLoading" :class="{ 'border-t border-hairline': jobs.length <= 1 }"></skeleton-rows>

    <empty-state
      v-else-if="records.length === 0"
      :icon="query ? icons.search : icons.tray"
      :title="query ? 'No matches' : 'Nothing here yet'"
      :text="
        query
          ? 'Try a customer name, a phone number or a code like A-104.'
          : 'When a customer orders, books or leaves a message, it shows up here. Share your chat link to get the first one.'
      "
    >
      <router-link v-if="!query" to="/channels" class="btn btn-secondary">Share your chat link</router-link>
    </empty-state>

    <div
      v-else
      class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]"
      :class="{ 'border-t border-hairline': jobs.length <= 1 }"
    >
      <div class="lg:min-h-0 lg:overflow-y-auto">
        <div v-for="group in groups" :key="group.label">
          <h2 class="sticky top-0 z-[1] border-b border-hairline bg-wash/95 px-5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur sm:px-8">
            {{ group.label }}
          </h2>
          <record-row
            v-for="record in group.items"
            :key="record.id"
            :record="record"
            :selected="record.id === selectedId"
            @select="select(record.id)"
          ></record-row>
        </div>
        <show-more v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></show-more>
      </div>

      <aside
        v-if="selected"
        class="border-t border-hairline bg-wash lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l"
      >
        <record-detail
          :record="selected"
          :busy="isMoving"
          :error="moveError"
          @move="move"
        ></record-detail>
      </aside>
    </div>
  </section>
</template>

<script>
import { markRaw } from 'vue';
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
import { JOB_TABS } from '../../lib/records.js';

export default {
  components: {
    PageHeader,
    EmptyState,
    LoadError,
    RecordRow,
    RecordDetail,
    SkeletonRows,
    ShowMore,
    PhArrowRight,
    PhMagnifyingGlass,
    PhUserSound,
  },
  data() {
    return {
      // ?job=order&open=<id> opens one record straight away (links from Home).
      currentJob: this.$route.query.job || null,
      query: '',
      searchTimer: null,
      lastAsk: 0, // numbers each records request, so only the newest one counts
      records: [], // the pages loaded so far, newest first
      linked: null, // the record a link asked for, when it is older than the first page
      hasMore: false, // the last page was full, so there may be older records
      loadingMore: false,
      moreError: null,
      selectedId: this.$route.query.open || null,
      isLoading: true,
      isMoving: false,
      noAgent: false,
      error: null,
      moveError: null,
      // markRaw: components are fixed, so Vue need not watch them for changes.
      icons: markRaw({ sparkle: PhSparkle, tray: PhTray, search: PhMagnifyingGlass }),
    };
  },
  computed: {
    jobs() {
      return this.$store.getters['inbox/jobs'];
    },
    needsHuman() {
      return this.$store.getters['inbox/needsHuman'];
    },
    groups() {
      return groupByDay(this.records);
    },
    selected() {
      const inList = this.records.find((record) => record.id === this.selectedId);
      if (inList) return inList;
      return this.linked && this.linked.id === this.selectedId ? this.linked : null;
    },
  },
  created() {
    this.load();
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer);
  },
  methods: {
    tabLabel(job) {
      return JOB_TABS[job.job] || job.title;
    },
    async load() {
      this.isLoading = true;
      this.error = null;
      this.noAgent = false;
      try {
        // The counts say which jobs exist; the first one is the default tab.
        await this.$store.dispatch('inbox/load');
        const known = this.jobs.some((job) => job.job === this.currentJob);
        if (!known && this.jobs.length) {
          this.currentJob = this.jobs[0].job;
        }
        await this.loadRecords();
        await this.openLinked();
      } catch (error) {
        // A new business has no agent yet: that is a first step, not a failure.
        if (error.status === 404 && error.code === 'not_found') {
          this.noAgent = true;
        } else {
          this.error = error.message;
        }
      }
      this.isLoading = false;
    },
    async loadRecords() {
      const token = this.$store.getters['auth/token'];
      // Typing "a1" then "a10" sends two searches, and the first can answer
      // last. An answer to an older request is dropped, so it cannot replace
      // the newer one on screen.
      const ask = ++this.lastAsk;
      const records = await fetchRecords(token, {
        job: this.currentJob,
        q: this.query,
        limit: PAGE_SIZE,
      });
      if (ask !== this.lastAsk) return;
      this.records = records;
      this.hasMore = records.length === PAGE_SIZE;
      this.moreError = null;
      // Keep the record asked for in the link if it is in the list; else the newest.
      if (!this.records.some((r) => r.id === this.selectedId)) {
        this.selectedId = this.records.length ? this.records[0].id : null;
      }
      this.moveError = null;
    },
    async reload() {
      this.isLoading = true;
      try {
        await this.loadRecords();
        await this.openLinked();
      } catch (error) {
        this.error = error.message;
      }
      this.isLoading = false;
    },
    // A link from Home can name a waiting record older than the first page:
    // fetch just that one for the detail pane. If it is gone, the newest stays open.
    async openLinked() {
      const id = this.$route.query.open;
      if (!id || !this.currentJob || this.records.some((r) => r.id === id)) return;
      try {
        this.linked = await fetchRecord(this.$store.getters['auth/token'], this.currentJob, id);
        this.selectedId = id;
      } catch (error) {
        // Not found: nothing to open.
      }
    },
    // The next page: the records made before the oldest one on screen.
    async showMore() {
      const ask = this.lastAsk;
      const oldest = this.records[this.records.length - 1];
      this.loadingMore = true;
      this.moreError = null;
      try {
        const older = await fetchRecords(this.$store.getters['auth/token'], {
          job: this.currentJob,
          q: this.query,
          limit: PAGE_SIZE,
          before: oldest.created_at,
        });
        // A new search or tab started meanwhile: this page belongs to the old list.
        if (ask === this.lastAsk) {
          this.records = [...this.records, ...older];
          this.hasMore = older.length === PAGE_SIZE;
        }
      } catch (error) {
        this.moreError = error.message;
      }
      this.loadingMore = false;
    },
    select(id) {
      this.selectedId = id;
      this.moveError = null;
    },
    selectJob(job) {
      this.currentJob = job;
      this.selectedId = null;
      this.reload();
    },
    // Wait for a pause in typing before asking the server (debounce). The old
    // results stay on screen until the new ones arrive, so the list does not
    // flash a skeleton on every pause.
    searchSoon() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(this.search, 300);
    },
    async search() {
      try {
        await this.loadRecords();
        await this.openLinked();
      } catch (error) {
        this.error = error.message;
      }
    },
    async move(status, extra) {
      this.isMoving = true;
      this.moveError = null;
      try {
        const token = this.$store.getters['auth/token'];
        const updated = await setRecordStatus(token, this.selectedId, status, extra);
        const index = this.records.findIndex((r) => r.id === updated.id);
        if (index === -1) this.linked = updated;
        else this.records.splice(index, 1, updated);
        this.$store.dispatch('inbox/load').catch(() => {});
      } catch (error) {
        // e.g. 409: the status already changed elsewhere. Show the sentence.
        this.moveError = error.message;
      }
      this.isMoving = false;
    },
  },
};
</script>
