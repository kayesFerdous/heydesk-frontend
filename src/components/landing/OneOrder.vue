<template>
  <!-- How it works, as one message followed from start to finish. The section is
       tall and its contents pin, so the scroll runs the story and rewinds it:
       the customer's phone on the left, HeyDesk's three jobs in the middle, the
       owner's inbox on the right. A phone shows one lane at a time. Under reduced
       motion nothing pins and the whole story shows finished. -->
  <section ref="track" class="story" :class="{ 'is-flat': reduce }">
    <div class="pin">
      <div class="story-grid">
        <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 class="story-title">{{ t('landing.how.title') }}</h2>
          <p class="text-ink-soft">{{ t('landing.how.text') }}</p>
        </div>

        <!-- Four steps; the bars fill with the scroll. -->
        <ol class="steps" aria-hidden="true">
          <li v-for="step in STEPS" :key="step.id" class="step-bar">
            <span class="step-fill" :style="{ transform: `scaleX(${fillOf(step)})` }"></span>
          </li>
        </ol>
        <div class="captions">
          <div v-for="(step, index) in STEPS" :key="step.id" class="caption" :class="{ 'is-on': reduce || current === index }">
            <h3 class="caption-title">{{ t(`landing.how.steps.${step.id}.title`) }}</h3>
            <p class="text-lg text-pretty text-ink-soft">{{ t(`landing.how.steps.${step.id}.text`) }}</p>
          </div>
        </div>

        <div class="lanes">
          <!-- The customer's phone. -->
          <div class="lane lane-phone" :class="{ 'is-front': front === 'customer' }">
            <p class="lane-name"><PhUser :size="16" weight="bold"></PhUser>{{ t('landing.how.lanes.customer') }}</p>
            <div class="chat">
              <p class="flex items-center gap-3 border-b border-hairline px-4 py-3 font-semibold">
                <span class="grid h-8 w-8 place-items-center rounded-full bg-night text-xs text-lime">NT</span>
                <span class="flex-1 truncate">{{ t('landing.try.business') }}</span>
                <span class="text-sm font-medium text-ink-soft tabular-nums">{{ clock }}</span>
              </p>
              <TransitionGroup tag="div" name="said" class="said-list">
                <p v-for="line in said" :key="line.key" class="said" :class="line.mine ? 'mine' : 'theirs'">{{ t(line.text) }}</p>
              </TransitionGroup>
            </div>
          </div>

          <!-- HeyDesk's three jobs. -->
          <div class="lane lane-desk" :class="{ 'is-front': front === 'desk' }">
            <p class="lane-name"><BrandMark mark-only class="desk-mark"></BrandMark>{{ t('landing.how.lanes.desk') }}</p>
            <div class="desk">
              <div class="job" :class="stateOf(1, 2)">
                <p class="job-name">
                  <PhMagnifyingGlass v-if="beat < 2" :size="18"></PhMagnifyingGlass>
                  <PhCheckCircle v-else :size="18" weight="fill"></PhCheckCircle>
                  {{ t('landing.how.jobs.list') }}
                </p>
                <p class="job-line">
                  <span>{{ t('landing.products.cotton') }}, L, White</span>
                  <span>{{ t('landing.how.jobs.left', { n: formatNumber(3) }) }}</span>
                </p>
                <p class="job-line"><span></span><span class="font-semibold text-white">{{ formatMoney(185000) }}</span></p>
              </div>
              <div class="job" :class="stateOf(4, 5)">
                <p class="job-name">
                  <PhCalculator v-if="beat < 5" :size="18"></PhCalculator>
                  <PhCheckCircle v-else :size="18" weight="fill"></PhCheckCircle>
                  {{ t('landing.how.jobs.total') }}
                </p>
                <p class="job-line"><span>{{ t('landing.products.cotton') }}</span><span>{{ formatMoney(185000) }}</span></p>
                <p class="job-line"><span>{{ t('records.delivery') }}</span><span>{{ formatMoney(6000) }}</span></p>
                <p class="job-line job-total"><span>{{ t('records.total') }}</span><RollingNumber :value="beat >= 4 ? 191000 : 0" money></RollingNumber></p>
              </div>
              <div class="job" :class="stateOf(5, 7)">
                <p class="job-name">
                  <PhHourglassMedium v-if="beat < 7" :size="18"></PhHourglassMedium>
                  <PhSealCheck v-else :size="18" weight="fill"></PhSealCheck>
                  {{ beat >= 7 ? t('landing.how.jobs.yesGot') : t('landing.how.jobs.yes') }}
                </p>
              </div>
            </div>
          </div>

          <!-- The owner's inbox. -->
          <div class="lane lane-you" :class="{ 'is-front': front === 'you' }">
            <p class="lane-name"><PhTray :size="16" weight="bold"></PhTray>{{ t('landing.how.lanes.you') }}</p>
            <div class="inbox">
              <p class="flex items-center justify-between border-b border-hairline px-4 py-3 font-semibold">
                {{ t('nav.inbox') }}
                <span v-if="beat >= 8" class="count count-attention pop">{{ formatNumber(1) }}</span>
              </p>
              <Transition name="land" mode="out-in">
                <div v-if="beat >= 8" class="p-4">
                  <div class="landed">
                    <InboxRow :row="order" :time="landedAt"></InboxRow>
                  </div>
                  <div class="details" :class="{ 'is-in': beat >= 9 }">
                    <p class="detail"><span>{{ t('landing.how.you.phone') }}</span><span>01700-000114</span></p>
                    <p class="detail"><span>{{ t('records.delivery') }}</span><span>{{ t('landing.how.you.address') }}</span></p>
                    <p class="proof">
                      <PhSealCheck :size="16" weight="fill"></PhSealCheck>
                      {{ t('records.confirmedShort') }}
                    </p>
                  </div>
                </div>
                <p v-else class="grid flex-1 place-items-center gap-2 p-6 text-center text-ink-soft">
                  <span>
                    <PhMoonStars :size="28" class="mx-auto mb-2 text-ink-faint"></PhMoonStars>
                    {{ t('landing.how.you.empty') }}
                  </span>
                </p>
              </Transition>
            </div>
          </div>

          <!-- What travels between the lanes. -->
          <span class="wire wire-left" aria-hidden="true"></span>
          <span class="wire wire-right" aria-hidden="true"></span>
          <span v-if="trip && !reduce" :key="beat" class="token" :class="trip" aria-hidden="true">
            <template v-if="trip === 'to-you'">O-114</template>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalculator, PhCheckCircle, PhHourglassMedium, PhMagnifyingGlass, PhMoonStars, PhSealCheck, PhTray, PhUser } from '@phosphor-icons/vue';

import InboxRow from './InboxRow.vue';
import RollingNumber from './RollingNumber.vue';
import BrandMark from '../ui/BrandMark.vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatMoney, formatNumber, formatTime } from '../../lib/format.js';

// The story in beats. Each says which lane a phone shows and what, if anything,
// travels between the lanes as it starts.
const BEATS = [
  { lane: 'customer' }, // the question
  { lane: 'desk', trip: 'to-desk' }, // checks the list
  { lane: 'customer', trip: 'to-customer' }, // answers
  { lane: 'customer' }, // the address
  { lane: 'desk', trip: 'to-desk' }, // works out the total
  { lane: 'customer', trip: 'to-customer' }, // reads it back
  { lane: 'customer' }, // yes
  { lane: 'desk', trip: 'to-desk' }, // stamped
  { lane: 'you', trip: 'to-you' }, // lands
  { lane: 'you' }, // with its details
];
const LAST = BEATS.length - 1;
const STEPS = [
  { id: 'list', from: 0, to: 3 },
  { id: 'total', from: 3, to: 6 },
  { id: 'yes', from: 6, to: 8 },
  { id: 'done', from: 8, to: BEATS.length },
];
const LINES = [
  { key: 'ask', from: 0, mine: true, text: 'landing.night.says.sabbir' },
  { key: 'reply', from: 2, text: 'landing.try.asks.size.a' },
  { key: 'address', from: 3, mine: true, text: 'landing.how.says.address' },
  { key: 'readBack', from: 5, text: 'landing.how.says.readBack' },
  { key: 'yes', from: 6, mine: true, text: 'landing.how.says.yes' },
  { key: 'done', from: 8, text: 'landing.how.says.done' },
];

const { t } = useI18n();

const track = ref(null);
const { progress, reduce } = useScrollProgress(track, { pinned: true });

// The last stretch of the scroll holds on the finished order, so it can be read.
const place = computed(() => (Math.min(1, progress.value / 0.92)) * BEATS.length);
const beat = computed(() => Math.min(LAST, Math.floor(place.value)));
const current = computed(() => STEPS.findIndex((step) => beat.value < step.to));
const front = computed(() => BEATS[beat.value].lane);
const trip = computed(() => BEATS[beat.value].trip);
const said = computed(() => LINES.filter((line) => line.from <= beat.value));

const fillOf = ({ from, to }) => Math.min(1, Math.max(0, (place.value - from) / (to - from)));
// A job is waiting, at work or done.
const stateOf = (from, to) => ({ 'is-working': beat.value >= from && beat.value < to, 'is-done': beat.value >= to });

// A minute of the night for every few beats: it all takes moments.
const timeAt = (minutes) => formatTime(new Date(Date.UTC(2026, 0, 1, 23, 47 + minutes)).toISOString(), 'UTC');
const clock = computed(() => timeAt(Math.floor(beat.value / 3)));
const landedAt = computed(() => timeAt(2));

const order = computed(() => ({
  initials: 'SH',
  name: t('landing.night.people.sabbir'),
  code: 'O-114',
  summary: t('landing.products.cotton'),
  amount: formatMoney(191000),
  status: 'new',
}));
</script>

<style scoped>
.story {
  position: relative;
  height: 640svh;
}

.pin {
  position: sticky;
  top: 0;
  display: flex;
  height: 100svh;
  overflow: hidden;
  padding-block: 1.25rem;
}

.story-grid {
  display: flex;
  width: 100%;
  max-width: 90rem;
  min-height: 0;
  flex-direction: column;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

@media (min-width: 640px) {
  .story-grid {
    padding-inline: 2rem;
  }
}

.story-title {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.step-bar {
  height: 0.375rem;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--color-hover);
}

.step-fill {
  display: block;
  height: 100%;
  background-color: var(--color-ink);
  transform-origin: 0 50%;
}

/* All four sit in one place and pass each other. */
.captions {
  position: relative;
  display: grid;
  margin-top: 1.25rem;
}

.caption {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translateY(1rem);
  transition:
    opacity 0.25s,
    transform 0.5s var(--ease-settle);
}

.caption.is-on {
  opacity: 1;
  transform: none;
}

.caption-title {
  font-size: clamp(1.75rem, 1.1rem + 2.2vw, 3rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.caption-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

.caption p {
  margin-top: 0.375rem;
  max-width: 44rem;
}

.lanes {
  position: relative;
  min-height: 0;
  flex: 1;
  margin-top: 1rem;
}

.lane {
  position: absolute;
  inset: 0;
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transform: translateY(1rem);
  transition:
    opacity 0.25s,
    transform 0.5s var(--ease-settle);
}

.lane.is-front {
  opacity: 1;
  transform: none;
}

.lane-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.desk-mark {
  height: 1.25rem;
  width: 1.25rem;
}

@media (min-width: 1024px) {
  .lanes {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 4fr) minmax(0, 5fr);
    gap: 4.5rem;
  }

  .lane,
  .lane.is-front {
    position: static;
    opacity: 1;
    transform: none;
  }
}

.chat,
.desk,
.inbox {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.25rem;
}

.chat,
.inbox {
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
}

.said-list {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.5rem;
  overflow: hidden;
  padding: 1rem;
}

.said {
  flex-shrink: 0;
  max-width: 85%;
  width: fit-content;
  border-radius: 1.125rem;
  padding: 0.5rem 0.875rem;
  line-height: 1.4;
}

.mine {
  align-self: flex-end;
  background-color: var(--color-ink);
  color: #fff;
}

.theirs {
  background-color: var(--color-hover);
}

/* HeyDesk at work: the black panel, the one thing on the page that thinks. */
.desk {
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-night);
  padding: 0.75rem;
  color: var(--color-night-soft);
}

.job {
  border-radius: 0.75rem;
  background-color: var(--color-night-tile);
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  transition: outline-color 0.2s;
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.job-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: color 0.2s;
}

.job-line {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.25rem;
  opacity: 0;
  transform: translateY(0.375rem);
  transition:
    opacity 0.25s,
    transform 0.45s var(--ease-settle);
}

.job-total {
  margin-top: 0.5rem;
  align-items: baseline;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.is-working,
.is-done {
  color: #fff;
}

.is-working {
  outline-color: var(--color-lime);
}

.is-working .job-name,
.is-done .job-name {
  color: var(--color-lime);
}

.is-working .job-line,
.is-done .job-line {
  opacity: 1;
  transform: none;
}

.is-working .job-line:nth-child(3) {
  transition-delay: 0.1s;
}

.is-working .job-line:nth-child(4) {
  transition-delay: 0.2s;
}

/* The owner's side. */
.landed {
  border-radius: var(--radius-card);
  padding: 0.75rem;
  font-size: 0.875rem;
  animation: landed 1.4s var(--ease-settle);
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-hairline);
  padding-top: 0.75rem;
  font-size: 0.875rem;
  opacity: 0;
  transform: translateY(0.5rem);
  transition:
    opacity 0.3s,
    transform 0.5s var(--ease-settle);
}

.details.is-in {
  opacity: 1;
  transform: none;
}

.detail {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-weight: 500;
}

.detail span:first-child {
  font-weight: 400;
  color: var(--color-ink-soft);
}

.proof {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 600;
  color: var(--color-success);
}

/* The lines the message runs along, between the lanes. */
.wire,
.token {
  display: none;
}

@media (min-width: 1024px) {
  .wire {
    position: absolute;
    top: 50%;
    display: block;
    height: 2px;
    width: 4.5rem;
    background-color: var(--color-line-strong);
  }

  /* The lanes are 5, 4 and 5 shares of the room left after the two gaps. */
  .wire-left {
    left: calc((100% - 9rem) * 5 / 14);
  }

  .wire-right {
    right: calc((100% - 9rem) * 5 / 14);
  }

  .token {
    position: absolute;
    top: 50%;
    z-index: 2;
    display: grid;
    height: 1.125rem;
    min-width: 1.125rem;
    place-items: center;
    border-radius: 999px;
    background-color: var(--color-lime);
    box-shadow: 0 0 0 2px var(--color-ink);
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: -0.5rem;
    animation: 0.7s var(--ease-settle) both;
  }

  .token.to-desk {
    left: calc((100% - 9rem) * 5 / 14);
    animation-name: run-right;
  }

  .token.to-customer {
    left: calc((100% - 9rem) * 5 / 14);
    animation-name: run-left;
  }

  /* The finished order itself, carrying its code across. */
  .token.to-you {
    right: calc((100% - 9rem) * 5 / 14 + 4.5rem);
    height: 1.75rem;
    margin-top: -0.8125rem;
    padding-inline: 0.625rem;
    animation-name: run-across;
    animation-duration: 0.9s;
  }
}

@keyframes run-right {
  from {
    opacity: 0;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(3.5rem);
  }
  30%,
  70% {
    opacity: 1;
  }
}

@keyframes run-left {
  from {
    opacity: 0;
    transform: translateX(3.5rem);
  }
  to {
    opacity: 0;
    transform: translateX(0);
  }
  30%,
  70% {
    opacity: 1;
  }
}

@keyframes run-across {
  from {
    opacity: 0;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(4.5rem);
  }
  25%,
  75% {
    opacity: 1;
  }
}

@keyframes landed {
  0%,
  35% {
    background-color: var(--color-lime);
  }
}

.pop {
  animation: pop 0.5s var(--ease-settle);
}

@keyframes pop {
  from {
    transform: scale(1.7);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .said-enter-active {
    animation: said-in 0.45s var(--ease-settle);
  }

  .said-move {
    transition: transform 0.45s var(--ease-settle);
  }

  .said-leave-active {
    position: absolute;
    bottom: 1rem;
    opacity: 0;
  }

  .land-enter-active {
    animation: land-in 0.6s var(--ease-settle);
  }
}

@keyframes said-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}

@keyframes land-in {
  from {
    opacity: 0;
    transform: translateX(-1.5rem);
  }
}

/* Reduced motion: no pin, and everything at its end, one lane under the other. */
.story.is-flat {
  height: auto;
}

.is-flat .pin {
  position: static;
  height: auto;
  padding-block: 3rem;
}

.is-flat .lanes {
  display: grid;
  gap: 1.5rem;
}

.is-flat .lane {
  position: static;
  min-height: 24rem;
  opacity: 1;
  transform: none;
}

.is-flat .caption {
  grid-area: auto;
  margin-bottom: 1rem;
  opacity: 1;
  transform: none;
}

.is-flat .steps {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .caption,
  .lane,
  .job-line,
  .details {
    transition: none;
  }

  .landed,
  .pop {
    animation: none;
  }
}
</style>
