<template>
  <!-- "The AI talks. Your prices decide.", played: the customer asks, the
       agent's reply arrives with blanks where the numbers go, HeyDesk adds
       the order up from the menu below, and each number lifts off the sum
       and is stamped into its blank. Example data, labelled so. -->
  <figure ref="root" class="relative rounded-[var(--radius-card)] bg-wash p-4 sm:p-6" :aria-label="t('landing.stamp.label')">
    <!-- The conversation -->
    <div class="flex min-h-[13rem] flex-col justify-end gap-2.5 text-sm leading-relaxed">
      <p v-if="beat >= 1" class="bubble-them arrive">{{ t('landing.stamp.ask') }}</p>

      <p v-if="beat === 2" class="arrive flex items-center gap-2 self-start px-1 text-xs text-ink-soft">
        <span class="inline-flex gap-1" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
        {{ t('landing.stamp.thinking') }}
      </p>

      <!-- The words come from the model; each blank waits for HeyDesk's number. -->
      <i18n-t v-if="beat >= 3" keypath="landing.stamp.reply" tag="p" class="bubble-us arrive" scope="global">
        <template #items>
          <span :ref="(el) => (targets.items = el)" class="slot" :class="{ 'is-stamped': stamped.includes('items') }">{{ formatMoney(amountOf('items')) }}</span>
        </template>
        <template #delivery>
          <span :ref="(el) => (targets.delivery = el)" class="slot" :class="{ 'is-stamped': stamped.includes('delivery') }">{{ formatMoney(amountOf('delivery')) }}</span>
        </template>
        <template #total>
          <span :ref="(el) => (targets.total = el)" class="slot" :class="{ 'is-stamped': stamped.includes('total') }">{{ formatMoney(amountOf('total')) }}</span>
        </template>
      </i18n-t>
    </div>

    <!-- The sum, worked out from the menu's prices -->
    <div class="mt-4 rounded-[var(--radius-card)] bg-surface p-4 ring-1 ring-hairline">
      <p class="flex items-center gap-2 px-2 text-xs font-semibold text-ink-soft">
        <PhCalculator :size="15" class="shrink-0"></PhCalculator>
        {{ t('landing.stamp.ledger') }}
      </p>
      <ul class="mt-2 text-sm">
        <li v-for="(dish, index) in DISHES" :key="dish.key" class="line" :class="{ 'is-read': scanned > index }">
          <span class="min-w-0 flex-1">{{ t(`landing.stamp.dishes.${dish.key}`) }}</span>
          <span class="text-ink-soft">{{ t('landing.stamp.each', { qty: formatNumber(dish.qty), price: formatMoney(dish.price) }) }}</span>
          <span class="amount">{{ formatMoney(dish.qty * dish.price) }}</span>
        </li>
        <li
          v-for="(sum, index) in SUMS"
          :key="sum.key"
          class="line"
          :class="{ 'is-read': scanned > DISHES.length + index, 'line-first': index === 0, 'font-bold': sum.key === 'total' }"
        >
          <span class="min-w-0 flex-1 truncate">{{ t(`landing.stamp.sums.${sum.key}`) }}</span>
          <span :ref="(el) => (sources[sum.key] = el)" class="amount source" :class="{ 'is-lifting': lifting === sum.key }">{{ formatMoney(sum.amount) }}</span>
        </li>
      </ul>
    </div>

    <!-- Who did what, once it has played -->
    <ul v-if="beat >= 4" class="arrive mt-4 flex flex-wrap gap-x-5 gap-y-2 px-1 text-[0.8125rem] font-semibold">
      <li class="flex items-center gap-2">
        <span class="key bg-surface ring-1 ring-hairline"><PhChatText :size="14" weight="bold"></PhChatText></span>
        {{ t('landing.stamp.words') }}
      </li>
      <li class="flex items-center gap-2">
        <span class="key bg-lime"><PhCalculator :size="14" weight="bold"></PhCalculator></span>
        {{ t('landing.stamp.numbers') }}
      </li>
    </ul>

    <figcaption class="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[0.8125rem]">
      <ExampleTag></ExampleTag>
      <button v-if="finished" type="button" class="link" @click="play">{{ t('demo.playAgain') }}</button>
    </figcaption>

    <!-- The number on its way from the sum to its blank -->
    <span v-if="chip" ref="chipEl" class="chip-flying" aria-hidden="true">{{ chip }}</span>
  </figure>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalculator, PhChatText } from '@phosphor-icons/vue';

import { formatMoney, formatNumber } from '../../lib/format.js';
import ExampleTag from './ExampleTag.vue';

// Dhanmondi Kitchen's menu, as in SetupLive; the words are `landing.stamp.*`.
const DISHES = [
  { key: 'biryani', qty: 2, price: 45000 },
  { key: 'borhani', qty: 2, price: 8000 },
];
const DELIVERY = 6000;
// Added up here from the prices, the way HeyDesk does it: no number is typed in.
const ITEMS = DISHES.reduce((sum, dish) => sum + dish.qty * dish.price, 0);
const SUMS = [
  { key: 'items', amount: ITEMS },
  { key: 'delivery', amount: DELIVERY },
  { key: 'total', amount: ITEMS + DELIVERY },
];
// The pauses before each beat, in milliseconds: the question, the agent
// starting to work, each line of the sum being read, the reply, a number
// lifting off, the gap after it lands, and who-did-what at the end.
const BEAT = { ask: 500, think: 700, read: 300, reply: 600, lift: 450, land: 250, legend: 600 };
// How long a number takes to fly to its blank.
const FLIGHT = 900;

const { t } = useI18n();

const root = ref(null);
const chipEl = ref(null);
// 0 nothing yet, 1 the question, 2 working it out, 3 the reply, 4 the legend.
const beat = ref(0);
const scanned = ref(0);
const stamped = ref([]);
const lifting = ref(null);
const chip = ref(null);
const finished = ref(false);

// The elements a number flies between, by sum key.
const sources = {};
const targets = {};

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let timers = [];
let flight = null;
let runId = 0;
let observer = null;

const amountOf = (key) => SUMS.find((sum) => sum.key === key).amount;

function stop() {
  runId += 1;
  timers.forEach(clearTimeout);
  timers = [];
  if (flight) flight.cancel();
  chip.value = null;
  lifting.value = null;
}

function wait(ms) {
  return new Promise((done) => timers.push(setTimeout(done, ms)));
}

// The middle of an element, measured from the figure's corner.
function centreOf(el) {
  const box = root.value.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
}

function at(point, scale) {
  return `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(${scale})`;
}

// The number lifts off the sum, rises to just above its blank, and presses
// down into it. The Web Animations API plays the keyframes.
async function fly(key) {
  const from = centreOf(sources[key]);
  const to = centreOf(targets[key]);
  const above = { x: to.x, y: to.y - 28 };
  chip.value = formatMoney(amountOf(key));
  await nextTick();
  flight = chipEl.value.animate(
    [
      { transform: at(from, 1), easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
      { transform: at(above, 1.18), offset: 0.75, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
      { transform: at(to, 1) },
    ],
    { duration: FLIGHT, fill: 'forwards' }
  );
  await flight.finished.catch(() => {});
  flight = null;
}

function showEnd() {
  beat.value = 4;
  scanned.value = DISHES.length + SUMS.length;
  stamped.value = SUMS.map((sum) => sum.key);
  finished.value = true;
}

async function play() {
  stop();
  const mine = runId;
  beat.value = 0;
  scanned.value = 0;
  stamped.value = [];
  finished.value = false;
  // Without motion, it shows where it ends.
  if (reduce) return showEnd();

  const next = async (ms) => {
    await wait(ms);
    return mine === runId;
  };

  if (!(await next(BEAT.ask))) return;
  beat.value = 1;
  if (!(await next(BEAT.think))) return;
  beat.value = 2;
  for (let line = 1; line <= DISHES.length + SUMS.length; line += 1) {
    if (!(await next(BEAT.read))) return;
    scanned.value = line;
  }
  if (!(await next(BEAT.reply))) return;
  beat.value = 3;

  for (const { key } of SUMS) {
    if (!(await next(BEAT.lift))) return;
    lifting.value = key;
    await fly(key);
    if (mine !== runId) return;
    chip.value = null;
    lifting.value = null;
    stamped.value = [...stamped.value, key];
    if (!(await next(BEAT.land))) return;
  }

  if (!(await next(BEAT.legend))) return;
  beat.value = 4;
  finished.value = true;
}

onMounted(() => {
  // It plays when it comes into view; leaving before the end stops it, and
  // coming back plays it from the start.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !finished.value) play();
      else if (!entry.isIntersecting && !finished.value) stop();
    },
    { threshold: 0.4 }
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  observer.disconnect();
});
</script>

<style scoped>
.bubble-them,
.bubble-us {
  max-width: 88%;
  border-radius: var(--radius-card);
  padding: 0.625rem 1rem;
  line-height: 1.9;
}

.bubble-them {
  align-self: flex-end;
  border-top-right-radius: 0.25rem;
  background-color: var(--color-brand);
  color: #fff;
}

.bubble-us {
  align-self: flex-start;
  border-top-left-radius: 0.25rem;
  background-color: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-hairline);
}

/* A blank the size of the number it will hold, so nothing shifts when it lands. */
.slot {
  display: inline-block;
  border-radius: 9999px;
  padding: 0 0.5rem;
  line-height: 1.6;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: transparent;
  box-shadow: inset 0 0 0 1px var(--color-line-strong);
  background-image: repeating-linear-gradient(90deg, var(--color-line-strong) 0 4px, transparent 4px 7px);
  background-size: calc(100% - 1rem) 1px;
  background-position: center 75%;
  background-repeat: no-repeat;
}

.slot.is-stamped {
  color: var(--color-ink);
  background-color: var(--color-lime);
  background-image: none;
  box-shadow: none;
}

.line {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  border-radius: var(--radius-thumb);
  padding: 0.375rem 0.5rem;
}

.line-first {
  margin-top: 0.375rem;
  border-top: 1px solid var(--color-hairline);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  padding-top: 0.625rem;
}

.amount {
  min-width: 4.5rem;
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* The number about to fly: it lights up where it was worked out. The
   negative margin keeps its digits in line with the dishes' amounts. */
.source {
  margin-right: -0.375rem;
  border-radius: 9999px;
  padding: 0 0.375rem;
  transition: background-color 0.25s var(--ease-settle);
}

.source.is-lifting {
  background-color: var(--color-brand-tint);
}

.key {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
}

.chip-flying {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border-radius: 9999px;
  background-color: var(--color-lime);
  padding: 0 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  box-shadow: var(--shadow-lift);
  pointer-events: none;
}

.dot {
  width: 0.3125rem;
  height: 0.3125rem;
  border-radius: 9999px;
  background-color: var(--color-ink-soft);
}

@media (prefers-reduced-motion: no-preference) {
  .arrive {
    animation: arrive 0.4s var(--ease-settle) both;
  }

  /* Each line of the sum lights up as HeyDesk reads it. */
  .line.is-read {
    animation: read 0.7s var(--ease-settle);
  }

  /* The landing: a squash, then a ring that spreads and fades. */
  .slot.is-stamped {
    animation: stamp 0.5s var(--ease-settle);
  }

  .dot {
    animation: blink 1.2s ease-in-out infinite;
  }

  .dot:nth-child(2) {
    animation-delay: 0.15s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes read {
  from {
    background-color: var(--color-brand-tint);
  }
}

@keyframes stamp {
  0% {
    transform: scale(1.12, 0.82);
    box-shadow: 0 0 0 0 var(--color-lime);
  }
  45% {
    transform: scale(0.96, 1.05);
  }
  100% {
    transform: none;
    box-shadow: 0 0 0 10px rgb(0 74 172 / 0);
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}
</style>
