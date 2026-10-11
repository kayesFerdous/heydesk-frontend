<template>
  <teleport to="body">
    <transition name="sheet">
      <div v-if="ui.testSheetOpen" class="fixed inset-0 z-40 flex justify-end">
        <div class="absolute inset-0 bg-ink/30" @click="close"></div>

        <section
          class="relative flex h-full w-full max-w-md flex-col bg-wash shadow-[var(--shadow-float)]"
          role="dialog"
          aria-modal="true"
          :aria-label="t('common.tryYourAgent')"
        >
          <header class="flex items-center justify-between border-b border-hairline bg-surface px-5 py-4">
            <div>
              <h2 class="text-base font-semibold">{{ t('common.tryYourAgent') }}</h2>
              <p class="text-sm text-ink-soft">{{ t('chat.whatCustomerSees') }}</p>
            </div>
            <button
              type="button"
              class="btn btn-quiet btn-icon"
              :aria-label="t('common.close')"
              @click="close"
            >
              <PhX :size="20"></PhX>
            </button>
          </header>

          <div class="min-h-0 flex-1">
            <AgentChat v-if="agent.publicKey" :public-key="agent.publicKey"></AgentChat>
            <div v-else class="p-6">
              <p class="text-ink-soft">{{ t('chat.createFirst') }}</p>
              <router-link to="/setup" class="btn btn-primary mt-4" @click="close">
                {{ t('common.setUpYourAgent') }}
              </router-link>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhX } from '@phosphor-icons/vue';

import AgentChat from './AgentChat.vue';
import { useAgentStore } from '../../stores/agent.js';
import { useUiStore } from '../../stores/ui.js';

const { t } = useI18n();
const agent = useAgentStore();
const ui = useUiStore();

function close() {
  ui.testSheetOpen = false;
}

function onKey(event) {
  if (event.key === 'Escape') close();
}

watch(
  () => ui.testSheetOpen,
  (open) => {
    if (open) {
      // The key is needed to talk to the agent; fetch it if no page has yet.
      agent.load().catch(() => {});
      document.addEventListener('keydown', onKey);
    } else {
      document.removeEventListener('keydown', onKey);
    }
  },
);
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
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
