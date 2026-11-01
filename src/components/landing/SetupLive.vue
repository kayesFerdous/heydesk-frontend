<template>
  <!-- Setting up, played: the five steps on the left, and on the right the
       agent they build. Each step does its part, the agent card collects
       what it now knows, and the last step turns it live. Pick a step to
       see it again. Example data, labelled so. -->
  <div ref="root" class="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
    <ol class="flex flex-col gap-1.5">
      <li v-for="(key, index) in STEPS" :key="key">
        <button
          type="button"
          class="step-row"
          :class="{ 'is-current': index === current && !finished, 'is-done': isDone(index) }"
          :aria-current="index === current ? 'step' : undefined"
          @click="choose(index)"
        >
          <span :ref="(el) => (markEls[index] = el)" class="mark" aria-hidden="true">
            <PhCheck v-if="isDone(index)" :size="15" weight="bold"></PhCheck>
            <template v-else>{{ formatNumber(index + 1) }}</template>
          </span>
          <span class="min-w-0 flex-1 text-left">
            <span class="block font-semibold tracking-[-0.01em]">{{ t(`landing.setup.${key}.title`) }}</span>
            <!-- Only the open step says more, so the list stays short. -->
            <span v-if="index === current" class="detail mt-1 block text-sm leading-relaxed text-ink-soft">{{ t(`landing.setup.${key}.text`) }}</span>
          </span>
          <span
            v-if="autoplay && index === current && !finished"
            :key="`p${runId}`"
            class="progress"
            :style="{ animationDuration: `${lengthOf(index)}ms` }"
            aria-hidden="true"
          ></span>
        </button>
      </li>
    </ol>

    <figure class="rounded-[var(--radius-card)] bg-wash p-4 sm:p-6" :aria-label="t('landing.setupLive.label')">
      <!-- The time it took so far: a ring filling towards five minutes. -->
      <p class="mb-3 flex items-center gap-2 px-1 text-xs font-semibold text-ink-soft">
        <svg class="clock" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" class="clock-track"></circle>
          <circle cx="10" cy="10" r="8" class="clock-fill" pathLength="1" :style="{ strokeDashoffset: 1 - seconds / LIMIT }"></circle>
        </svg>
        <span class="tabular-nums">{{ t('landing.setupLive.clock', { time: clockText }) }}</span>
      </p>
      <!-- The agent as it stands: what it is, what it knows, whether it is live. -->
      <div class="rounded-[var(--radius-card)] bg-surface p-4 ring-1 ring-hairline">
        <div class="flex items-center gap-3">
          <span class="avatar" :class="{ 'is-set': isDone(0) }" aria-hidden="true">
            <PhStorefront v-if="isDone(0)" :size="18" weight="bold"></PhStorefront>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ isDone(0) ? t('landing.setupLive.business') : t('landing.setupLive.yourAgent') }}</span>
            <span class="block text-xs text-ink-soft">{{ isDone(0) ? t('presets.label.shop') : t('landing.setupLive.notYet') }}</span>
          </span>
          <span v-if="isDone(4)" :key="'live'" class="chip pop bg-success-tint text-success">
            <span class="live-dot" aria-hidden="true"></span>
            {{ t('landing.setupLive.live') }}
          </span>
          <span v-else class="chip bg-hover text-ink-soft">
            <PhCircleDashed :size="13" weight="bold"></PhCircleDashed>
            {{ t('landing.setupLive.settingUp') }}
          </span>
        </div>
        <ul class="mt-3 flex min-h-7 flex-wrap gap-1.5" :aria-label="t('landing.setupLive.knows')">
          <template v-for="(fact, index) in FACTS" :key="fact.key">
            <li v-if="isDone(index)" :ref="(el) => (factEls[index] = el)" class="fact">
              <component :is="fact.icon" :size="13" weight="bold" class="shrink-0"></component>
              {{ t(`landing.setupLive.facts.${fact.key}`) }}
            </li>
          </template>
        </ul>
      </div>

      <!-- What this step is doing -->
      <div class="relative mt-3 min-h-[17.5rem]">
        <Transition name="swap" mode="out-in">
          <div :key="current" class="flex flex-col gap-2">
            <!-- 1. The kind of business -->
            <template v-if="STEPS[current] === 'create'">
              <div class="grid grid-cols-2 gap-2">
                <span v-for="service in SERVICES" :key="service.id" class="kind" :class="{ 'is-picked': service.live && beat >= 1 }">
                  <component :is="service.icon" :size="18" class="shrink-0"></component>
                  <span class="min-w-0 leading-tight">{{ t(`presets.label.${service.id}`) }}</span>
                </span>
              </div>
            </template>

            <!-- 2. Address, hours and a number -->
            <template v-else-if="STEPS[current] === 'details'">
              <label v-for="(field, index) in FIELDS" :key="field" class="block">
                <span class="mb-1 block px-1 text-xs font-semibold text-ink-soft">{{ t(`landing.setupLive.${field}`) }}</span>
                <span class="mock-field">
                  <span v-if="beat > index" class="typed">{{ t(`landing.setupLive.${field}Value`) }}</span>
                  <span v-if="beat === index" class="caret" aria-hidden="true"></span>
                </span>
              </label>
            </template>

            <!-- 3. The menu -->
            <template v-else-if="STEPS[current] === 'list'">
              <div class="flex items-center justify-between px-1">
                <span class="text-sm font-semibold">{{ t('presets.items.shop') }}</span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <PhFileCsv :size="15"></PhFileCsv>
                  {{ t('landing.setupLive.import') }}
                </span>
              </div>
              <ul class="overflow-hidden rounded-[var(--radius-thumb)] bg-surface ring-1 ring-hairline">
                <template v-for="(product, index) in PRODUCTS" :key="product.code">
                  <li v-if="beat > index" class="arrive flex items-center gap-3 border-b border-hairline px-4 py-3 text-sm last:border-b-0">
                    <span class="min-w-0 flex-1 truncate font-semibold">{{ t(`landing.setupLive.products.${index}`) }}</span>
                    <span class="tabular-nums">{{ formatMoney(product.price) }}</span>
                    <span class="switch" aria-hidden="true"><span></span></span>
                  </li>
                </template>
              </ul>
            </template>

            <!-- 4. Trying it as a customer would -->
            <template v-else-if="STEPS[current] === 'try'">
              <p v-if="beat >= 1" class="arrive bubble-them">{{ t('landing.setupLive.ask') }}</p>
              <p v-if="beat === 2" class="arrive bubble-us inline-flex gap-1 py-3.5" :aria-label="t('chat.typing')">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              </p>
              <p v-if="beat >= 3" class="arrive bubble-us">{{ t('landing.setupLive.reply') }}</p>
            </template>

            <!-- 5. Sharing it -->
            <template v-else>
              <div class="flex items-center gap-3 rounded-full bg-surface py-1.5 pr-1.5 pl-4 ring-1 ring-hairline">
                <PhLink :size="17" class="shrink-0 text-ink-faint"></PhLink>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ t('landing.setupLive.link') }}</span>
                <span class="btn btn-secondary btn-sm pointer-events-none">
                  <PhCheck v-if="beat >= 1" :size="14" weight="bold"></PhCheck>
                  {{ beat >= 1 ? t('common.copied') : t('common.copy') }}
                </span>
              </div>
              <ul class="mt-1 overflow-hidden rounded-[var(--radius-thumb)] bg-surface ring-1 ring-hairline">
                <li v-for="id in CONNECT" :key="id" class="flex items-center gap-3 border-b border-hairline px-4 py-2.5 text-sm last:border-b-0">
                  <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full" :class="channelOf(id).avatar">
                    <component :is="channelOf(id).icon" :size="16" :weight="channelOf(id).weight"></component>
                  </span>
                  <span class="min-w-0 flex-1 truncate font-semibold">{{ channelOf(id).long }}</span>
                  <span v-if="id === 'whatsapp' && beat >= 2" class="pop flex items-center gap-1 text-xs font-semibold text-success">
                    <PhCheckCircle :size="15" weight="fill"></PhCheckCircle>
                    {{ t('landing.setupLive.connected') }}
                  </span>
                  <span v-else class="text-xs font-semibold text-ink-soft">{{ t('landing.setupLive.connect') }}</span>
                </li>
              </ul>
            </template>
          </div>
        </Transition>
      </div>

      <figcaption class="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[0.8125rem]">
        <ExampleTag></ExampleTag>
        <button v-if="finished" type="button" class="link" @click="replay">{{ t('demo.playAgain') }}</button>
      </figcaption>
    </figure>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhCheck,
  PhCheckCircle,
  PhCircleDashed,
  PhClock,
  PhFileCsv,
  PhStorefront,
  PhLink,
  PhListBullets,
  PhShareNetwork,
  PhChatsCircle,
} from '@phosphor-icons/vue';

import { channelOf } from '../../lib/channels.js';
import { SERVICES } from '../../lib/presets.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import ExampleTag from './ExampleTag.vue';

// The same five steps the owner's Home walks them through (lib/setup.js);
// their words are `landing.setup.<key>`, the example's `landing.setupLive.*`.
const STEPS = ['create', 'details', 'list', 'try', 'share'];
// What the agent knows once each step is done, in the same order.
const FACTS = [
  { key: 'kind', icon: PhStorefront },
  { key: 'hours', icon: PhClock },
  { key: 'menu', icon: PhListBullets },
  { key: 'tried', icon: PhChatsCircle },
  { key: 'shared', icon: PhShareNetwork },
];
const FIELDS = ['address', 'hours', 'phone'];
const PRODUCTS = [
  { code: 'navy-polo', price: 125000 },
  { code: 'cotton-panjabi', price: 189000 },
  { code: 'linen-shirt', price: 145000 },
];
const CONNECT = ['whatsapp', 'messenger', 'telegram'];
// The pause before each beat of a step, in milliseconds; the last beat is
// the step being done. Then a short rest before the next step opens.
const BEATS = {
  create: [700, 1000],
  details: [500, 900, 900, 800],
  list: [500, 450, 450, 800],
  try: [500, 800, 1300, 900],
  share: [600, 900, 900],
};
const REST = 700;
// What each step takes a real owner, in seconds, for the clock; it fills
// towards LIMIT, the five minutes the page promises.
const STEP_SECONDS = [20, 75, 85, 45, 37];
const LIMIT = 300;

const { t } = useI18n();

const root = ref(null);
const current = ref(0);
const beat = ref(0);
const finished = ref(false);
const autoplay = ref(true);
const runId = ref(0);
// The clock's seconds, counted up to what the done steps add to.
const seconds = ref(0);
const markEls = [];
const factEls = [];

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let timers = [];
let observer = null;
let started = false;
let tick = null;

const lengthOf = (index) => BEATS[STEPS[index]].reduce((sum, ms) => sum + ms, 0) + REST;

// A step is done once its last beat has played, or once a later one opened.
function isDone(index) {
  if (finished.value) return true;
  if (index < current.value) return true;
  return index === current.value && beat.value >= BEATS[STEPS[index]].length;
}

const clockText = computed(() => {
  const whole = Math.round(seconds.value);
  return `${formatNumber(Math.floor(whole / 60))}:${formatNumber(whole % 60, { minimumIntegerDigits: 2 })}`;
});
const doneSeconds = computed(() => STEP_SECONDS.reduce((sum, s, index) => (isDone(index) ? sum + s : sum), 0));

// The clock counts up to each new total rather than jumping to it.
watch(doneSeconds, (target) => {
  cancelAnimationFrame(tick);
  if (reduce) {
    seconds.value = target;
    return;
  }
  const from = seconds.value;
  const start = performance.now();
  const count = (now) => {
    const progress = Math.min(1, (now - start) / 700);
    seconds.value = from + (target - from) * (1 - Math.pow(1 - progress, 3));
    if (progress < 1) tick = requestAnimationFrame(count);
  };
  tick = requestAnimationFrame(count);
});

// What a finished step taught the agent flies from its number into the
// card: the chip is drawn in place, then played from where the number is.
async function flyFact(index) {
  await nextTick();
  const fact = factEls[index];
  const from = markEls[index];
  if (!fact || !from) return;
  const a = from.getBoundingClientRect();
  const b = fact.getBoundingClientRect();
  fact.animate(
    [
      { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(0.6)`, opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
}

function stop() {
  runId.value += 1;
  timers.forEach(clearTimeout);
  timers = [];
}

function wait(ms) {
  return new Promise((done) => timers.push(setTimeout(done, ms)));
}

async function playFrom(index) {
  stop();
  const mine = runId.value;
  finished.value = false;
  for (let step = index; step < STEPS.length; step += 1) {
    current.value = step;
    beat.value = 0;
    const beats = BEATS[STEPS[step]];
    // Without motion, each step shows where it ends.
    if (reduce) {
      beat.value = beats.length;
      if (!autoplay.value) return;
      continue;
    }
    for (const ms of beats) {
      await wait(ms);
      if (mine !== runId.value) return;
      beat.value += 1;
    }
    flyFact(step);
    // A step picked by hand plays alone; the walk-through goes on.
    if (!autoplay.value) return;
    await wait(REST);
    if (mine !== runId.value) return;
  }
  finished.value = true;
}

function choose(index) {
  autoplay.value = false;
  playFrom(index);
}

function replay() {
  autoplay.value = true;
  playFrom(0);
}

onMounted(() => {
  // It plays the first time it comes into view; leaving pauses it and
  // coming back picks up the open step again.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!started || (!finished.value && autoplay.value)) playFrom(current.value);
        started = true;
      } else if (!finished.value) {
        stop();
      }
    },
    { threshold: 0.35 }
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  cancelAnimationFrame(tick);
  observer.disconnect();
});
</script>

<style scoped>
.step-row {
  position: relative;
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 1rem;
  border-radius: var(--radius-card);
  padding: 1rem;
  transition: background-color 0.3s var(--ease-settle);
}

.step-row:hover {
  background-color: var(--color-wash);
}

.step-row.is-current {
  background-color: var(--color-wash);
}

/* The number: lime while open, black with a check once done, as on Setup. */
.mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 600;
  transition:
    background-color 0.35s var(--ease-settle),
    border-color 0.35s var(--ease-settle),
    color 0.35s var(--ease-settle);
}

.is-current .mark {
  border-color: var(--color-brand);
  background-color: var(--color-lime);
}

.is-done .mark {
  border-color: var(--color-brand);
  background-color: var(--color-brand);
  color: #fff;
}

/* How long until the walk-through moves on. */
.progress {
  position: absolute;
  inset: auto 1rem 0.5rem 3.75rem;
  height: 2px;
  border-radius: 9999px;
  background-color: var(--color-brand);
  transform-origin: left;
  animation: progress linear both;
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1.5px dashed var(--color-line-strong);
  transition:
    background-color 0.35s var(--ease-settle),
    border-color 0.35s var(--ease-settle);
}

.avatar.is-set {
  border: 0;
  background-color: var(--color-brand-tint);
}

.live-dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 9999px;
  background-color: var(--color-success);
}

.clock {
  width: 1.25rem;
  height: 1.25rem;
  transform: rotate(-90deg);
}

.clock circle {
  fill: none;
  stroke-width: 2.5;
}

.clock-track {
  stroke: var(--color-line-strong);
}

.clock-fill {
  stroke: var(--color-brand);
  stroke-linecap: round;
  stroke-dasharray: 1;
}

.fact {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  border-radius: 9999px;
  background-color: var(--color-wash);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.kind {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: var(--radius-thumb);
  background-color: var(--color-surface);
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--color-hairline);
  transition:
    background-color 0.3s var(--ease-settle),
    box-shadow 0.3s var(--ease-settle);
}

.kind.is-picked {
  background-color: var(--color-brand-tint);
  box-shadow: inset 0 0 0 1.5px var(--color-brand);
}

.mock-field {
  display: flex;
  align-items: center;
  height: 2.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
  padding-inline: 1rem;
  font-size: 0.875rem;
}

.caret {
  width: 1.5px;
  height: 1.1em;
  background-color: var(--color-brand);
  animation: blink-caret 0.9s steps(1) infinite;
}

.switch {
  position: relative;
  width: 2rem;
  height: 1.125rem;
  border-radius: 9999px;
  background-color: var(--color-brand);
}

.switch > span {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 9999px;
  background-color: #fff;
}

.bubble-them,
.bubble-us {
  max-width: 85%;
  border-radius: var(--radius-card);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  line-height: 1.6;
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

.dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: var(--color-ink-soft);
}

.swap-enter-active {
  transition:
    opacity 0.3s var(--ease-settle),
    transform 0.3s var(--ease-settle);
}

.swap-leave-active {
  transition: opacity 0.12s ease-in;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.swap-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .detail,
  .arrive {
    animation: arrive 0.4s var(--ease-settle) both;
  }

  .pop {
    animation: pop 0.4s var(--ease-settle) both;
  }

  /* A value typed in, left to right. */
  .typed {
    animation: type 0.7s steps(22) both;
  }

  .live-dot {
    animation: live 2s ease-out infinite;
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

@media (prefers-reduced-motion: reduce) {
  .swap-enter-active,
  .swap-leave-active,
  .mark,
  .kind,
  .avatar {
    transition: none;
  }

  .swap-enter-from {
    transform: none;
  }

  .progress {
    display: none;
  }
}

@keyframes progress {
  from {
    transform: scaleX(0);
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}

@keyframes type {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes blink-caret {
  50% {
    opacity: 0;
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

@keyframes live {
  0% {
    box-shadow: 0 0 0 0 rgb(23 128 76 / 0.6);
  }
  100% {
    box-shadow: 0 0 0 6px rgb(23 128 76 / 0);
  }
}
</style>
