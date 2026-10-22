<template>
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('admin.title')" :subtitle="t('admin.subtitle')">
      <template #tabs>
        <div class="tabs" role="tablist">
          <button
            v-for="id in TABS"
            :key="id"
            type="button"
            role="tab"
            :aria-selected="id === tab"
            class="tab"
            :class="{ 'tab-active': id === tab }"
            @click="tab = id"
          >
            {{ t(`admin.tabs.${id}`) }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="island overflow-hidden pt-5">
    <!-- The overview loads its own numbers; the other tabs share the lists below. -->
    <OverviewSection v-if="tab === 'overview'"></OverviewSection>

    <LoadError v-else-if="error" :message="error" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!loaded"></SkeletonRows>

    <!-- Businesses: found by words, narrowed by status and desk. The list is short
         (the API sends up to 200), so this happens here, not on the server. -->
    <div v-else-if="tab === 'businesses'">
      <div class="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-8">
        <label class="relative block w-full sm:w-64">
          <span class="sr-only">{{ t('admin.searchBusinesses') }}</span>
          <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
          <input v-model.trim="query" class="field !h-9 pl-9" type="search" :placeholder="t('admin.searchBusinesses')" />
        </label>
        <label class="w-full sm:w-auto">
          <span class="sr-only">{{ t('admin.status') }}</span>
          <select v-model="status" class="field !h-9 sm:!w-40">
            <option value="all">{{ t('admin.anyStatus') }}</option>
            <option value="active">{{ t('admin.active') }}</option>
            <option value="suspended">{{ t('admin.suspended') }}</option>
          </select>
        </label>
        <label class="w-full sm:w-auto">
          <span class="sr-only">{{ t('admin.desk') }}</span>
          <select v-model="desk" class="field !h-9 sm:!w-48">
            <option value="all">{{ t('admin.anyDesk') }}</option>
            <option v-for="kind in desks" :key="kind" :value="kind">{{ deskLabel(kind) }}</option>
          </select>
        </label>
        <label class="w-full sm:w-auto">
          <span class="sr-only">{{ t('admin.sort') }}</span>
          <select v-model="sort" class="field !h-9 sm:!w-48">
            <option value="newest">{{ t('admin.sortNewest') }}</option>
            <option value="activity">{{ t('admin.sortActivity') }}</option>
          </select>
        </label>
        <p class="ml-auto hidden text-sm text-ink-soft sm:block">
          {{ t('admin.shown', { n: formatNumber(shownBusinesses.length), total: formatNumber(businesses.length) }) }}
        </p>
      </div>
      <div
        v-for="b in shownBusinesses"
        :key="b.id"
        class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_8rem_6rem] sm:px-8"
      >
        <div class="min-w-0">
          <router-link :to="`/admin/businesses/${b.id}`" class="block truncate text-sm font-semibold hover:underline">{{ b.name }}</router-link>
          <p class="truncate text-sm text-ink-soft">{{ b.owner_email || t('admin.noOwner') }}</p>
          <p v-if="b.suspended_reason" class="truncate text-sm text-attention">{{ t('admin.because', { reason: b.suspended_reason }) }}</p>
        </div>
        <p class="hidden text-sm text-ink-soft sm:block">{{ deskLabel(b.kind) }}</p>
        <p class="hidden text-sm sm:block">{{ t('admin.chats', { n: formatNumber(b.conversations) }, b.conversations) }}</p>
        <span class="justify-self-start">
          <LiveStatus :paused="b.status !== 'active'" :label="t('admin.active')" :paused-label="t('admin.suspended')"></LiveStatus>
        </span>
        <div class="col-span-2 sm:col-span-1 sm:text-right">
          <button type="button" class="btn btn-secondary btn-sm" @click="open(b)">{{ t('admin.open') }}</button>
        </div>
      </div>
      <p v-if="!businesses.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">{{ t('admin.noBusinesses') }}</p>
      <p v-else-if="!shownBusinesses.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">{{ t('admin.noMatch') }}</p>
    </div>

    <!-- Owners -->
    <div v-else-if="tab === 'owners'">
      <div
        v-if="temporary"
        class="mx-5 my-5 rounded-[var(--radius-card)] bg-brand-tint px-4 py-3 text-sm sm:mx-8"
        role="status"
      >
        <p class="font-semibold">{{ t('admin.newPassword', { email: temporary.email }) }}</p>
        <p class="mt-1">
          <code class="rounded bg-surface px-2 py-0.5 font-semibold select-all">{{ temporary.password }}</code>
        </p>
        <p class="mt-1 text-ink-soft">{{ t('admin.shownOnce') }}</p>
      </div>
      <div class="px-5 pb-4 sm:px-8">
        <label class="relative block w-full sm:w-64">
          <span class="sr-only">{{ t('admin.searchOwners') }}</span>
          <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
          <input v-model.trim="ownerQuery" class="field !h-9 pl-9" type="search" :placeholder="t('admin.searchOwners')" />
        </label>
      </div>
      <div
        v-for="u in shownUsers"
        :key="u.id"
        class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_14rem_9rem] sm:px-8"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ u.email }}</p>
          <p class="truncate text-sm text-ink-soft sm:hidden">{{ u.business_name || t('shell.heyDeskAdmin') }}</p>
        </div>
        <p class="hidden truncate text-sm text-ink-soft sm:block">{{ u.business_name || t('shell.heyDeskAdmin') }}</p>
        <div class="text-right">
          <button
            v-if="u.role !== 'admin'"
            type="button"
            class="btn btn-quiet btn-sm"
            :disabled="resettingId === u.id"
            @click="reset(u)"
          >
            {{ t('admin.resetPassword') }}
          </button>
          <span v-else class="chip bg-hover text-ink-soft">{{ t('admin.admin') }}</span>
        </div>
      </div>
      <p v-if="!shownUsers.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">{{ t('admin.noMatch') }}</p>
    </div>

    <!-- Activity -->
    <div v-else>
      <div v-for="group in auditGroups" :key="group.label">
        <h2 class="border-b border-hairline bg-wash px-5 py-1.5 text-xs font-semibold text-ink-soft sm:px-8">{{ group.label }}</h2>
        <div
          v-for="event in group.items"
          :key="event.id"
          class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-hairline px-5 py-3 text-sm sm:px-8"
        >
          <p class="min-w-0">
            <span class="font-semibold">{{ event.actor_email }}</span>
            <span class="ml-1 text-ink-soft">{{ event.action }}</span>
            <span v-if="event.target" class="ml-1 text-ink-soft">({{ event.target }})</span>
          </p>
          <p class="text-ink-soft">{{ formatTime(event.at) }}</p>
        </div>
      </div>
      <ShowMore v-if="auditHasMore" :loading="loadingMore" :error="moreError" @more="moreAudit"></ShowMore>
      <p v-if="!audit.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">{{ t('admin.nothingYet') }}</p>
    </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { PhMagnifyingGlass } from '@phosphor-icons/vue';

import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import OverviewSection from './OverviewSection.vue';
import {
  fetchBusinesses,
  fetchUsers,
  resetPassword,
  fetchAudit,
} from '../../api/admin.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber, formatTime } from '../../lib/format.js';
import { presetLabel } from '../../lib/presets.js';
import { useAuthStore } from '../../stores/auth.js';

const TABS = ['overview', 'businesses', 'owners', 'activity'];

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const tab = ref('overview');
const businesses = ref([]);
const users = ref([]);
const audit = ref([]); // the activity log only grows, so it comes a page at a time
const auditHasMore = ref(false);
const loadingMore = ref(false);
const moreError = ref(null);
const loaded = ref(false);
const error = ref(null);
const resettingId = ref(null);
const temporary = ref(null);

// Finding a business or an owner: words, then a status, a desk and an order.
const query = ref('');
const status = ref('all');
const desk = ref('all'); // a desk's id, or '' for no agent yet
const sort = ref('newest');
const ownerQuery = ref('');

const auditGroups = computed(() => groupByDay(audit.value, 'at'));

// The desks the businesses have, for the filter: only ones that are in the list.
const desks = computed(() => [...new Set(businesses.value.map((b) => b.kind ?? ''))]);

const shownBusinesses = computed(() => {
  const words = query.value.toLowerCase();
  const rows = businesses.value.filter(
    (b) =>
      (!words || b.name.toLowerCase().includes(words) || (b.owner_email ?? '').includes(words)) &&
      (status.value === 'all' || b.status === status.value) &&
      (desk.value === 'all' || (b.kind ?? '') === desk.value),
  );
  // The API sends the newest first; the busiest lately is the other order.
  if (sort.value === 'activity') {
    return [...rows].sort((a, b) => (b.last_activity_at ?? '').localeCompare(a.last_activity_at ?? ''));
  }
  return rows;
});

const shownUsers = computed(() => {
  const words = ownerQuery.value.toLowerCase();
  if (!words) return users.value;
  return users.value.filter(
    (u) => u.email.includes(words) || (u.business_name ?? '').toLowerCase().includes(words),
  );
});

function deskLabel(kind) {
  return kind ? presetLabel({ id: kind, label: kind }) : t('shell.noAgentYet');
}

// The newest page of the activity log (again after an admin action adds to it).
async function loadAudit() {
  audit.value = await fetchAudit({ limit: PAGE_SIZE });
  auditHasMore.value = audit.value.length === PAGE_SIZE;
  moreError.value = null;
}

async function load() {
  error.value = null;
  try {
    [businesses.value, users.value] = await Promise.all([fetchBusinesses(), fetchUsers(), loadAudit()]);
    loaded.value = true;
  } catch (err) {
    error.value = err.message;
  }
}

// The next page: what happened before the oldest event on screen.
async function moreAudit() {
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchAudit({ limit: PAGE_SIZE, before: audit.value[audit.value.length - 1].at });
    audit.value = [...audit.value, ...older];
    auditHasMore.value = older.length === PAGE_SIZE;
  } catch (err) {
    moreError.value = err.message;
  }
  loadingMore.value = false;
}

async function reset(user) {
  resettingId.value = user.id;
  try {
    const { password } = await resetPassword(user.id);
    temporary.value = { email: user.email, password };
    await loadAudit();
  } catch (err) {
    error.value = err.message;
  }
  resettingId.value = null;
}

// See the business as its owner does. Every change made there is in the Activity tab.
function open(business) {
  auth.view(business);
  router.push('/home');
}

load();
</script>
