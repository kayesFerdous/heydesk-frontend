<template>
  <!-- What customers ask, in the words and letters they use, drifting past in
       two rows that run opposite ways. Scrolling pushes them faster, and
       scrolling back up turns them round. Example questions, labelled so. -->
  <div ref="root" class="marquee" role="group" :aria-label="t('landing.asks.label')">
    <div v-for="(row, r) in ROWS" :key="r" class="lane">
      <div :ref="(el) => (tracks[r] = el)" class="track" :class="{ 'is-still': reduce }">
        <!-- Twice over, so when the first set has gone by the second is in
             its place and the loop has no seam. -->
        <template v-for="copy in reduce ? 1 : 2" :key="copy">
          <span v-for="(ask, index) in row" :key="`${copy}-${index}`" class="ask" :aria-hidden="copy === 2 ? 'true' : undefined">
            <component :is="CHANNELS[ask.channel]" :size="16" weight="fill" class="shrink-0" :class="COLOURS[ask.channel]"></component>
            {{ t(`landing.asks.${ask.id}`) }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatCircle, PhMessengerLogo, PhTelegramLogo, PhWhatsappLogo } from '@phosphor-icons/vue';

const CHANNELS = { web: PhChatCircle, whatsapp: PhWhatsappLogo, messenger: PhMessengerLogo, telegram: PhTelegramLogo };
const COLOURS = { web: 'text-ink', whatsapp: 'text-whatsapp', messenger: 'text-messenger', telegram: 'text-telegram' };
// The words are `landing.asks.<id>`; they stay in their own letters in both
// language files, because that is how customers write them.
const ROWS = [
  [
    { id: 'biryani', channel: 'messenger' },
    { id: 'charge', channel: 'whatsapp' },
    { id: 'open', channel: 'web' },
    { id: 'size', channel: 'messenger' },
    { id: 'cash', channel: 'telegram' },
    { id: 'bkash', channel: 'whatsapp' },
    { id: 'pickup', channel: 'web' },
  ],
  [
    { id: 'sizeM', channel: 'whatsapp' },
    { id: 'sylhet', channel: 'messenger' },
    { id: 'spicy', channel: 'web' },
    { id: 'when', channel: 'whatsapp' },
    { id: 'exchange', channel: 'telegram' },
    { id: 'friday', channel: 'messenger' },
    { id: 'call', channel: 'web' },
  ],
];
// Pixels a second at rest; scrolling adds to it and the boost wears off.
const SPEED = 36;

const { t } = useI18n();

const root = ref(null);
const tracks = [];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let offset = 0;
let direction = 1;
let boost = 0;
let lastScroll = window.scrollY;
let lastTime = 0;
let frame = null;
let observer = null;

function step(time) {
  const seconds = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
  lastTime = time;
  boost *= 0.92;
  offset += (SPEED + boost) * direction * seconds;

  tracks.forEach((track, r) => {
    if (!track) return;
    // One set is half the track; wrap the offset inside it.
    const half = track.scrollWidth / 2;
    const shift = ((offset % half) + half) % half;
    // The second row runs the other way.
    const x = r === 0 ? -shift : shift - half;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  });
  frame = requestAnimationFrame(step);
}

function onScroll() {
  const delta = window.scrollY - lastScroll;
  lastScroll = window.scrollY;
  if (delta !== 0) direction = delta > 0 ? 1 : -1;
  boost = Math.min(900, boost + Math.abs(delta) * 6);
}

function start() {
  if (frame !== null) return;
  lastTime = 0;
  frame = requestAnimationFrame(step);
}

function stop() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
}

onMounted(() => {
  if (reduce) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  // It moves only while it is on screen.
  observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  window.removeEventListener('scroll', onScroll);
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.marquee {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  /* The rows fade in and out at the edges instead of being cut off. */
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
}

.lane {
  overflow: hidden;
}

.track {
  display: flex;
  width: max-content;
  will-change: transform;
}

/* Under reduced motion the questions wrap and stay put. */
.track.is-still {
  width: auto;
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 0.75rem;
}

.ask {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: var(--color-surface);
  padding: 0.75rem 1.25rem;
  font-size: 1.0625rem;
  font-weight: 500;
  white-space: nowrap;
  /* A margin, not a gap, so one set is exactly half the track. */
  margin-right: 0.75rem;
  box-shadow: inset 0 0 0 1px var(--color-hairline);
}

@media (min-width: 768px) {
  .ask {
    padding: 0.875rem 1.5rem;
    font-size: 1.25rem;
  }
}
</style>
