<template>
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <!-- The frame around the settings sections: the sections on a track
         under the title, who the agent is and whether it answers, what is
         still missing, and on the
         talk and bubble sections a preview of what a customer sees, drawn
         from the form as it is edited. Each section (a child route) has its
         own form and Save.
         This comment stays inside <section>: one placed before it makes a
         second root node, and the page <transition> in App.vue can never
         finish leaving such a page, so the next page stayed blank. -->
    <PageHeader :title="t('agent.title')" :tip="t('agent.subtitle')"></PageHeader>

    <!-- The sections, on a white track under the title, staying in reach while
         a long form scrolls. Full width from 1024px; on a phone it scrolls
         sideways and keeps the open one in view. -->
    <div v-if="!loadError" class="sticky top-[var(--sticky-top,0px)] z-20 bg-canvas pb-2">
      <nav
        ref="sectionNav"
        class="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border border-hairline bg-surface p-1 [scrollbar-width:none]"
        :aria-label="t('agent.sections')"
      >
        <router-link
          v-for="section in sections"
          :key="section.to"
          :to="section.to"
          class="group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-200"
          :class="isOpen(section) ? 'is-open bg-lime text-ink' : 'text-ink-soft hover:bg-wash hover:text-ink'"
        >
          <component :is="section.icon" :size="16" :weight="isOpen(section) ? 'fill' : 'regular'" class="shrink-0"></component>
          {{ section.label }}
          <span v-if="section.gaps" class="count count-attention" :aria-label="t('agent.toFillIn', { n: formatNumber(section.gaps) })">
            {{ formatNumber(section.gaps) }}
          </span>
        </router-link>
      </nav>
    </div>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>

    <div v-else-if="!agent.config" class="flex flex-col gap-2" aria-hidden="true">
      <div class="island flex items-center gap-3 px-4 py-3 sm:px-5">
        <div class="skeleton h-10 w-10 !rounded-[var(--radius-control)]"></div>
        <div class="flex-1">
          <div class="skeleton h-4 w-40"></div>
          <div class="skeleton mt-2 h-3 w-64 max-w-full"></div>
        </div>
      </div>
      <div class="island px-4 py-3 sm:px-6">
        <div v-for="n in 3" :key="n" class="grid gap-4 border-b border-hairline py-8 last:border-b-0 md:grid-cols-[11rem_1fr]">
          <div class="skeleton h-5 w-32"></div>
          <div>
            <div class="skeleton h-9 w-full"></div>
            <div class="skeleton mt-4 h-9 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-2">
      <!-- Who the agent is, whether it answers, and the two things done from
           here most: switch the AI off, copy the chat link. -->
      <div class="island px-4 py-3 sm:px-5">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="flex min-w-0 flex-1 basis-72 items-center gap-3">
            <img
              v-if="agent.config.widget?.logo"
              :src="agent.config.widget.logo"
              alt=""
              class="h-10 w-10 shrink-0 rounded-[var(--radius-control)] border border-hairline bg-surface object-cover"
            />
            <span
              v-else
              class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-ink text-sm font-bold text-lime"
              aria-hidden="true"
            >
              {{ initials(agent.config.name) }}
            </span>
            <div class="min-w-0">
              <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h2 class="truncate text-base leading-tight font-semibold tracking-[-0.015em]">{{ agent.config.name || t('nav.yourAgent') }}</h2>
                <LiveStatus :paused="!answering" :label="t('agent.status.answering')" :paused-label="pausedLabel"></LiveStatus>
              </div>
              <p class="mt-0.5 truncate text-[0.8125rem] text-ink-soft">
                {{ t('agent.forBusiness', { business: agent.config.business_name || t('common.businessName'), kind: serviceLabel(agent.kind) }) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 max-sm:w-full">
            <!-- The master switch for the whole agent: saved at once, so it is never lost in a form. -->
            <div
              class="flex h-8 items-center gap-2 rounded-full border pr-1 pl-3 transition-colors max-sm:h-11 max-sm:flex-1 max-sm:justify-between max-sm:pr-2.5"
              :class="aiOn ? 'border-line-strong' : 'border-attention/40 bg-attention-tint/60'"
            >
              <label class="text-[0.8125rem] font-semibold whitespace-nowrap" for="ai-on">{{ t('agent.aiOn.short') }}</label>
              <ToggleSwitch id="ai-on" :model-value="aiOn" :label="t('agent.aiOn.title')" :disabled="savingAi" @update:model-value="saveAiOn"></ToggleSwitch>
            </div>
            <button type="button" class="btn btn-secondary btn-sm !rounded-full max-sm:flex-1" @click="copyLink">
              <component :is="copied ? PhCheck : PhLink" :size="14" :weight="copied ? 'bold' : 'regular'"></component>
              {{ copied ? t('common.copied') : t('home.copyChatLink') }}
            </button>
          </div>
        </div>

        <p v-if="aiError" class="mt-3 text-sm text-danger" role="alert">{{ aiError }}</p>
        <!-- With the AI off, say plainly where the messages go now. -->
        <p v-else-if="!aiOn" class="mt-2.5 flex items-start gap-2 text-sm text-ink" role="status">
          <PhHandPalm :size="18" class="mt-px shrink-0 text-attention"></PhHandPalm>
          <span>
            {{ t('agent.aiOn.off') }}
            <router-link to="/conversations" class="link ml-1">{{ t('agent.openConversations') }}</router-link>
          </span>
        </p>

        <!-- What the backend says is still missing, each a link to its field;
             once nothing is, one green line says so. -->
        <div v-if="agent.missing.length" class="mt-3 rounded-[var(--radius-card)] bg-wash p-3" role="status">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <PhListChecks :size="18" class="shrink-0 text-attention"></PhListChecks>
            {{ t('agent.thingsLeft', { n: formatNumber(agent.missing.length) }, agent.missing.length) }}
          </p>
          <ul class="mt-2 flex flex-wrap gap-2">
            <li v-for="item in agent.missing" :key="item">
              <router-link
                :to="whereToFix(item)"
                class="group inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface py-1 pr-2.5 pl-3 text-[0.8125rem] font-medium transition-colors hover:border-ink"
              >
                {{ item }}
                <PhArrowRight :size="14" class="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"></PhArrowRight>
              </router-link>
            </li>
          </ul>
        </div>
        <p v-else class="mt-3 flex items-center gap-2 border-t border-hairline pt-2.5 text-[0.8125rem] text-ink-soft">
          <PhCheckCircle :size="16" weight="fill" class="shrink-0 text-success"></PhCheckCircle>
          {{ t('agent.ready') }}
        </p>
      </div>

      <div
        class="grid grid-cols-[minmax(0,1fr)] items-start gap-2"
        :class="{ 'xl:grid-cols-[minmax(0,1fr)_22rem]': showPreview }"
      >
        <div class="island min-w-0 self-stretch px-4 pt-4 sm:px-6">
          <!-- The open section's name and what it is for, so the form never starts cold. -->
          <div v-if="openSection" class="mb-1 flex items-start gap-3 border-b border-hairline pb-3">
            <div class="min-w-0">
              <h2 class="text-base leading-tight font-semibold tracking-[-0.015em]">{{ openSection.label }}</h2>
              <p class="mt-0.5 text-sm text-ink-soft">{{ openSection.text }}</p>
            </div>
          </div>

          <router-view v-slot="slotProps">
            <transition name="section" mode="out-in">
              <component :is="slotProps.Component" :key="route.path"></component>
            </transition>
          </router-view>
        </div>

        <!-- What a customer sees, following the form before it is saved. -->
        <aside v-if="showPreview" class="island sticky top-[calc(var(--sticky-top,0px)+3.5rem)] hidden p-4 xl:block">
          <div class="px-2 pt-1 pb-3">
            <h2 class="text-base font-semibold">{{ t('bubble.preview') }}</h2>
            <p class="text-sm text-ink-soft">{{ t('agent.previewText') }}</p>
          </div>
          <BubblePreview v-bind="preview"></BubblePreview>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive, provide, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhArrowRight,
  PhChatCircleDots,
  PhChatCircleText,
  PhChatsCircle,
  PhCheck,
  PhCheckCircle,
  PhHandPalm,
  PhLink,
  PhListChecks,
  PhPhoneCall,
  PhStorefront,
  PhTruck,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import BubblePreview from '../../components/agent/BubblePreview.vue';
import { SWATCHES } from '../../lib/colour.js';
import { whereToFix, markShared } from '../../lib/setup.js';
import { formatNumber } from '../../lib/format.js';
import { initials } from '../../lib/group.js';
import { chatLink, serviceLabel } from '../../lib/presets.js';
import { useAgentStore } from '../../stores/agent.js';
import { useAuthStore } from '../../stores/auth.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();
const auth = useAuthStore();

const loadError = ref(null);

// The AI on or off for every visitor on every channel (backend `ai_off`). Saved at once.
const aiOn = computed(() => !agent.config?.ai_off);
const savingAi = ref(false);
const aiError = ref(null);

async function saveAiOn(on) {
  savingAi.value = true;
  aiError.value = null;
  try {
    await agent.save({ ai_off: !on });
  } catch (error) {
    aiError.value = error.message;
  }
  savingAi.value = false;
}

// Answering unless the owner switched the AI off or HeyDesk paused the business.
const answering = computed(() => aiOn.value && !auth.isSuspended);
const pausedLabel = computed(() => (auth.isSuspended ? t('common.pausedByHeyDesk') : t('agent.status.aiOff')));

// Copying the chat link counts as sharing it, for the setup guide on Home.
const copied = ref(false);
let copiedTimer = null;

async function copyLink() {
  try {
    await navigator.clipboard.writeText(chatLink(agent.publicKey));
  } catch (error) {
    return; // Clipboard blocked: the link is on the Channels page to copy by hand.
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = false), 2000);
  if (auth.business) markShared(auth.business.id);
}
onBeforeUnmount(() => clearTimeout(copiedTimer));

// The name, greeting and bubble change what the chat looks like, so those sections show the preview.
const showPreview = computed(() => ['/agent/talk', '/agent/bubble'].includes(route.path));

// The open section's unsaved edits that the preview shows (useAgentSection's
// previewFrom); anything not being edited comes from the saved config.
const draft = reactive({});
provide('agentDraft', draft);

const preview = computed(() => {
  const config = agent.config;
  const widget = config.widget || {};
  const pick = (key, saved) => (key in draft ? draft[key] : saved);
  return {
    name: pick('name', config.name),
    greeting: (pick('greeting', config.greeting) || '').replaceAll('{business_name}', pick('business_name', config.business_name) || ''),
    colour: pick('colour', widget.colour || SWATCHES[0]),
    side: pick('side', widget.side || 'right'),
    nudge: pick('nudge', widget.nudge ?? ''),
    starters: pick('starters', widget.starters || []),
    logo: widget.logo || '',
  };
});

const sections = computed(() =>
  [
    { to: '/agent/business', icon: PhStorefront, label: t('agent.business'), text: t('agent.sectionText.business') },
    { to: '/agent/talk', icon: PhChatCircleText, label: t('agent.talk'), text: t('agent.sectionText.talk') },
    { to: '/agent/answers', icon: PhChatsCircle, label: t('agent.answers'), text: t('agent.sectionText.answers') },
    { to: '/agent/payments', icon: PhTruck, label: t('agent.deliveryAndPayments'), text: t('agent.sectionText.payments') },
    { to: '/agent/bubble', icon: PhChatCircleDots, label: t('agent.bubble'), text: t('agent.sectionText.bubble') },
    // The shop can phone its buyers to confirm their orders (backend D89).
    { to: '/agent/calls', icon: PhPhoneCall, label: t('agent.calls'), text: t('agent.sectionText.calls') },
  ].map((section) => ({ ...section, gaps: gapsIn(section.to) })),
);

const openSection = computed(() => sections.value.find(isOpen));

function isOpen(section) {
  return route.path === section.to;
}

// On a phone the track scrolls sideways: bring the open section to its middle.
// Set by hand rather than scrollIntoView, which would also scroll the page.
const sectionNav = ref(null);
watch(
  () => route.path,
  async () => {
    await nextTick();
    const nav = sectionNav.value;
    const open = nav?.querySelector('.is-open');
    if (!open) return;
    nav.scrollLeft = open.offsetLeft - nav.offsetLeft - (nav.clientWidth - open.offsetWidth) / 2;
  },
  { immediate: true },
);

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

<style scoped>
/* A section settles in as it opens: a short fade and a 4px rise. */
.section-enter-active,
.section-leave-active {
  transition: opacity 0.18s var(--ease-settle), transform 0.18s var(--ease-settle);
}

.section-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.section-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .section-enter-active,
  .section-leave-active {
    transition: none;
  }
}
</style>
