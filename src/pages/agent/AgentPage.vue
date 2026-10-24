<template>
  <section>
    <!-- The frame around the settings sections: title, section tabs, and what
         is still missing. Each section (a child route) has its own form and
         Save. Trying the agent is the sidebar's job (and the save bar offers
         it after a save), so this page is all form.
         This comment stays inside <section>: one placed before it makes a
         second root node, and the page <transition> in App.vue can never
         finish leaving such a page, so the next page stayed blank. -->
    <PageHeader :title="t('agent.title')">
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
      <div v-for="n in 3" :key="n" class="grid max-w-4xl gap-4 border-b border-hairline py-8 md:grid-cols-[12rem_1fr]">
        <div class="skeleton h-5 w-32"></div>
        <div>
          <div class="skeleton h-10 w-full"></div>
          <div class="skeleton mt-4 h-10 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else class="px-5 pt-6 sm:px-8">
      <div class="max-w-4xl">
        <!-- What the backend says is still missing, each a link to its field. -->
        <div v-if="agent.missing.length" class="notice mb-4" role="status">
          <PhListChecks :size="20" class="mt-px shrink-0 text-attention"></PhListChecks>
          <div class="min-w-0">
            <p class="font-semibold text-ink">
              {{ t('agent.thingsLeft', { n: formatNumber(agent.missing.length) }, agent.missing.length) }}
            </p>
            <ul class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <li v-for="item in agent.missing" :key="item">
                <router-link :to="whereToFix(item)" class="link font-medium">{{ item }}</router-link>
              </li>
            </ul>
          </div>
        </div>

        <router-view v-slot="slotProps">
          <component :is="slotProps.Component"></component>
        </router-view>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhListChecks } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { whereToFix } from '../../lib/setup.js';
import { formatNumber } from '../../lib/format.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();

const loadError = ref(null);

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
  list.push({ to: '/agent/bubble', label: t('agent.bubble') });
  // A shop can phone its buyers to confirm their orders (backend D89).
  if (agent.kind === 'shop') list.push({ to: '/agent/calls', label: t('agent.calls') });
  return list;
});

// How many of the backend's gaps are filled in on this section.
function gapsIn(path) {
  return agent.missing.filter((item) => whereToFix(item) === path).length;
}

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
