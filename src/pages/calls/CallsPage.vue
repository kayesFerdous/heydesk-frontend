<template>
  <section class="flex flex-col lg:h-full">
    <PageHeader :title="t('calls.title')" :subtitle="t('calls.subtitle')">
      <template #tabs>
        <div class="tabs" role="tablist">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="tab === view"
            class="tab"
            :class="{ 'tab-active': tab === view }"
            @click="show(tab)"
          >
            {{ t(`calls.${tab}`) }}
            <span v-if="tab === 'waiting' && waitingCount" class="count">{{ formatNumber(waitingCount) }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- Calls are off: queued calls wait, and no new ones are added. -->
    <router-link
      v-if="settings && !settings.enabled"
      to="/agent/calls"
      class="notice mx-5 mt-4 items-center transition-colors hover:bg-wash sm:mx-8"
    >
      <PhPhoneSlash :size="20" weight="bold" class="shrink-0 text-attention"></PhPhoneSlash>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold text-ink">{{ t('calls.offTitle') }}</span>
        <span class="mt-0.5 block text-ink-soft">{{ t('calls.offText') }}</span>
      </span>
      <span class="flex items-center gap-1 font-semibold whitespace-nowrap text-brand">
        {{ t('calls.turnOn') }}
        <PhArrowRight :size="14" weight="bold"></PhArrowRight>
      </span>
    </router-link>

    <LoadError v-if="error" :message="error" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!loaded" class="mt-4 border-t border-hairline"></SkeletonRows>
    <EmptyState
      v-else-if="!calls.length"
      :icon="PhPhoneCall"
      :title="t(view === 'waiting' ? 'calls.emptyWaiting' : 'calls.emptyDone')"
      :text="t(view === 'waiting' ? 'calls.emptyWaitingText' : 'calls.emptyDoneText')"
    ></EmptyState>

    <div v-else class="mt-4 border-t border-hairline lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <p v-if="actionError" class="px-5 pt-3 text-sm text-danger sm:px-8" role="alert">{{ actionError }}</p>
      <template v-if="view === 'waiting'">
        <CallRow
          v-for="call in calls"
          :key="call.id"
          :call="call"
          :tries="settings?.tries ?? 1"
          :busy="busy"
          @now="act(() => callNow(call.id))"
          @stop="act(() => stopCall(call.id))"
        ></CallRow>
      </template>
      <div v-for="group in groups" v-else :key="group.label">
        <h2 class="day-head">{{ group.label }}</h2>
        <CallRow
          v-for="call in group.items"
          :key="call.id"
          :call="call"
          :busy="busy"
          @again="act(() => callOrder(call.order_id), 'waiting')"
        ></CallRow>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowRight, PhPhoneCall, PhPhoneSlash } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import CallRow from '../../components/calls/CallRow.vue';
import { fetchCalls, callOrder, callNow, stopCall } from '../../api/calls.js';
import { formatNumber } from '../../lib/format.js';
import { groupByDay } from '../../lib/group.js';
import { useAgentStore } from '../../stores/agent.js';

const TABS = ['waiting', 'done'];
const REFRESH_MS = 5000; // a call moves on by itself: ringing, talking, done

const { t } = useI18n();
const agent = useAgentStore();

const view = ref('waiting');
const calls = ref([]);
const waitingCount = ref(0);
const loaded = ref(false);
const error = ref(null);
const busy = ref(false);
const actionError = ref(null);

const settings = computed(() => agent.config?.knowledge.calls ?? null);
const groups = computed(() => groupByDay(calls.value, 'updated_at', agent.config?.timezone));

async function load() {
  error.value = null;
  try {
    const shown = view.value;
    const found = await fetchCalls({ view: shown });
    if (shown !== view.value) return; // the owner switched tabs meanwhile
    calls.value = found;
    if (shown === 'waiting') waitingCount.value = found.length;
    loaded.value = true;
  } catch (err) {
    error.value = err.message;
  }
}

function show(tab) {
  view.value = tab;
  loaded.value = false;
  actionError.value = null;
  load();
}

// A button on a row: do it, then show the list as it is now.
async function act(call, thenView) {
  busy.value = true;
  actionError.value = null;
  try {
    await call();
    if (thenView && thenView !== view.value) show(thenView);
    else await load();
  } catch (err) {
    actionError.value = err.message;
  }
  busy.value = false;
}

agent.load().catch(() => {}); // for the settings; the list shows its own errors
load();
const timer = setInterval(load, REFRESH_MS);
onBeforeUnmount(() => clearInterval(timer));
</script>
