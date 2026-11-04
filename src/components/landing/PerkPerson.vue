<template>
  <!-- When it should be you, it says so: the customer asks for a person, the
       orange strip drops in, and the owner takes the chat. -->
  <div ref="root" class="island flex h-full min-h-[18rem] flex-col overflow-hidden" aria-hidden="true">
    <p class="relative z-[1] flex items-center gap-3 border-b border-hairline bg-surface px-4 py-3 font-semibold">
      <span class="grid h-8 w-8 place-items-center rounded-full bg-tint-sand text-xs">TI</span>
      {{ t('landing.night.people.tanvir') }}
    </p>
    <Transition name="strip">
      <div v-if="step >= 3" class="strip" :class="{ 'is-taken': step >= 4 }">
        <component :is="step >= 4 ? PhCheckCircle : PhUserSound" :size="20" :weight="step >= 4 ? 'fill' : 'regular'" class="ring shrink-0" :class="{ 'is-ringing': step === 3 }"></component>
        <span class="min-w-0 flex-1 text-sm font-semibold">
          {{ step >= 4 ? t('conversations.assign.withYou') : t('status.needs_human') }}
        </span>
        <span v-if="step === 3" class="btn btn-primary btn-sm press">{{ t('conversations.assign.take') }}</span>
      </div>
    </Transition>
    <div class="flex flex-1 flex-col justify-end gap-2.5 p-4">
      <p v-if="step >= 1" class="said mine">{{ t('landing.try.asks.person.q') }}</p>
      <p v-if="step >= 2" class="said theirs">{{ t('landing.try.asks.person.a') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle, PhUserSound } from '@phosphor-icons/vue';

import { useSceneClock } from '../../composables/useSceneClock.js';

const { t } = useI18n();

const root = ref(null);
// Asked, answered, the strip, taken.
const { step } = useSceneClock({ root, times: [300, 900, 700, 2000], loop: true, rest: 2800 });
</script>

<style scoped>
.said {
  max-width: 88%;
  width: fit-content;
  border-radius: 1.125rem;
  padding: 0.5rem 0.875rem;
  line-height: 1.4;
  animation: said 0.45s var(--ease-settle);
}

.mine {
  background-color: var(--color-hover);
}

.theirs {
  align-self: flex-end;
  background-color: var(--color-brand-tint);
}

.strip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background-color: var(--color-attention-tint);
  padding: 0.625rem 1rem;
  transition: background-color 0.3s;
}

.strip.is-taken {
  background-color: var(--color-success-tint);
  color: var(--color-success);
}

.ring {
  color: var(--color-attention);
}

.is-taken .ring {
  color: var(--color-success);
}

.is-ringing {
  animation: ring 0.5s ease-in-out 3;
}

/* The owner's press, just before the strip turns green. */
.press {
  animation: press 0.3s var(--ease-settle) 1.7s;
}

.strip-enter-active {
  animation: strip 0.5s var(--ease-settle);
}

@keyframes strip {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
}

@keyframes ring {
  25% {
    transform: rotate(-14deg);
  }
  75% {
    transform: rotate(14deg);
  }
}

@keyframes press {
  50% {
    transform: scale(0.92);
  }
}

@keyframes said {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .said,
  .is-ringing,
  .press,
  .strip-enter-active {
    animation: none;
  }
}
</style>
