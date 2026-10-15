<template>
  <section class="flex flex-col">
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

    <LoadError v-if="error" :message="error" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!loaded"></SkeletonRows>

    <!-- Businesses -->
    <div v-else-if="tab === 'businesses'">
      <div
        v-for="b in businesses"
        :key="b.id"
        class="row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_8rem_13rem] sm:px-8"
      >
        <div class="min-w-0">
          <router-link :to="`/admin/businesses/${b.id}`" class="block truncate text-sm font-semibold hover:underline">{{ b.name }}</router-link>
          <p class="truncate text-sm text-ink-soft">{{ b.owner_email || t('admin.noOwner') }}</p>
        </div>
        <p class="hidden text-sm text-ink-soft sm:block">{{ b.kind || t('shell.noAgentYet') }}</p>
        <p class="hidden text-sm sm:block">{{ t('admin.chats', { n: formatNumber(b.conversations) }, b.conversations) }}</p>
        <span class="justify-self-start">
          <LiveStatus :paused="b.status !== 'active'" :label="t('admin.active')" :paused-label="t('admin.suspended')"></LiveStatus>
        </span>
        <div class="col-span-2 sm:col-span-1 sm:text-right">
          <span v-if="confirmingId === b.id" class="flex items-center gap-2 sm:justify-end">
            <button type="button" class="btn btn-sm" :class="b.status === 'active' ? 'btn-danger' : 'btn-primary'" @click="toggleStatus(b)">
              {{ b.status === 'active' ? t('admin.suspend') : t('admin.reactivate') }}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" @click="confirmingId = null">{{ t('admin.keepAsIs') }}</button>
          </span>
          <span v-else class="flex items-center gap-2 sm:justify-end">
            <button type="button" class="btn btn-secondary btn-sm" @click="open(b)">{{ t('admin.open') }}</button>
            <button type="button" class="btn btn-quiet btn-sm" @click="confirmingId = b.id">
              {{ b.status === 'active' ? t('admin.suspend') : t('admin.reactivate') }}
            </button>
          </span>
        </div>
      </div>
      <p v-if="!businesses.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">{{ t('admin.noBusinesses') }}</p>
    </div>

    <!-- Owners -->
    <div v-else-if="tab === 'owners'">
      <div
        v-if="temporary"
        class="mx-5 my-5 rounded-[var(--radius-panel)] border border-brand/15 bg-brand-tint px-4 py-3 text-sm sm:mx-8"
        role="status"
      >
        <p class="font-semibold">{{ t('admin.newPassword', { email: temporary.email }) }}</p>
        <p class="mt-1">
          <code class="rounded bg-surface px-2 py-0.5 font-semibold select-all">{{ temporary.password }}</code>
        </p>
        <p class="mt-1 text-ink-soft">{{ t('admin.shownOnce') }}</p>
      </div>
      <div
        v-for="u in users"
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
            v-if="u.role === 'owner'"
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
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import {
  fetchBusinesses,
  setBusinessStatus,
  fetchUsers,
  resetPassword,
  fetchAudit,
} from '../../api/admin.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber, formatTime } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const TABS = ['businesses', 'owners', 'activity'];

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const tab = ref('businesses');
const businesses = ref([]);
const users = ref([]);
const audit = ref([]); // the activity log only grows, so it comes a page at a time
const auditHasMore = ref(false);
const loadingMore = ref(false);
const moreError = ref(null);
const loaded = ref(false);
const error = ref(null);
const confirmingId = ref(null);
const resettingId = ref(null);
const temporary = ref(null);

const auditGroups = computed(() => groupByDay(audit.value, 'at'));

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

async function toggleStatus(business) {
  const next = business.status === 'active' ? 'suspended' : 'active';
  try {
    await setBusinessStatus(business.id, next);
    business.status = next;
    confirmingId.value = null;
    await loadAudit();
  } catch (err) {
    error.value = err.message;
  }
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
