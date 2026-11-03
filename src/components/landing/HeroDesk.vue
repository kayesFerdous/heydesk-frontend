<template>
  <!-- The opening picture: the assistant's desk, live. A message arrives from
       one channel after another, the assistant says what it is doing, and
       the result lands under it (an order on lime, a person in orange). The
       newest comes in at the top and pushes the rest down. The card leans
       towards the pointer. Example data, labelled so. -->
  <figure
    ref="root"
    class="desk-stage"
    :aria-label="t('landing.flow.label')"
    @pointermove="lean"
    @pointerleave="unlean"
  >
    <div class="desk" :style="{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }">
      <header class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span class="grid h-10 w-10 place-items-center rounded-[var(--radius-card)] bg-lime text-ink" aria-hidden="true">
          <PhHeadset :size="20" weight="fill"></PhHeadset>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-white">{{ t('landing.flow.agent') }}</p>
          <p class="flex items-center gap-1.5 text-xs text-night-soft">
            <span class="live-dot" aria-hidden="true"></span>
            {{ t('landing.flow.live') }}
          </p>
        </div>
        <!-- How many it has handled since the page opened: rolls as each lands. -->
        <p class="text-right">
          <span class="block text-2xl leading-none font-semibold text-white tabular-nums">
            <Transition name="roll" mode="out-in">
              <span :key="handled" class="inline-block">{{ formatNumber(handled) }}</span>
            </Transition>
          </span>
          <span class="text-[0.6875rem] text-night-soft">{{ t('landing.heroDesk.handled') }}</span>
        </p>
      </header>

      <TransitionGroup tag="ol" name="feed" class="feed" aria-live="off">
        <li v-for="item in shown" :key="item.key" class="feed-item">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="CHANNELS[item.channel].tile" aria-hidden="true">
            <component :is="CHANNELS[item.channel].icon" :size="18" weight="fill"></component>
          </span>
          <div class="min-w-0 flex-1">
            <p class="flex items-baseline gap-2 text-xs text-night-soft">
              <span class="font-semibold text-white">{{ t(`landing.channels.${item.channel}.name`) }}</span>
              <span class="ml-auto shrink-0">{{ t('landing.handoffNow') }}</span>
            </p>
            <p class="mt-1 text-[0.9375rem] leading-snug text-white">{{ t(`landing.flow.${item.channel}.ask`) }}</p>

            <!-- What the assistant is doing, then what came of it. -->
            <Transition name="swap" mode="out-in">
              <p v-if="!item.done" key="work" class="mt-2 flex items-center gap-2 text-xs text-night-soft">
                <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
                {{ t(`landing.flow.${item.channel}.steps.0`) }}
              </p>
              <p v-else key="done" class="result mt-2" :class="RESULTS[item.channel]">
                <component :is="RESULT_ICONS[item.channel]" :size="14" weight="bold" class="shrink-0"></component>
                {{ t(`landing.flow.${item.channel}.result`) }}
              </p>
            </Transition>
          </div>
        </li>
      </TransitionGroup>
    </div>

    <figcaption class="mt-4 flex items-center justify-center gap-1.5 text-[0.8125rem] text-night-soft">
      <PhInfo :size="14" class="shrink-0"></PhInfo>
      {{ t('demo.notReal') }}
    </figcaption>
  </figure>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhChatCircle,
  PhCheck,
  PhHeadset,
  PhInfo,
  PhMessengerLogo,
  PhMicrophone,
  PhTelegramLogo,
  PhUserSound,
  PhWhatsappLogo,
} from '@phosphor-icons/vue';

import { formatNumber } from '../../lib/format.js';

// Each channel's tile, in its own colour. The words are `landing.flow.<channel>`.
const CHANNELS = {
  web: { icon: PhChatCircle, tile: 'bg-white text-ink' },
  whatsapp: { icon: PhWhatsappLogo, tile: 'bg-whatsapp text-white' },
  messenger: { icon: PhMessengerLogo, tile: 'bg-messenger text-white' },
  voice: { icon: PhMicrophone, tile: 'bg-tint-lilac text-ink' },
  telegram: { icon: PhTelegramLogo, tile: 'bg-telegram text-white' },
};
// What each one ends as: an order on lime, an answer quiet, a person orange.
const RESULTS = { web: 'is-order', whatsapp: 'is-answer', messenger: 'is-order', voice: 'is-answer', telegram: 'is-person' };
const RESULT_ICONS = { web: PhCheck, whatsapp: PhCheck, messenger: PhCheck, voice: PhCheck, telegram: PhUserSound };
const ORDER = ['web', 'whatsapp', 'telegram', 'messenger', 'voice'];
// How many rows fit on the card, and the pause between messages.
const ROWS = 4;
const EVERY = 2600;
const WORK = 1300;

const { t } = useI18n();

const root = ref(null);
const shown = ref([]);
const handled = ref(0);
const tilt = reactive({ x: 0, y: 0 });

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let next = 0;
let key = 0;
let timers = [];
let observer = null;

function arrive() {
  const item = reactive({ key: key++, channel: ORDER[next % ORDER.length], done: false });
  next += 1;
  shown.value = [item, ...shown.value].slice(0, ROWS);
  timers.push(
    setTimeout(() => {
      item.done = true;
      handled.value += 1;
    }, WORK)
  );
}

function play() {
  stop();
  arrive();
  timers.push(setInterval(arrive, EVERY));
}

function stop() {
  // clearTimeout stops an interval too: the browser keeps one list of ids.
  timers.forEach((id) => clearTimeout(id));
  timers = [];
}

// The card leans a few degrees towards the pointer.
function lean(event) {
  if (!fine || reduce) return;
  const box = root.value.getBoundingClientRect();
  tilt.y = ((event.clientX - box.left) / box.width - 0.5) * 8;
  tilt.x = -((event.clientY - box.top) / box.height - 0.5) * 6;
}

function unlean() {
  tilt.x = 0;
  tilt.y = 0;
}

onMounted(() => {
  // Under reduced motion the card shows four finished messages and stays.
  if (reduce) {
    shown.value = ORDER.slice(0, ROWS).map((channel) => ({ key: key++, channel, done: true }));
    handled.value = ROWS;
    return;
  }
  // It plays only while it is on screen.
  observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : stop()));
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.desk-stage {
  perspective: 1400px;
}

.desk {
  overflow: hidden;
  border-radius: 1.5rem;
  background-color: var(--color-night-tile);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08),
    0 40px 80px -30px rgb(0 0 0 / 0.7);
  transform-style: preserve-3d;
  transition: transform 0.6s var(--ease-settle);
  will-change: transform;
}

/* A fixed height, so a new row pushes the oldest out of the bottom, where
   the card fades it away. */
.feed {
  position: relative;
  display: flex;
  height: 25rem;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 72%, transparent);
}

.feed-item {
  display: flex;
  gap: 0.875rem;
  border-radius: var(--radius-card);
  padding: 0.875rem;
}

/* The newest row is lit for a moment, then settles to the card. */
.feed-item:first-child {
  background-color: rgb(255 255 255 / 0.05);
}

.result {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.is-order {
  background-color: var(--color-lime);
  color: var(--color-ink);
}

.is-answer {
  background-color: rgb(255 255 255 / 0.1);
  color: #fff;
}

.is-person {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: var(--color-lime);
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    box-shadow: 0 0 0 5px rgb(212 243 107 / 0.18);
  }
}

/* The assistant typing. */
.dots {
  display: inline-flex;
  gap: 3px;
}

.dots i {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background-color: currentColor;
  animation: dot 1s ease-in-out infinite;
}

.dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes dot {
  40% {
    transform: translateY(-3px);
    opacity: 0.4;
  }
}

/* A new row drops in from above and the others slide down to make room. The
   oldest goes at once: it is already faded out at the bottom. */
.feed-enter-active {
  transition:
    opacity 0.6s var(--ease-settle),
    transform 0.6s var(--ease-settle),
    filter 0.6s var(--ease-settle);
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-18px) scale(0.97);
  filter: blur(4px);
}

.feed-move {
  transition: transform 0.6s var(--ease-settle);
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.25s var(--ease-settle),
    transform 0.25s var(--ease-settle);
}

.swap-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.swap-leave-to {
  opacity: 0;
}

.roll-enter-active,
.roll-leave-active {
  transition:
    opacity 0.3s var(--ease-settle),
    transform 0.3s var(--ease-settle);
}

.roll-enter-from {
  opacity: 0;
  transform: translateY(60%);
}

.roll-leave-to {
  opacity: 0;
  transform: translateY(-60%);
}

@media (prefers-reduced-motion: reduce) {
  .live-dot,
  .dots i {
    animation: none;
  }
}
</style>
