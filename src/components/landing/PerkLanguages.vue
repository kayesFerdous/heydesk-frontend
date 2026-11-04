<template>
  <!-- Every customer gets an answer: the clock moves through the night and each
       question comes back in the language it was asked. -->
  <div ref="root" class="flex h-full flex-col" aria-hidden="true">
    <div class="flex items-center justify-between gap-3">
      <div class="flex gap-1.5">
        <span v-for="(ask, index) in ASKS" :key="ask.lang" class="lang" :class="{ 'is-on': index === now }">{{ t(`landing.perks.langs.${ask.lang}`) }}</span>
      </div>
      <Transition name="clock" mode="out-in">
        <p :key="now" class="text-2xl font-semibold tracking-[-0.03em] whitespace-nowrap text-white tabular-nums">{{ clock }}</p>
      </Transition>
    </div>
    <TransitionGroup tag="div" name="line" class="relative mt-5 flex min-h-[16rem] flex-1 flex-col justify-end gap-2.5 overflow-hidden">
      <template v-for="line in lines" :key="line.key">
        <p class="said" :class="line.mine ? 'mine' : 'theirs'">{{ line.text }}</p>
      </template>
      <p v-if="step === 2" key="typing" class="typing"><i></i><i></i><i></i></p>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useSceneClock } from '../../composables/useSceneClock.js';
import { formatTime } from '../../lib/format.js';

const ASKS = [
  { lang: 'banglish', id: 'size', at: '2026-01-01T23:47:00Z' },
  { lang: 'bangla', id: 'colour', at: '2026-01-01T02:14:00Z' },
  { lang: 'english', id: 'exchange', at: '2026-01-01T06:12:00Z' },
];

const { t } = useI18n();

const root = ref(null);
// Question, typing, answer.
const { step, round } = useSceneClock({ root, times: [350, 700, 1300], loop: true, rest: 1900 });

const now = computed(() => round.value % ASKS.length);
const clock = computed(() => formatTime(ASKS[now.value].at, 'UTC'));

// The last two exchanges, oldest first.
const lines = computed(() => {
  const said = [];
  for (let back = 1; back >= 0; back -= 1) {
    const turn = round.value - back;
    if (turn < 0) continue;
    const { id } = ASKS[turn % ASKS.length];
    if (back || step.value >= 1) said.push({ key: `${turn}q`, mine: true, text: t(`landing.try.asks.${id}.q`) });
    if (back || step.value >= 3) said.push({ key: `${turn}a`, text: t(`landing.try.asks.${id}.a`) });
  }
  return said;
});
</script>

<style scoped>
.lang {
  border-radius: var(--radius-control);
  padding: 0.25rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-night-soft);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.lang.is-on {
  background-color: var(--color-lime);
  color: var(--color-ink);
}

.said {
  max-width: 85%;
  width: fit-content;
  border-radius: 1.125rem;
  padding: 0.5rem 0.875rem;
  line-height: 1.4;
}

.mine {
  background-color: var(--color-night-tile);
  color: #fff;
}

.theirs {
  align-self: flex-end;
  background-color: var(--color-lime);
  color: var(--color-ink);
}

.typing {
  display: flex;
  align-self: flex-end;
  gap: 0.25rem;
  border-radius: 1.125rem;
  background-color: var(--color-lime);
  padding: 0.75rem 0.875rem;
}

.typing i {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 999px;
  background-color: var(--color-ink);
  animation: blink 0.9s infinite;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes blink {
  50% {
    opacity: 0.25;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .line-enter-active {
    animation: line-in 0.45s var(--ease-settle);
  }

  .line-move {
    transition: transform 0.45s var(--ease-settle);
  }

  .line-leave-active {
    position: absolute;
    opacity: 0;
  }

  .clock-enter-active,
  .clock-leave-active {
    transition:
      opacity 0.2s,
      transform 0.2s var(--ease-settle);
  }

  .clock-enter-from {
    opacity: 0;
    transform: translateY(0.75rem);
  }

  .clock-leave-to {
    opacity: 0;
    transform: translateY(-0.75rem);
  }
}

@keyframes line-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}
</style>
