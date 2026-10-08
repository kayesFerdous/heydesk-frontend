<template>
  <router-view v-if="isBare"></router-view>

  <!-- The shell: a quiet paper sidebar and the white work area, edge to edge.
       No floating card, no outer margin, no top banner. -->
  <div v-else class="flex h-dvh bg-sidebar">
    <app-sidebar class="hidden w-60 shrink-0 md:flex"></app-sidebar>

    <main class="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface pb-24 md:border-l md:border-hairline md:pb-0">
      <p
        v-if="suspended"
        class="flex items-center gap-2 border-b border-attention/20 bg-attention-tint px-5 py-3 text-sm font-medium text-attention sm:px-8"
        role="status"
      >
        <ph-pause-circle :size="20" weight="bold" class="shrink-0"></ph-pause-circle>
        Your agent is paused by HeyDesk, so customers see that it is unavailable.
        Contact HeyDesk to turn it back on.
      </p>
      <router-view v-slot="slotProps">
        <transition name="route" mode="out-in">
          <component :is="slotProps.Component"></component>
        </transition>
      </router-view>
    </main>

    <app-tab-bar class="md:hidden"></app-tab-bar>

    <!-- On phones the sidebar slides in as a drawer from More. -->
    <transition name="drawer">
      <div v-if="navOpen" class="fixed inset-0 z-40 md:hidden">
        <div class="absolute inset-0 bg-ink/30" @click="closeNav"></div>
        <app-sidebar class="drawer-panel relative flex h-full w-72 max-w-[85vw] shadow-[var(--shadow-float)]" @navigate="closeNav"></app-sidebar>
      </div>
    </transition>

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
    navOpen() {
      return this.$store.getters['ui/navOpen'];
    },
  },
  watch: {
    // Going somewhere closes the phone drawer; Escape does too.
    $route() {
      this.closeNav();
    },
    navOpen(open) {
      if (open) document.addEventListener('keydown', this.onKey);
      else document.removeEventListener('keydown', this.onKey);
    },
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKey);
  },
  methods: {
    closeNav() {
      this.$store.commit('ui/setNav', false);
    },
    onKey(event) {
      if (event.key === 'Escape') this.closeNav();
    },
  },
};
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
