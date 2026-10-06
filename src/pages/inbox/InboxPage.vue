<template>
  <section class="flex flex-col lg:h-full">
    <header class="px-5 pt-6 sm:px-8 sm:pt-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-[1.75rem] font-semibold tracking-tight">Inbox</h1>
          <p class="mt-1 text-ink-soft">What your agent took, waiting for you.</p>
        </div>

        <label class="relative block w-full sm:w-80">
          <span class="sr-only">Search orders and customers</span>
          <ph-magnifying-glass
            :size="18"
            class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"
          ></ph-magnifying-glass>
          <input
            v-model.trim="query"
            class="field pl-10"
            type="search"
            placeholder="Search orders and customers"
            @input="searchSoon"
          />
        </label>
      </div>

      <div
        v-if="needsHuman > 0"
        class="mt-5 flex items-center justify-between gap-4 rounded-[var(--radius-control)] bg-attention-tint px-4 py-3 text-sm text-attention"
        role="status"
      >
        <span class="flex items-center gap-2 font-medium">
          <ph-user-sound :size="18" weight="bold" class="shrink-0"></ph-user-sound>
          {{ needsHuman }}
          {{ needsHuman === 1 ? 'customer is' : 'customers are' }} waiting for a
          person.
        </span>
        <router-link to="/conversations?filter=needs_human" class="font-semibold whitespace-nowrap underline">
          Open chat
        </router-link>
      </div>

      <div
        v-if="jobs.length"
        class="mt-6 flex gap-6 overflow-x-auto border-b border-hairline"
        role="tablist"
      >
        <button
          v-for="job in jobs"
          :key="job.job"
          type="button"
          role="tab"
          :aria-selected="job.job === currentJob"
          class="tab-button"
          :class="{ 'tab-button-active': job.job === currentJob }"
          @click="selectJob(job.job)"
        >
          {{ tabLabel(job) }}
          <span v-if="job.waiting" class="ml-1.5 text-xs font-semibold">{{ job.waiting }}</span>
        </button>
      </div>
    </header>

    <div v-if="noAgent" class="px-5 py-16 sm:px-8">
      <div class="max-w-md">
        <h2 class="text-xl font-semibold tracking-tight">Let's set up your agent</h2>
        <p class="mt-2 text-ink-soft">
          Pick a starting point, add your details, and try it out. It takes
          about five minutes. Orders and messages will show up here.
        </p>
        <router-link to="/setup" class="btn btn-primary mt-6">Choose a preset</router-link>
      </div>
    </div>

    <p v-else-if="error" class="px-5 py-10 text-sm sm:px-8" role="alert">
      <span class="text-danger">{{ error }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">
        Try again
      </button>
    </p>

    <skeleton-rows v-else-if="isLoading" class="mt-2"></skeleton-rows>

    <div v-else-if="records.length === 0" class="px-5 py-16 sm:px-8">
      <div class="max-w-md">
        <h2 class="text-xl font-semibold tracking-tight">
          {{ query ? 'No matches' : 'Nothing here yet' }}
        </h2>
        <p class="mt-2 text-ink-soft">
          {{
            query
              ? 'Try a customer name, a phone number or a code like A-104.'
              : 'When a customer places an order or leaves a message, it shows up here. Share your chat link to get the first one.'
          }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_25rem]"
    >
      <div class="lg:min-h-0 lg:overflow-y-auto">
        <div v-for="group in groups" :key="group.label">
          <h2 class="px-5 pt-5 pb-2 text-sm font-semibold text-ink-soft sm:px-8">
            {{ group.label }}
          </h2>
          <record-row
            v-for="record in group.items"
            :key="record.id"
            :record="record"
            :selected="record.id === selectedId"
            @select="selectedId = record.id"
          ></record-row>
        </div>
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
import { PhMagnifyingGlass, PhUserSound } from '@phosphor-icons/vue';

import RecordRow from '../../components/records/RecordRow.vue';
import RecordDetail from '../../components/records/RecordDetail.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchRecords, setRecordStatus } from '../../api/records.js';
import { groupByDay } from '../../lib/group.js';

export default {
  components: {
    RecordRow,
    RecordDetail,
    SkeletonRows,
    PhMagnifyingGlass,
    PhUserSound,
  },
  data() {
    return {
      currentJob: null,
      query: '',
      searchTimer: null,
      records: [],
      selectedId: null,
      isLoading: true,
      isMoving: false,
      noAgent: false,
      error: null,
      moveError: null,
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
      return this.records.find((record) => record.id === this.selectedId);
    },
  },
  created() {
    this.load();
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer);
  },
  methods: {
    // The API names a job in the singular ("Pickup order"); a tab holds many.
    tabLabel(job) {
      const plural = { order: 'Orders', message: 'Messages' };
      return plural[job.job] || job.title;
    },
    async load() {
      this.isLoading = true;
      this.error = null;
      this.noAgent = false;
      try {
        // The counts say which jobs exist; the first one is the default tab.
        await this.$store.dispatch('inbox/load');
        if (!this.currentJob && this.jobs.length) {
          this.currentJob = this.jobs[0].job;
        }
        await this.loadRecords();
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
      this.records = await fetchRecords(token, {
        job: this.currentJob,
        q: this.query,
      });
      this.selectedId = this.records.length ? this.records[0].id : null;
      this.moveError = null;
    },
    async reload() {
      this.isLoading = true;
      try {
        await this.loadRecords();
      } catch (error) {
        this.error = error.message;
      }
      this.isLoading = false;
    },
    selectJob(job) {
      this.currentJob = job;
      this.reload();
    },
    // Wait for a pause in typing before asking the server.
    searchSoon() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(this.reload, 300);
    },
    async move(status) {
      this.isMoving = true;
      this.moveError = null;
      try {
        const token = this.$store.getters['auth/token'];
        const updated = await setRecordStatus(token, this.selectedId, status);
        const index = this.records.findIndex((r) => r.id === updated.id);
        this.records.splice(index, 1, updated);
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
  transition: color 0.2s var(--ease-settle),
    border-color 0.2s var(--ease-settle);
}

.tab-button:hover {
  color: var(--color-ink);
}

.tab-button-active {
  color: var(--color-brand);
  border-bottom-color: var(--color-brand);
}
</style>
