<template>
  <!-- The landing page's proof: the product doing its job. A customer asks,
       the agent reads it back with the total, the customer says yes, and only
       then does it arrive in the owner's inbox. Example data, labelled so. -->
  <div ref="root" class="relative">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <!-- Four examples are wider than a phone: the track scrolls sideways there. -->
      <div class="segmented tabs-scroll max-w-full overflow-x-auto" role="group" :aria-label="t('demo.exampleBusiness')">
        <button
          v-for="(item, id) in SCENES"
          :key="id"
          type="button"
          class="segment shrink-0"
          :class="{ 'segment-active': id === sceneId }"
          :aria-pressed="id === sceneId ? 'true' : 'false'"
          @click="choose(id)"
        >
          <component :is="item.icon" :size="15" weight="bold"></component>
          {{ t(`demo.${id}.kind`) }}
          <!-- While the demo plays on its own, a line shows when it moves on. -->
          <span
            v-if="autoplay && id === sceneId"
            :key="`p${run}`"
            class="progress"
            :style="{ animationDuration: `${sceneLength}ms` }"
            aria-hidden="true"
          ></span>
        </button>
      </div>
      <p class="flex items-center gap-2 text-[0.8125rem]">
        <ExampleTag></ExampleTag>
        <button type="button" class="link" @click="replay">{{ t('demo.playAgain') }}</button>
      </p>
    </div>

    <div
      class="mt-4 grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[var(--radius-panel)] border border-line-strong bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <!-- The customer's side -->
      <section class="flex min-h-[25rem] flex-col border-b border-hairline bg-wash lg:border-r lg:border-b-0" :aria-label="t('demo.customerChat')">
        <header class="flex items-center gap-3 border-b border-hairline bg-surface px-4 py-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand" aria-hidden="true">
            {{ scene.initials }}
          </span>
          <span class="min-w-0 truncate text-sm font-semibold">{{ scene.business }}</span>
          <span class="ml-auto hidden items-center gap-1.5 text-xs text-ink-soft sm:inline-flex">
            <PhGlobe :size="14"></PhGlobe>
            {{ t('channelsPage.websiteChat') }}
          </span>
        </header>

        <div class="flex flex-1 flex-col gap-2.5 px-4 py-5 text-sm leading-relaxed">
          <!-- A shop's customer can send a photo of what they want. -->
          <span
            v-if="step >= 1 && scene.photo"
            :key="`f${run}`"
            class="arrive photo grid h-28 w-28 place-items-center self-end rounded-[var(--radius-card)] rounded-tr-sm bg-tint-sky"
            :aria-label="t('demo.photo')"
            role="img"
          >
            <PhTShirt :size="56" weight="duotone" class="text-ink"></PhTShirt>
          </span>
          <p v-if="step >= 1" :key="`a${run}`" class="arrive max-w-[85%] self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-brand px-4 py-2.5 text-white">
            {{ scene.asks }}
          </p>

          <p
            v-if="step === 2"
            class="arrive inline-flex gap-1 self-start rounded-[var(--radius-panel)] rounded-tl-sm bg-surface px-4 py-3.5 text-ink-soft ring-1 ring-hairline"
            :aria-label="t('chat.typing')"
          >
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </p>

          <div v-if="step >= 3" :key="`b${run}`" class="arrive max-w-[85%] self-start">
            <!-- Streams in word by word, the way the real agent replies. -->
            <p class="rounded-[var(--radius-panel)] rounded-tl-sm bg-surface px-4 py-2.5 text-ink ring-1 ring-hairline">
              {{ streamed }}<span v-if="streaming" class="caret" aria-hidden="true"></span>
            </p>
            <p v-if="!streaming" class="arrive mt-1.5 flex items-center gap-1.5 px-1 text-xs text-ink-soft">
              <PhCalculator :size="14" class="shrink-0 text-ink-faint"></PhCalculator>
              {{ scene.source }}
            </p>
          </div>

          <!-- The yes, stamped confirmed beside it; the order leaves from here. -->
          <div v-if="step >= 4" :key="`c${run}`" class="arrive flex items-center gap-3 self-end">
            <span v-if="step >= 5" ref="sealEl" class="seal">
              <PhSealCheck :size="14" weight="fill" class="shrink-0"></PhSealCheck>
              {{ t('demo.seal') }}
            </span>
            <p class="rounded-[var(--radius-panel)] rounded-tr-sm bg-brand px-4 py-2.5 text-white">{{ scene.yes }}</p>
          </div>
        </div>

        <div class="border-t border-hairline bg-surface p-3" aria-hidden="true">
          <div class="flex h-10 items-center rounded-full border border-line-strong px-4 text-sm text-ink-soft">
            {{ t('chat.typeMessage') }}
          </div>
        </div>
      </section>

      <!-- The owner's side -->
      <section class="flex flex-col" :aria-label="t('demo.yourInbox')">
        <header class="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
          <span class="flex items-center gap-2 text-sm font-semibold">
            <PhTray :size="18" class="text-ink-faint"></PhTray>
            {{ t('inbox.title') }}
            <span class="font-normal text-ink-soft">{{ scene.list }}</span>
          </span>
          <span :key="`n${run}${step >= 6}`" class="count" :class="{ 'count-new': step >= 6 }">{{ t('demo.newCount', { n: formatNumber(step >= 6 ? 1 : 0) }) }}</span>
        </header>

        <p class="day-head static sm:px-5">{{ t('format.today') }}</p>

        <ul class="text-sm">
          <li v-if="step >= 6" :key="`r${run}`" class="landed border-b border-hairline px-5 py-3.5">
            <InboxRow :row="scene.row" :time="t('format.justNow')"></InboxRow>
            <p class="mt-2 flex items-center gap-1.5 pl-12 text-xs font-medium text-success">
              <PhSealCheck :size="15" weight="fill" class="shrink-0"></PhSealCheck>
              {{ t('demo.confirmed') }}
            </p>
          </li>
          <li v-else ref="slotEl" class="flex items-center gap-3 border-b border-hairline px-5 py-3.5 text-ink-soft">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line-strong" aria-hidden="true"></span>
            <span>{{ t('demo.nothingUntilYes') }}</span>
          </li>
          <li v-for="row in scene.earlier" :key="row.name" class="border-b border-hairline px-5 py-3.5">
            <InboxRow :row="row" :time="row.time"></InboxRow>
          </li>
        </ul>
      </section>
    </div>

    <!-- The confirmed order on its way from the chat to the inbox -->
    <span v-if="ticket" ref="ticketEl" class="ticket" aria-hidden="true">
      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-tint text-[0.6875rem] font-semibold text-brand">{{ scene.row.initials }}</span>
      <span class="font-semibold">{{ scene.row.name }}</span>
      <span v-if="scene.row.amount" class="text-ink-soft">{{ scene.row.amount }}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhBuildings,
  PhCalculator,
  PhForkKnife,
  PhGlobe,
  PhSealCheck,
  PhStethoscope,
  PhStorefront,
  PhTShirt,
  PhTray,
} from '@phosphor-icons/vue';

import InboxRow from './InboxRow.vue';
import ExampleTag from './ExampleTag.vue';
import { formatMoney, formatNumber } from '../../lib/format.js';

// Four example businesses, one per preset. Names and numbers are made up; the
// words are `demo.<scene>.*` in the language files (a row's summary and time
// are `rows.<n>` and `times.<n>`, the new one is row 0).
const SCENES = {
  restaurant: {
    icon: PhForkKnife,
    initials: 'DK',
    rows: [
      { initials: 'TA', name: 'Tanvir Ahmed', code: 'A-104', amount: 90000, status: 'new' },
      { initials: 'FI', name: 'Farhana Islam', code: 'A-103', amount: 32000, status: 'ready' },
      { initials: 'IH', name: 'Imran Hossain', code: 'A-102', amount: 155000, status: 'collected' },
    ],
  },
  clinic: {
    icon: PhStethoscope,
    initials: 'LC',
    rows: [
      { initials: 'NJ', name: 'Nusrat Jahan', code: 'A-101', status: 'new' },
      { initials: 'RK', name: 'Rahim Khan', code: 'A-100', status: 'handled' },
      { initials: 'SB', name: 'Sadia Begum', code: 'A-099', status: 'handled' },
    ],
  },
  shop: {
    icon: PhStorefront,
    initials: 'BT',
    photo: true,
    rows: [
      { initials: 'SR', name: 'Sabbir Rahman', code: 'O-215', amount: 131000, status: 'new' },
      { initials: 'MA', name: 'Mitu Akter', code: 'O-214', amount: 249000, status: 'shipped' },
      { initials: 'RK', name: 'Rahim Khan', code: 'O-213', amount: 98000, status: 'delivered' },
    ],
  },
  office: {
    icon: PhBuildings,
    initials: 'NR',
    rows: [
      { initials: 'RH', name: 'Rafiq Hasan', status: 'new' },
      { initials: 'MA', name: 'Mitu Akter', status: 'handled' },
      { initials: 'JU', name: 'Jamal Uddin', status: 'handled' },
    ],
  },
};

// The pauses between beats, in milliseconds: before the question, before the
// agent starts typing, typing, between streamed words, before the yes, before
// the confirmed stamp, before the order leaves for the inbox, its flight, and
// how long the finished story stays up before the next one.
const BEAT = { ask: 500, think: 900, typing: 1100, word: 55, yes: 1100, seal: 600, leave: 700, fly: 900, hold: 4200 };
const ORDER = Object.keys(SCENES);

const { t } = useI18n();

const root = ref(null);
const sealEl = ref(null);
const slotEl = ref(null);
const ticketEl = ref(null);
// True while the confirmed order flies to the inbox.
const ticket = ref(false);
const sceneId = ref('restaurant');
const step = ref(0);
const words = ref(0);
const run = ref(0);
// Cycles through the examples until the visitor picks one.
const autoplay = ref(true);

const scene = computed(() => {
  const id = sceneId.value;
  const say = (key) => t(`demo.${id}.${key}`);
  const [first, ...earlier] = SCENES[id].rows.map((row, index) => ({
    ...row,
    summary: say(`rows.${index}`),
    amount: row.amount ? formatMoney(row.amount) : '',
    time: index ? say(`times.${index}`) : '',
  }));
  return {
    initials: SCENES[id].initials,
    photo: Boolean(SCENES[id].photo),
    business: say('business'),
    list: say('list'),
    asks: say('asks'),
    readBack: say('readBack'),
    source: say('source'),
    yes: say('yes'),
    row: first,
    earlier,
  };
});
const readBackWords = computed(() => scene.value.readBack.split(' '));
const streamed = computed(() => readBackWords.value.slice(0, words.value).join(' '));
const streaming = computed(() => step.value === 3 && words.value < readBackWords.value.length);
// One scene from start to the move to the next, for the progress line.
const sceneLength = computed(() => {
  const b = BEAT;
  return b.ask + b.think + b.typing + b.word * readBackWords.value.length + b.yes + b.seal + b.leave + b.fly + b.hold;
});

let timers = [];
let flight = null;
let observer = null;
let reduce = false;

function stop() {
  run.value += 1; // any sequence still waiting sees it is stale and gives up
  timers.forEach(clearTimeout);
  timers = [];
  if (flight) flight.cancel();
  ticket.value = false;
}

function wait(ms) {
  return new Promise((done) => timers.push(setTimeout(done, ms)));
}

// The middle of an element, measured from the demo's corner.
function centreOf(el) {
  const box = root.value.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
}

function at(point, scale) {
  return `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(${scale})`;
}

// The confirmed order leaves the chat as a ticket and arcs over to the row
// in the inbox where it lands. The Web Animations API plays the keyframes.
async function sendToInbox() {
  const from = centreOf(sealEl.value);
  const to = centreOf(slotEl.value);
  const over = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 48 };
  ticket.value = true;
  await nextTick();
  flight = ticketEl.value.animate(
    [
      { transform: at(from, 0.6), opacity: 0 },
      { transform: at(from, 1), opacity: 1, offset: 0.15 },
      { transform: at(over, 1.05), offset: 0.55 },
      { transform: at(to, 1), opacity: 1 },
    ],
    { duration: BEAT.fly, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' }
  );
  await flight.finished.catch(() => {});
  flight = null;
}

async function play() {
  stop();
  const mine = run.value;
  const stale = () => mine !== run.value;

  // Without motion, show the finished story at once and stay on it.
  if (reduce) {
    autoplay.value = false;
    step.value = 6;
    words.value = readBackWords.value.length;
    return;
  }

  step.value = 0;
  words.value = 0;
  const beats = [
    [BEAT.ask, 1],
    [BEAT.think, 2],
    [BEAT.typing, 3],
  ];
  for (const [ms, next] of beats) {
    await wait(ms);
    if (stale()) return;
    step.value = next;
  }
  while (words.value < readBackWords.value.length) {
    await wait(BEAT.word);
    if (stale()) return;
    words.value += 1;
  }
  await wait(BEAT.yes);
  if (stale()) return;
  step.value = 4;
  await wait(BEAT.seal);
  if (stale()) return;
  step.value = 5;
  await wait(BEAT.leave);
  if (stale()) return;
  await sendToInbox();
  if (stale()) return;
  ticket.value = false;
  step.value = 6;

  if (!autoplay.value) return;
  await wait(BEAT.hold);
  if (stale()) return;
  sceneId.value = ORDER[(ORDER.indexOf(sceneId.value) + 1) % ORDER.length];
  play();
}

function choose(id) {
  autoplay.value = false;
  sceneId.value = id;
  play();
}

function replay() {
  autoplay.value = false;
  play();
}

onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Play only while the demo is on screen; start again from the top on return.
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) play();
    else stop();
  });
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  observer.disconnect();
});
</script>

<style scoped>
.count-new {
  background-color: var(--color-brand);
  color: #fff;
}

.segment {
  position: relative;
}

.tabs-scroll {
  scrollbar-width: none;
}

.progress {
  position: absolute;
  inset: auto 0.5rem 0.125rem;
  height: 2px;
  border-radius: 9999px;
  background-color: var(--color-brand);
  transform-origin: left;
  animation: progress linear both;
}

@keyframes progress {
  from {
    transform: scaleX(0);
  }
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.15em;
  background-color: var(--color-brand);
  animation: blink 0.9s steps(1) infinite;
}

/* Pressed down beside the customer's yes. */
.seal {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  border: 1.5px solid currentColor;
  background-color: var(--color-surface);
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-success);
  transform: rotate(-6deg);
}

.ticket {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: var(--color-surface);
  padding: 0.25rem 0.875rem 0.25rem 0.25rem;
  font-size: 0.8125rem;
  white-space: nowrap;
  box-shadow: var(--shadow-lift);
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .arrive {
    animation: arrive 0.45s var(--ease-settle) both;
  }

  /* The stamp comes down from above and lands with a thud. */
  .seal {
    animation: seal 0.45s cubic-bezier(0.5, 0, 0.75, 0) both;
  }

  /* The moment the page is about: the confirmed order lands, lit for a beat
     in pale lime, then settles into an ordinary row. */
  .landed {
    animation:
      arrive 0.5s var(--ease-settle) both,
      lit 2.4s ease-out both;
  }

  .count-new {
    animation: bump 0.4s var(--ease-settle);
  }

  /* The photo is looked at before the agent answers: a line passes over it. */
  .photo::after {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background-color: var(--color-brand);
    opacity: 0;
    animation: scan 1.2s var(--ease-settle) 0.9s both;
  }
}

.photo {
  position: relative;
  overflow: hidden;
}

@keyframes scan {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  15%,
  85% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateY(7rem);
  }
}

@keyframes seal {
  0% {
    opacity: 0;
    transform: rotate(-14deg) scale(2.2);
  }
  70% {
    opacity: 1;
    transform: rotate(-6deg) scale(0.92);
  }
  100% {
    transform: rotate(-6deg);
  }
}

@keyframes bump {
  40% {
    transform: scale(1.15);
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes lit {
  from {
    background-color: var(--color-brand-tint);
  }
  to {
    background-color: transparent;
  }
}

.dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: currentColor;
  animation: blink 1.2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
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
