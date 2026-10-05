<template>
  <router-view v-if="isBare"></router-view>

  <!-- The shell: a navy rail (the control layer) and the work area, which runs
       edge to edge. No floating card, no outer margin. -->
  <div v-else class="flex h-dvh">
    <app-sidebar class="hidden w-62 shrink-0 md:flex"></app-sidebar>

    <main class="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface pb-24 md:pb-0">
      <p
        v-if="suspended"
        class="flex items-center gap-2 bg-attention-tint px-5 py-3 text-sm font-medium text-attention sm:px-8"
        role="status"
      >
        <ph-pause-circle :size="20" weight="bold"></ph-pause-circle>
        Your agent is paused by HeyDesk. Customers see that it is unavailable.
        Contact HeyDesk to turn it back on.
      </p>
      <router-view v-slot="slotProps">
        <transition name="route" mode="out-in">
          <component :is="slotProps.Component"></component>
        </transition>
      </router-view>
    </main>

    <app-tab-bar class="md:hidden"></app-tab-bar>
    <test-chat-sheet></test-chat-sheet>
  </div>
</template>

<script>
import AppSidebar from './components/layout/AppSidebar.vue';
import AppTabBar from './components/layout/AppTabBar.vue';
import TestChatSheet from './components/chat/TestChatSheet.vue';
import { PhPauseCircle } from '@phosphor-icons/vue';

export default {
  components: {
    AppSidebar,
    AppTabBar,
    TestChatSheet,
    PhPauseCircle,
  },
  computed: {
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
    isBare() {
      return !!this.$route.meta.bare;
    },
  },
};
</script>

<style>
/* One authored moment: pages settle 4px upward on entry. Motion shows a state
   changing and nothing else, so it is off under reduced motion. */
.route-enter-active,
.route-leave-active {
  transition: opacity 0.2s var(--ease-settle), transform 0.2s var(--ease-settle);
}

.route-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.route-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .route-enter-active,
  .route-leave-active {
    transition: none;
  }
}
</style>
