<template>
  <section class="flex flex-col lg:h-full">
    <!-- The frame around the three settings sections: title, section tabs, and on
         wide screens the test chat beside the form, so a change can be tried at
         once. Each section (a child route) has its own form and Save.
         This comment stays inside <section>: one placed before it makes a
         second root node, and the page <transition> in App.vue can never
         finish leaving such a page, so the next page stayed blank. -->
    <PageHeader :title="t('agent.title')" :subtitle="t('agent.subtitle')">
      <template #actions>
        <LiveStatus :paused="auth.isSuspended"></LiveStatus>
        <button type="button" class="btn btn-secondary lg:hidden" @click="ui.testSheetOpen = true">
          <PhChatCircleDots :size="18" class="text-brand"></PhChatCircleDots>
          {{ t('common.tryYourAgent') }}
        </button>
      </template>
      <template #tabs>
        <nav class="tabs" :aria-label="t('agent.sections')">
          <router-link
            v-for="section in sections"
            :key="section.to"
            :to="section.to"
            class="tab"
            active-class="tab-active"
          >
            {{ section.label }}
            <span v-if="gapsIn(section.to)" class="count count-attention" :aria-label="t('agent.toFillIn', { n: formatNumber(gapsIn(section.to)) })">
              {{ formatNumber(gapsIn(section.to)) }}
            </span>
          </router-link>
        </nav>
      </template>
    </PageHeader>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <div v-else-if="!agent.config" class="px-5 py-8 sm:px-8" aria-hidden="true">
      <div class="skeleton h-5 w-40"></div>
      <div class="skeleton mt-5 h-10 w-full max-w-xl"></div>
      <div class="skeleton mt-4 h-10 w-full max-w-xl"></div>
      <div class="skeleton mt-4 h-24 w-full max-w-xl"></div>
    </div>

    <div v-else class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="px-5 pt-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto">
        <div class="max-w-2xl">
          <div
            v-if="agent.missing.length"
            class="notice mb-8"
            role="status"
          >
            <PhListChecks :size="20" class="mt-px shrink-0 text-attention"></PhListChecks>
            <div>
              <p class="font-semibold text-ink">
                {{ t('agent.thingsLeft', { n: formatNumber(agent.missing.length) }, agent.missing.length) }}
              </p>
              <ul class="mt-1 flex flex-col gap-0.5">
                <li v-for="item in agent.missing" :key="item">
                  <router-link :to="whereToFix(item)" class="text-ink hover:underline">{{ item }}</router-link>
                </li>
              </ul>
            </div>
          </div>

          <router-view v-slot="slotProps">
            <component :is="slotProps.Component"></component>
          </router-view>
        </div>
      </div>

      <aside class="hidden border-l border-hairline bg-wash lg:flex lg:min-h-0 lg:flex-col">
        <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <div>
            <h2 class="text-sm font-semibold">{{ t('common.tryYourAgent') }}</h2>
            <p class="text-xs text-ink-soft">{{ t('chat.whatCustomerSees') }}</p>
          </div>
        </div>
        <div class="min-h-0 flex-1">
          <AgentChat v-if="agent.publicKey" :key="chatKey" :public-key="agent.publicKey"></AgentChat>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhChatCircleDots, PhListChecks } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import LoadError from '../../components/ui/LoadError.vue';
import AgentChat from '../../components/chat/AgentChat.vue';
import { whereToFix } from '../../lib/setup.js';
import { formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';
import { useUiStore } from '../../stores/ui.js';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();
const ui = useUiStore();

const loadError = ref(null);
const chatKey = ref(0);

const sections = computed(() => {
  const list = [
    { to: '/agent/profile', label: t('agent.profile') },
    { to: '/agent/hours', label: t('agent.hours') },
    { to: '/agent/answers', label: t('agent.answers') },
  ];
  // A receptionist takes no orders or appointments, so nothing to pay for.
  if (agent.kind === 'clinic') list.push({ to: '/agent/payments', label: t('agent.payments') });
  if (['restaurant', 'shop'].includes(agent.kind)) {
    list.push({ to: '/agent/payments', label: t('agent.deliveryAndPayments') });
  }
  return list;
});

// How many of the backend's gaps are filled in on this section.
function gapsIn(path) {
  return agent.missing.filter((item) => whereToFix(item) === path).length;
}

// A save changes the config: start a fresh test chat so it uses the new settings.
watch(
  () => agent.config,
  (next, previous) => {
    if (previous) chatKey.value += 1;
  },
);

async function load() {
  loadError.value = null;
  try {
    await Promise.all([agent.load(), agent.loadPresets()]);
  } catch (error) {
    loadError.value = error.message;
    return;
  }
  if (agent.noAgent) router.replace('/setup');
}

load();
</script>
