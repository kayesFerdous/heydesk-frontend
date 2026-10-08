<template>
  <teleport to="body">
    <transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-40 flex justify-end">
        <div class="absolute inset-0 bg-ink/30" @click="close"></div>

        <section
          class="relative flex h-full w-full max-w-md flex-col bg-wash shadow-[var(--shadow-float)]"
          role="dialog"
          aria-modal="true"
          aria-label="Try your agent"
        >
          <header class="flex items-center justify-between border-b border-hairline bg-surface px-5 py-4">
            <div>
              <h2 class="text-base font-semibold">Try your agent</h2>
              <p class="text-sm text-ink-soft">Exactly what a customer sees.</p>
            </div>
            <button
              type="button"
              class="btn btn-quiet btn-icon"
              aria-label="Close"
              @click="close"
            >
              <ph-x :size="20"></ph-x>
            </button>
          </header>

          <div class="min-h-0 flex-1">
            <agent-chat v-if="publicKey" :public-key="publicKey"></agent-chat>
            <div v-else class="p-6">
              <p class="text-ink-soft">Create your agent first, then you can talk to it here.</p>
              <router-link to="/setup" class="btn btn-primary mt-4" @click="close">
                Set up your agent
              </router-link>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { PhX } from '@phosphor-icons/vue';

import AgentChat from './AgentChat.vue';

export default {
  components: { AgentChat, PhX },
  computed: {
    open() {
      return this.$store.getters['ui/testSheetOpen'];
    },
    publicKey() {
      return this.$store.getters['agent/publicKey'];
    },
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        // The key is needed to talk to the agent; fetch it if no page has yet.
        this.$store.dispatch('agent/load').catch(() => {});
        document.addEventListener('keydown', this.onKey);
      } else {
        document.removeEventListener('keydown', this.onKey);
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKey);
  },
  methods: {
    close() {
      this.$store.commit('ui/setTestSheet', false);
    },
    onKey(event) {
      if (event.key === 'Escape') this.close();
    },
  },
};
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s var(--ease-settle);
}

.sheet-enter-active section,
.sheet-leave-active section {
  transition: transform 0.25s var(--ease-settle);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from section,
.sheet-leave-to section {
  transform: translateX(2rem);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active section,
  .sheet-leave-active section {
    transition: none;
  }
}
</style>
