<template>
  <section class="px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <!-- The frame around the settings sections: title, section tabs, what is
         still missing, and beside the form a preview of what a customer sees,
         drawn from the form as it is edited. Each section (a child route) has
         its own form and Save.
         This comment stays inside <section>: one placed before it makes a
         second root node, and the page <transition> in App.vue can never
         finish leaving such a page, so the next page stayed blank. -->
    <PageHeader :title="t('agent.title')" :subtitle="t('agent.subtitle')">
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

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>

    <div v-else-if="!agent.config" class="island px-5 py-4 sm:px-8" aria-hidden="true">
      <div v-for="n in 3" :key="n" class="grid gap-4 border-b border-hairline py-8 last:border-b-0 md:grid-cols-[12rem_1fr]">
        <div class="skeleton h-5 w-32"></div>
        <div>
          <div class="skeleton h-11 w-full"></div>
          <div class="skeleton mt-4 h-11 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-[minmax(0,1fr)] items-start gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="island min-w-0 px-5 pt-6 sm:px-8">
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

      <!-- What a customer sees, following the form before it is saved. -->
      <aside class="island sticky top-3 hidden p-4 xl:block">
        <div class="px-2 pt-1 pb-3">
          <h2 class="text-lg font-bold">{{ t('bubble.preview') }}</h2>
          <p class="text-sm text-ink-soft">{{ t('agent.previewText') }}</p>
        </div>
        <BubblePreview v-bind="preview"></BubblePreview>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive, provide } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhListChecks } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import BubblePreview from '../../components/agent/BubblePreview.vue';
import { SWATCHES } from '../../lib/colour.js';
import { whereToFix } from '../../lib/setup.js';
import { formatNumber } from '../../lib/format.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();

const loadError = ref(null);

// The open section's unsaved edits that the preview shows (useAgentSection's
// previewFrom); anything not being edited comes from the saved config.
const draft = reactive({});
provide('agentDraft', draft);

const preview = computed(() => {
  const config = agent.config;
  const widget = config.widget || {};
  const pick = (key, saved) => (key in draft ? draft[key] : saved);
  const businessName = pick('business_name', config.business_name) || '';
  return {
    name: pick('name', config.name),
    greeting: (pick('greeting', config.greeting) || '').replaceAll('{business_name}', businessName),
    colour: pick('colour', widget.colour || SWATCHES[0]),
    side: pick('side', widget.side || 'right'),
    nudge: pick('nudge', widget.nudge ?? ''),
    starters: pick('starters', widget.starters || []),
    logo: widget.logo || '',
  };
});

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
