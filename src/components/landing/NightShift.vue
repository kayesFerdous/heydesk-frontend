<template>
  <!-- The night the owner sleeps through, run by the scroll: as the close
       comes up the page, the clock turns from evening to small hours and what
       the agent handled at each time appears. Example data, labelled so. -->
  <figure ref="root" class="rounded-[var(--radius-card)] bg-night-tile p-5 sm:p-6" :aria-label="t('landing.night.label')">
    <div class="flex items-center gap-3">
      <span class="sky" aria-hidden="true">
        <PhMoonStars :size="20" weight="fill" class="text-lime"></PhMoonStars>
      </span>
      <div class="min-w-0">
        <p class="text-2xl font-bold tracking-[-0.02em] tabular-nums">{{ clock }}</p>
        <p class="text-xs text-night-soft">{{ t('landing.night.asleep') }}</p>
      </div>
    </div>

    <!-- The night so far: a line that fills as the hours pass. -->
    <span class="night-rail mt-4" aria-hidden="true"><span :style="{ transform: `scaleX(${progress})` }"></span></span>

    <ul class="mt-4 flex min-h-[13.5rem] flex-col gap-2 text-sm">
      <template v-for="(event, index) in EVENTS" :key="index">
        <li v-if="minutes >= event.at" class="event">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full" :class="event.tile">
            <component :is="event.icon" :size="15" weight="bold"></component>
          </span>
          <span class="min-w-0 flex-1 leading-snug">{{ t(`landing.night.events.${index}`, { amount: event.amount ? formatMoney(event.amount) : '' }) }}</span>
          <span class="shrink-0 text-xs text-night-soft tabular-nums">{{ timeOf(event.at) }}</span>
        </li>
      </template>
    </ul>

    <figcaption class="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-night-soft">
      <PhInfo :size="14" class="shrink-0"></PhInfo>
      {{ t('demo.notReal') }}
    </figcaption>
  </figure>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatCircleText, PhEnvelopeSimple, PhInfo, PhMoonStars, PhTray } from '@phosphor-icons/vue';

import { formatMoney, formatTime } from '../../lib/format.js';

// The night, in minutes after midnight on the evening's day: 9 PM to 3 AM.
const FROM = 21 * 60;
const TO = 27 * 60;
// What came in, and when; the words are `landing.night.events.<n>`.
const EVENTS = [
  { at: 21 * 60 + 38, icon: PhTray, tile: 'bg-lime text-ink', amount: 125000 },
  { at: 23 * 60 + 12, icon: PhChatCircleText, tile: 'bg-white/10 text-white' },
  { at: 24 * 60 + 55, icon: PhEnvelopeSimple, tile: 'bg-white/10 text-white' },
  { at: 26 * 60 + 47, icon: PhTray, tile: 'bg-lime text-ink', amount: 45000 },
];

const { t } = useI18n();

const root = ref(null);
// 0 as the figure comes up from the bottom of the screen, 1 once it is well in.
const progress = ref(0);
const minutes = computed(() => FROM + (TO - FROM) * progress.value);

// A time of night as the visitor's own clock would show it, through the
// page's usual formatter: minutes after midnight, read in UTC.
const timeOf = (at) => formatTime(new Date(Date.UTC(2026, 0, 1, 0, at % (24 * 60))).toISOString(), 'UTC');
const clock = computed(() => timeOf(Math.floor(minutes.value / 5) * 5));

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame = null;

function measure() {
  frame = null;
  if (!root.value) return;
  const box = root.value.getBoundingClientRect();
  const height = window.innerHeight;
  // Starts as its top enters at the bottom; ends when its top reaches a
  // third of the way down the screen.
  const raw = (height - box.top) / (height * 0.67);
  progress.value = Math.min(1, Math.max(0, raw));
}

// One measurement per frame, however fast the scroll events come.
function onScroll() {
  if (frame === null) frame = requestAnimationFrame(measure);
}

onMounted(() => {
  // Without motion the whole night shows at once.
  if (reduce) {
    progress.value = 1;
    return;
  }
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (frame !== null) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.sky {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.06);
}

.night-rail {
  display: block;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.12);
}

.night-rail > span {
  display: block;
  height: 100%;
  background-color: var(--color-lime);
  transform-origin: left;
}

.event {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius-thumb);
  background-color: rgb(255 255 255 / 0.04);
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
}

@media (prefers-reduced-motion: no-preference) {
  .event {
    animation: arrive 0.45s var(--ease-settle) both;
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
