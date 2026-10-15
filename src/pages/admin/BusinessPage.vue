<template>
  <!-- One business at a glance, for a HeyDesk admin (backend D69): what it is,
       what is connected, how busy it is, and what admins did in it. Counts and
       connections only; to read its chats, the admin opens the business. -->
  <section>
    <PageHeader :title="business?.name ?? t('admin.title')">
      <template v-if="business" #subtitle>
        <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          <span>{{ business.kind ? deskLabel(business.kind) : t('shell.noAgentYet') }}</span>
          <span>{{ t('business.since', { date: formatDay(business.created_at) }) }}</span>
          <LiveStatus :paused="business.status !== 'active'" :label="t('admin.active')" :paused-label="t('admin.suspended')"></LiveStatus>
        </p>
      </template>
      <template v-if="business" #actions>
        <button type="button" class="btn btn-primary" @click="open">
          <PhEye :size="16"></PhEye>
          {{ t('business.open') }}
        </button>
        <template v-if="confirming">
          <button type="button" class="btn" :class="business.status === 'active' ? 'btn-danger' : 'btn-primary'" @click="toggleStatus">
            {{ business.status === 'active' ? t('admin.suspend') : t('admin.reactivate') }}
          </button>
          <button type="button" class="btn btn-secondary" @click="confirming = false">{{ t('admin.keepAsIs') }}</button>
        </template>
        <button v-else type="button" class="btn btn-secondary" @click="confirming = true">
          {{ business.status === 'active' ? t('admin.suspend') : t('admin.reactivate') }}
        </button>
      </template>
    </PageHeader>

    <LoadError v-if="error" :message="error" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!business"></SkeletonRows>

    <div v-else class="max-w-4xl px-5 pb-12 sm:px-8">
      <SettingsGroup :title="t('business.conversations')">
        <div class="grid grid-cols-3 gap-4">
          <div v-for="stat in stats" :key="stat.label">
            <p class="text-2xl font-semibold tabular-nums" :class="{ 'text-attention': stat.attention && stat.value }">{{ formatNumber(stat.value) }}</p>
            <p class="text-sm text-ink-soft">{{ stat.label }}</p>
          </div>
        </div>
        <p class="text-sm text-ink-soft">
          {{ business.last_activity_at ? t('business.lastActivity', { when: formatAgo(business.last_activity_at) }) : t('business.noActivity') }}
        </p>
      </SettingsGroup>

      <SettingsGroup :title="t('business.agent')">
        <template v-if="business.public_key">
          <p class="text-sm font-semibold">{{ business.agent_name }}</p>
          <CopyField :label="t('business.chatLink')" :value="chatLink(business.public_key)"></CopyField>
        </template>
        <p v-else class="text-sm text-ink-soft">{{ t('business.noAgent') }}</p>
      </SettingsGroup>

      <SettingsGroup :title="t('business.owners')">
        <ul class="flex flex-col gap-2 text-sm">
          <li v-for="owner in business.owners" :key="owner.email" class="flex flex-wrap justify-between gap-x-4">
            <span class="font-semibold">{{ owner.email }}</span>
            <span class="text-ink-soft">{{ t('business.since', { date: formatDay(owner.created_at) }) }}</span>
          </li>
        </ul>
        <p v-if="!business.owners.length" class="text-sm text-ink-soft">{{ t('admin.noOwner') }}</p>
      </SettingsGroup>

      <SettingsGroup :title="t('business.channels')">
        <ul class="flex flex-col gap-2 text-sm">
          <li class="flex flex-wrap justify-between gap-x-4">
            <span class="font-semibold">{{ t('business.webChat') }}</span>
            <span class="text-ink-soft">{{ business.public_key ? t('business.on') : t('business.off') }}</span>
          </li>
          <li v-for="channel in business.channels" :key="channel.kind" class="flex flex-wrap justify-between gap-x-4">
            <span>
              <span class="font-semibold">{{ t(`business.${channel.kind}`) }}</span>
              <span class="ml-1 text-ink-soft">{{ channel.kind === 'telegram' ? `@${channel.address}` : t('business.page', { id: channel.address }) }}</span>
            </span>
            <span class="text-ink-soft">{{ t('business.since', { date: formatDay(channel.created_at) }) }}</span>
          </li>
        </ul>
      </SettingsGroup>

      <SettingsGroup :title="t('business.payments')">
        <p class="text-sm">
          <span class="font-semibold">SSLCommerz</span>
          <span class="ml-1 text-ink-soft">{{ t(`business.payments_${business.payments ?? 'none'}`) }}</span>
        </p>
      </SettingsGroup>

      <SettingsGroup :title="t('business.knowledge')">
        <p class="text-sm">{{ t('business.documents', { n: formatNumber(business.documents) }, business.documents) }}</p>
        <template v-if="business.sheet">
          <p v-if="business.sheet.problem" class="flex items-start gap-2 text-sm text-danger" role="status">
            <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
            {{ t('business.sheetProblem', { problem: business.sheet.problem }) }}
          </p>
          <p v-else class="text-sm">
            {{ business.sheet.synced_at ? t('business.sheetSynced', { when: formatAgo(business.sheet.synced_at) }) : t('business.sheetNotYet') }}
          </p>
        </template>
        <p v-else class="text-sm text-ink-soft">{{ t('business.noSheet') }}</p>
      </SettingsGroup>

      <SettingsGroup :title="t('admin.tabs.activity')" :tip="t('business.activityTip')">
        <ul class="flex flex-col gap-2 text-sm">
          <li v-for="event in audit" :key="event.id" class="flex flex-wrap justify-between gap-x-4">
            <span class="min-w-0">
              <span class="font-semibold">{{ event.actor_email }}</span>
              <span class="ml-1 text-ink-soft">{{ event.action }}</span>
            </span>
            <span class="text-ink-soft">{{ formatDay(event.at) }}, {{ formatTime(event.at) }}</span>
          </li>
        </ul>
        <p v-if="!audit.length" class="text-sm text-ink-soft">{{ t('admin.nothingYet') }}</p>
      </SettingsGroup>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhEye, PhWarningCircle } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import CopyField from '../../components/ui/CopyField.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchBusiness, fetchAudit, setBusinessStatus } from '../../api/admin.js';
import { chatLink, presetLabel } from '../../lib/presets.js';
import { formatAgo, formatDay, formatNumber, formatTime } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const ACTIVITY = 20; // the latest few; the Activity tab has them all

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const business = ref(null);
const audit = ref([]);
const error = ref(null);
const confirming = ref(false);

const stats = computed(() => [
  { label: t('business.all'), value: business.value.conversations },
  { label: t('business.lastWeek'), value: business.value.conversations_7_days },
  { label: t('business.waiting'), value: business.value.waiting, attention: true },
]);

function deskLabel(kind) {
  return presetLabel({ id: kind, label: kind });
}

async function load() {
  error.value = null;
  try {
    const id = route.params.id;
    [business.value, audit.value] = await Promise.all([
      fetchBusiness(id),
      fetchAudit({ limit: ACTIVITY, workspaceId: id }),
    ]);
  } catch (err) {
    error.value = err.message;
  }
}

// See the business as its owner does (admin day A1).
function open() {
  auth.view(business.value);
  router.push('/home');
}

async function toggleStatus() {
  const next = business.value.status === 'active' ? 'suspended' : 'active';
  try {
    await setBusinessStatus(business.value.id, next);
    business.value.status = next;
    confirming.value = false;
    audit.value = await fetchAudit({ limit: ACTIVITY, workspaceId: business.value.id });
  } catch (err) {
    error.value = err.message;
  }
}

load();
</script>
