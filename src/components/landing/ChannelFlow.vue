<template>
  <!-- The whole idea in one picture: every channel is wired into one agent,
       and the agent's work lands in the owner's inbox. A message travels
       down its channel's wire, the agent shows what it checks, and the
       result travels on to where it is kept. Tap a channel to send one.
       Example data, labelled so. -->
  <figure ref="root" :aria-label="t('landing.flow.label')">
    <div
      ref="stage"
      class="relative grid grid-cols-[minmax(0,1fr)] items-center md:grid-cols-[auto_minmax(3rem,1fr)_auto_minmax(3rem,1fr)_auto]"
    >
      <!-- The wires, drawn between the pieces wherever the layout puts them. -->
      <svg class="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <path
          v-for="(d, index) in inPaths"
          :key="`i${index}`"
          :ref="(el) => (inEls[index] = el)"
          :d="d"
          class="wire"
          :class="{ 'wire-hover': hovered === index }"
        ></path>
        <path v-for="(d, index) in outPaths" :key="`o${index}`" :ref="(el) => (outEls[index] = el)" :d="d" class="wire"></path>
        <!-- The part of a wire the message has already travelled, in ink. -->
        <path
          v-if="trail"
          :d="trail.d"
          class="wire-lit"
          :style="{ strokeDasharray: trail.length, strokeDashoffset: trail.length * (1 - trail.progress) }"
        ></path>
      </svg>

      <!-- Where customers write -->
      <ul class="relative flex justify-between gap-2 md:flex-col md:gap-2.5" :aria-label="t('landing.flow.channels')">
        <li v-for="(id, index) in CHANNELS" :key="id" :ref="(el) => (channelEls[index] = el)">
          <button
            type="button"
            class="node"
            :class="{ 'is-sending': sendingFrom === index }"
            :aria-label="t('landing.flow.send', { channel: channelOf(id).long })"
            @click="send(index)"
            @mouseenter="hovered = index"
            @mouseleave="hovered = null"
            @focus="hovered = index"
            @blur="hovered = null"
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="channelOf(id).avatar">
              <component :is="channelOf(id).icon" :size="18" :weight="channelOf(id).weight"></component>
            </span>
            <span class="hidden pr-2 text-sm font-semibold md:inline">{{ t(`landing.channels.${id}.name`) }}</span>
          </button>
        </li>
      </ul>

      <span class="h-20 md:h-auto" aria-hidden="true"></span>

      <!-- The agent: what it is doing right now, in words. -->
      <div ref="hub" class="hub relative mx-auto w-full max-w-[18rem] md:w-[17rem]" :class="{ 'is-busy': busy }">
        <div class="flex items-center gap-3">
          <BrandMark mark-only></BrandMark>
          <div class="min-w-0">
            <p class="font-semibold">{{ t('landing.flow.agent') }}</p>
            <p class="flex items-center gap-1.5 text-xs text-night-soft">
              <span class="live-dot" aria-hidden="true"></span>
              {{ t('landing.flow.live') }}
            </p>
          </div>
        </div>
        <ol class="mt-3 flex min-h-[4.75rem] flex-col justify-end gap-1 border-t border-white/10 pt-3 text-[0.8125rem]">
          <li v-if="!steps.length" class="text-night-soft">{{ t('landing.flow.idle') }}</li>
          <li v-for="(step, index) in steps" :key="`${runId}-${index}`" class="step flex items-start gap-2" :class="{ 'is-done': index < steps.length - 1 || finished }">
            <PhCheck v-if="index < steps.length - 1 || finished" :size="14" weight="bold" class="mt-0.5 shrink-0 text-lime"></PhCheck>
            <span v-else class="dots mt-1.5 shrink-0" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </div>

      <span class="h-20 md:h-auto" aria-hidden="true"></span>

      <!-- Where the work lands -->
      <ul class="relative grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-2.5" :aria-label="t('landing.flow.lands')">
        <li
          v-for="(outcome, index) in OUTCOMES"
          :key="outcome.id"
          :ref="(el) => (outcomeEls[index] = el)"
          class="outcome"
          :class="{ 'is-landing': landed === index, 'is-person': outcome.id === 'person' }"
        >
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full" :class="outcome.tile">
            <component :is="outcome.icon" :size="16" weight="bold"></component>
          </span>
          <span class="min-w-0 flex-1 text-[0.8125rem] leading-tight font-semibold md:truncate md:text-sm">{{ t(`landing.flow.outcomes.${outcome.id}`) }}</span>
          <!-- The count rolls like an odometer: the old number up and out, the new one in. -->
          <span class="count roll" :class="{ 'count-attention': outcome.id === 'person' && counts[index] }">
            <Transition name="roll">
              <span :key="counts[index]">{{ formatNumber(counts[index]) }}</span>
            </Transition>
          </span>
        </li>
      </ul>

      <!-- The gate into Orders: shut until the customer has said yes. -->
      <span
        v-if="gate"
        class="gate"
        :class="{ 'is-open': gateOpen }"
        :style="{ '--at': `translate(${gate.x}px, ${gate.y}px) translate(-50%, -50%)` }"
        aria-hidden="true"
      >
        <PhLockSimpleOpen v-if="gateOpen" :size="12" weight="bold"></PhLockSimpleOpen>
        <PhLockSimple v-else :size="12" weight="bold"></PhLockSimple>
      </span>

      <!-- The message on its way: the customer's words in, the result out. -->
      <span v-if="packet" class="packet" :class="`packet-${packet.kind}`" :style="{ transform: `translate(${packet.x}px, ${packet.y}px) translate(-50%, -50%)` }" aria-hidden="true">
        <span v-if="packet.kind === 'in'" class="grid h-5 w-5 shrink-0 place-items-center rounded-full" :class="channelOf(CHANNELS[packet.from]).avatar">
          <component :is="channelOf(CHANNELS[packet.from]).icon" :size="11" :weight="channelOf(CHANNELS[packet.from]).weight"></component>
        </span>
        <span class="hidden truncate md:inline">{{ packet.text }}</span>
      </span>
    </div>

    <figcaption class="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[0.8125rem] text-ink-soft md:mt-8">
      <span class="inline-flex items-center gap-2">
        <PhHandTap :size="16" class="shrink-0 text-ink-faint"></PhHandTap>
        {{ t('landing.flow.hint') }}
      </span>
      <span class="hidden sm:inline" aria-hidden="true">·</span>
      <ExampleTag></ExampleTag>
    </figcaption>

    <!-- The latest message and what came of it, for screen readers. -->
    <p class="sr-only" aria-live="polite">{{ spoken }}</p>
  </figure>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhChatCircleText,
  PhCheck,
  PhEnvelopeSimple,
  PhHandTap,
  PhLockSimple,
  PhLockSimpleOpen,
  PhTray,
  PhUserSound,
} from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import ExampleTag from './ExampleTag.vue';
import { channelOf } from '../../lib/channels.js';
import { formatNumber } from '../../lib/format.js';

// One example per channel, all for the same restaurant; the words are
// `landing.flow.<channel>.{ask, steps, result}`. LANDS is the outcome it
// lands in (an index into OUTCOMES), STEP_COUNT how many steps it shows.
const CHANNELS = ['web', 'whatsapp', 'messenger', 'voice', 'telegram'];
const LANDS = { web: 0, whatsapp: 2, messenger: 0, voice: 1, telegram: 3 };
const STEP_COUNT = { web: 3, whatsapp: 2, messenger: 3, voice: 2, telegram: 2 };
const OUTCOMES = [
  { id: 'orders', icon: PhTray, tile: 'bg-brand-tint text-ink' },
  { id: 'messages', icon: PhEnvelopeSimple, tile: 'bg-brand-tint text-ink' },
  { id: 'answered', icon: PhChatCircleText, tile: 'bg-hover text-ink' },
  { id: 'person', icon: PhUserSound, tile: 'bg-attention-tint text-attention' },
];
// How long each part takes, in milliseconds.
const TIME = { inbound: 1100, step: 850, gate: 350, outbound: 900, rest: 1300 };

const { t } = useI18n();

const root = ref(null);
const stage = ref(null);
const hub = ref(null);
const channelEls = [];
const outcomeEls = [];
const inEls = [];
const outEls = [];

const inPaths = ref([]);
const outPaths = ref([]);
const hovered = ref(null);
const sendingFrom = ref(null);
const landed = ref(null);
const busy = ref(false);
const finished = ref(false);
const steps = ref([]);
const runId = ref(0);
const counts = ref(OUTCOMES.map(() => 0));
const packet = ref(null);
const trail = ref(null);
// Where Orders' wire meets its tile, and whether a yes has opened it.
const gate = ref(null);
const gateOpen = ref(false);
const spoken = ref('');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = window.matchMedia('(min-width: 768px)');
let next = 0;
let timers = [];
let frame = 0;
let onScreen = false;
let observer = null;
let resizer = null;

const say = (id, key) => t(`landing.flow.${id}.${key}`);
const stepsOf = (id) => Array.from({ length: STEP_COUNT[id] }, (_, n) => say(id, `steps.${n}`));

// ---- Drawing the wires -------------------------------------------------

// A point on one side of an element, in the stage's own pixels.
function anchor(el, side) {
  const box = el.getBoundingClientRect();
  const base = stage.value.getBoundingClientRect();
  const x = box.left - base.left;
  const y = box.top - base.top;
  if (side === 'right') return [x + box.width, y + box.height / 2];
  if (side === 'left') return [x, y + box.height / 2];
  if (side === 'bottom') return [x + box.width / 2, y + box.height];
  return [x + box.width / 2, y];
}

// A smooth S from one point to the other, leaving and arriving straight.
function curve([x1, y1], [x2, y2], across) {
  if (across) {
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

function measure() {
  if (!stage.value || !hub.value) return;
  const across = wide.matches;
  const hubIn = anchor(hub.value, across ? 'left' : 'top');
  const hubOut = anchor(hub.value, across ? 'right' : 'bottom');
  inPaths.value = channelEls.map((el) => curve(anchor(el, across ? 'right' : 'bottom'), hubIn, across));
  outPaths.value = outcomeEls.map((el) => curve(hubOut, anchor(el, across ? 'left' : 'top'), across));
  const [x, y] = anchor(outcomeEls[0], across ? 'left' : 'top');
  gate.value = { x, y };
}

// ---- Playing one message -----------------------------------------------

function stop() {
  runId.value += 1; // anything still waiting sees it is stale and gives up
  timers.forEach(clearTimeout);
  timers = [];
  cancelAnimationFrame(frame);
  packet.value = null;
  trail.value = null;
  gateOpen.value = false;
}

function wait(ms) {
  return new Promise((done) => timers.push(setTimeout(done, ms)));
}

const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// Move the packet along a wire, inking the wire behind it.
function travel(pathEl, ms, kind, from, text) {
  return new Promise((done) => {
    const length = pathEl.getTotalLength();
    const d = pathEl.getAttribute('d');
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const point = pathEl.getPointAtLength(length * ease(p));
      packet.value = { kind, from, text, x: point.x, y: point.y };
      trail.value = { d, length, progress: ease(p) };
      if (p < 1) frame = requestAnimationFrame(step);
      else done();
    };
    frame = requestAnimationFrame(step);
  });
}

async function play(index) {
  stop();
  const mine = runId.value;
  const stale = () => mine !== runId.value;
  const id = CHANNELS[index];
  const to = LANDS[id];
  const all = stepsOf(id);

  sendingFrom.value = index;
  landed.value = null;
  finished.value = false;
  steps.value = [];

  // Without motion: the result at once, no travelling.
  if (reduce) {
    steps.value = all;
    finished.value = true;
    land(index, to);
    return;
  }

  await travel(inEls[index], TIME.inbound, 'in', index, say(id, 'ask'));
  if (stale()) return;
  packet.value = null;
  trail.value = null;
  busy.value = true;
  for (const line of all) {
    steps.value = [...steps.value, line];
    await wait(TIME.step);
    if (stale()) return;
  }
  finished.value = true;
  busy.value = false;
  // Only an order the customer said yes to opens the way into Orders.
  if (to === 0) {
    gateOpen.value = true;
    await wait(TIME.gate);
    if (stale()) return;
  }
  await travel(outEls[to], TIME.outbound, 'out', index, say(id, 'result'));
  if (stale()) return;
  packet.value = null;
  trail.value = null;
  land(index, to);
  gateOpen.value = false;

  await wait(TIME.rest);
  if (stale() || !onScreen) return;
  next = (index + 1) % CHANNELS.length;
  play(next);
}

function land(index, to) {
  const id = CHANNELS[index];
  counts.value = counts.value.map((n, i) => (i === to ? n + 1 : n));
  landed.value = to;
  sendingFrom.value = null;
  spoken.value = `${say(id, 'ask')} ${t(`landing.flow.outcomes.${OUTCOMES[to].id}`)}: ${say(id, 'result')}`;
}

// A tap sends that channel's message now; the loop carries on from there.
function send(index) {
  busy.value = false;
  play(index);
}

// ---- When to run -------------------------------------------------------

function onWideChange() {
  nextTick(measure);
}

onMounted(() => {
  measure();
  resizer = new ResizeObserver(measure);
  resizer.observe(stage.value);
  wide.addEventListener('change', onWideChange);

  // The loop runs only while the picture is on screen; without motion it
  // waits for a tap.
  if (reduce) return;
  observer = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) play(next);
      else {
        stop();
        busy.value = false;
        sendingFrom.value = null;
      }
    },
    { threshold: 0.35 }
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  if (observer) observer.disconnect();
  resizer.disconnect();
  wide.removeEventListener('change', onWideChange);
});
</script>

<style scoped>
.wire {
  fill: none;
  stroke: var(--color-line-strong);
  stroke-width: 1.5;
  stroke-dasharray: 2 6;
  stroke-linecap: round;
  transition: stroke 0.2s;
}

.wire-hover {
  stroke: var(--color-ink-soft);
}

.wire-lit {
  fill: none;
  stroke: var(--color-brand);
  stroke-width: 2;
  stroke-linecap: round;
}

/* A channel: a white pill with its own logo. */
.node {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background-color: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-hairline);
  transition:
    box-shadow 0.2s var(--ease-settle),
    transform 0.2s var(--ease-settle);
}

.node:hover,
.node:focus-visible {
  box-shadow: inset 0 0 0 1px var(--color-ink);
}

.node:active {
  transform: scale(0.97);
}

/* The channel a message is leaving from. */
.node.is-sending {
  box-shadow: inset 0 0 0 2px var(--color-ink);
}

/* The agent: a black tile, like the console's sidebar. */
.hub {
  z-index: 1;
  border-radius: var(--radius-card);
  background-color: var(--color-night);
  color: #fff;
  padding: 1rem 1.125rem;
  transition: box-shadow 0.4s var(--ease-settle);
}

.live-dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 9999px;
  background-color: var(--color-success);
}

.dots {
  display: inline-flex;
  gap: 2px;
}

.dots > span {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background-color: var(--color-lime);
}

/* Where the work lands: a grey tile with a count, as on Home. */
.outcome {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: var(--radius-card);
  background-color: var(--color-wash);
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  transition: background-color 0.6s var(--ease-settle);
}

@media (min-width: 768px) {
  .outcome {
    width: 13rem;
  }
}

.outcome.is-landing {
  background-color: var(--color-brand-tint);
}

/* A customer waiting for a person lands in orange, the one warm colour. */
.outcome.is-landing.is-person {
  background-color: var(--color-attention-tint);
}

/* The lock on Orders' wire: grey and shut, lime and open for a yes. */
.gate {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 9999px;
  background-color: var(--color-surface);
  color: var(--color-ink-soft);
  box-shadow: inset 0 0 0 1px var(--color-line-strong);
  transform: var(--at);
  transition:
    background-color 0.25s var(--ease-settle),
    color 0.25s var(--ease-settle),
    box-shadow 0.25s var(--ease-settle);
}

.gate.is-open {
  background-color: var(--color-lime);
  color: var(--color-ink);
  box-shadow: inset 0 0 0 1px var(--color-ink);
}

/* The count's numbers stack in one cell, so the old and new can pass. */
.roll {
  display: inline-grid;
  overflow: hidden;
}

.roll > span {
  grid-area: 1 / 1;
}

.packet {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 15rem;
  border-radius: 9999px;
  padding: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: var(--shadow-float);
  will-change: transform;
  pointer-events: none;
}

/* The customer's words are black, as in the chat; the result is pale lime. */
.packet-in {
  background-color: var(--color-brand);
  color: #fff;
}

.packet-out {
  background-color: var(--color-lime);
  color: var(--color-ink);
  min-width: 0.875rem;
  min-height: 0.875rem;
  padding: 0.375rem;
}

@media (min-width: 768px) {
  .packet-in {
    padding-right: 0.75rem;
  }

  .packet-out {
    padding-inline: 0.75rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  /* Working: a soft lime ring breathes around the agent. */
  .hub.is-busy {
    animation: breathe 1.4s ease-in-out infinite;
  }

  .step {
    animation: settle 0.35s var(--ease-settle) both;
  }

  .dots > span {
    animation: blink 1.1s ease-in-out infinite;
  }

  .dots > span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .dots > span:nth-child(3) {
    animation-delay: 0.3s;
  }

  .live-dot {
    animation: live 2s ease-out infinite;
  }


  .node.is-sending {
    animation: send 0.9s ease-out;
  }

  .gate.is-open {
    animation: unlock 0.35s var(--ease-settle);
  }

  .roll-enter-active,
  .roll-leave-active {
    transition: transform 0.45s var(--ease-settle);
  }

  .roll-enter-from {
    transform: translateY(100%);
  }

  .roll-leave-to {
    transform: translateY(-100%);
  }
}

@keyframes unlock {
  50% {
    transform: var(--at) scale(1.3);
  }
}

@keyframes breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(212 243 107 / 0);
  }
  50% {
    box-shadow: 0 0 0 7px rgb(212 243 107 / 0.45);
  }
}

@keyframes settle {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
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


@keyframes send {
  from {
    box-shadow:
      inset 0 0 0 2px var(--color-ink),
      0 0 0 0 rgb(17 17 17 / 0.2);
  }
  to {
    box-shadow:
      inset 0 0 0 2px var(--color-ink),
      0 0 0 10px rgb(17 17 17 / 0);
  }
}
</style>
