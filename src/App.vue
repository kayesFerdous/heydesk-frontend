<template>
  <router-view v-if="isBare"></router-view>

  <!-- The shell: a black panel for where you can go, and the work on a warm
       grey canvas, each page laying out its own white islands. The sidebar
       folds to icons on desktop. -->
  <div v-else class="flex h-dvh bg-canvas md:gap-3 md:p-3">
    <AppSidebar
      class="hidden shrink-0 rounded-[var(--radius-panel)] transition-[width] duration-200 ease-[var(--ease-settle)] motion-reduce:transition-none md:flex"
      :class="ui.sidebarCollapsed ? 'w-[4.75rem]' : 'w-72'"
      collapsible
    ></AppSidebar>

    <main class="min-h-0 min-w-0 flex-1 overflow-y-auto pb-28 md:pb-0">
      <!-- An admin inside a business: whose it is, and the way out. -->
      <div
        v-if="auth.isViewing"
        class="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 bg-ink px-5 py-2.5 text-sm text-surface sm:px-8"
        role="status"
      >
        <PhEye :size="18" weight="bold" class="shrink-0"></PhEye>
        <span class="min-w-0 flex-1">
          {{ t('shell.viewing', { name: auth.viewing.name }) }}
          <span v-if="auth.isSuspended" class="font-semibold">{{ t('shell.viewingSuspended') }}</span>
        </span>
        <router-link to="/admin" class="btn btn-lime btn-sm">{{ t('shell.exitViewing') }}</router-link>
      </div>
      <p
        v-else-if="auth.isSuspended"
        class="flex items-center gap-2 bg-attention-tint px-5 py-3 text-sm font-medium text-ink sm:px-8"
        role="status"
      >
        <PhPauseCircle :size="20" weight="bold" class="shrink-0 text-attention"></PhPauseCircle>
        {{ t('shell.paused') }}
      </p>
      <router-view v-slot="slotProps">
        <transition name="route" mode="out-in">
          <component :is="slotProps.Component"></component>
        </transition>
      </router-view>
    </main>

    <AppTabBar class="md:hidden"></AppTabBar>

    <!-- On phones the sidebar slides in as a drawer from More. -->
    <transition name="drawer">
      <div v-if="ui.navOpen" class="fixed inset-0 z-40 md:hidden">
        <div class="absolute inset-0 bg-ink/30" @click="ui.navOpen = false"></div>
        <AppSidebar class="drawer-panel relative flex h-full w-72 max-w-[85vw] rounded-r-[var(--radius-panel)] shadow-[var(--shadow-float)]" @navigate="ui.navOpen = false"></AppSidebar>
      </div>
    </transition>

    <TestChatSheet></TestChatSheet>
  </div>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhEye, PhPauseCircle } from '@phosphor-icons/vue';

import AppSidebar from './components/layout/AppSidebar.vue';
import AppTabBar from './components/layout/AppTabBar.vue';
import TestChatSheet from './components/chat/TestChatSheet.vue';
import { formatNumber } from './lib/format.js';
import { chime } from './lib/chime.js';
import { useAuthStore } from './stores/auth.js';
import { useAgentStore } from './stores/agent.js';
import { useInboxStore } from './stores/inbox.js';
import { useUiStore } from './stores/ui.js';

const route = useRoute();
const auth = useAuthStore();
const agent = useAgentStore();
const inbox = useInboxStore();
const ui = useUiStore();
const { t } = useI18n();

const isBare = computed(() => !!route.meta.bare);

// Going somewhere closes the phone drawer; Escape does too.
function onKey(event) {
  if (event.key === 'Escape') ui.navOpen = false;
}

watch(
  () => route.fullPath,
  () => (ui.navOpen = false),
);
watch(
  () => ui.navOpen,
  (open) => {
    if (open) document.addEventListener('keydown', onKey);
    else document.removeEventListener('keydown', onKey);
  },
);
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));

// New work shows without a reload: while a business's console is on screen the
// sidebar counts are asked again every 25 seconds, skipped while the tab is
// hidden and asked at once when it comes back. Counts only (docs/performance.md).
const POLL_MS = 25000;
const watching = computed(() => !isBare.value && auth.seesBusiness && agent.hasAgent);

function poll() {
  if (watching.value && document.visibilityState === 'visible') inbox.load().catch(() => {});
}
const pollTimer = setInterval(poll, POLL_MS);
document.addEventListener('visibilitychange', poll);
onBeforeUnmount(() => {
  clearInterval(pollTimer);
  document.removeEventListener('visibilitychange', poll);
});

// More waiting than before: a chime. The tab says how many wait, "(2) HeyDesk".
watch(() => inbox.arrivals, chime);
const tabTitle = computed(() => {
  const waiting = watching.value ? inbox.waitingTotal + inbox.needsHuman : 0;
  return waiting ? `(${formatNumber(waiting)}) HeyDesk` : 'HeyDesk';
});
watch(tabTitle, (title) => (document.title = title));
</script>

<style>
/* One authored moment: pages settle 4px upward on entry. Motion shows a state
   changing and nothing else, so it is off under reduced motion. */
.route-enter-active,
.route-leave-active {
  transition: opacity 0.18s var(--ease-settle), transform 0.18s var(--ease-settle);
}

.route-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.route-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s var(--ease-settle);
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.22s var(--ease-settle);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(-1.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .route-enter-active,
  .route-leave-active,
  .drawer-enter-active,
  .drawer-leave-active,
  .drawer-enter-active .drawer-panel,
  .drawer-leave-active .drawer-panel {
    transition: none;
  }
}
</style>
