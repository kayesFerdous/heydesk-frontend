<template>
  <!-- How an order is made, run by the scroll. The section is tall and its
       contents pin to the screen while the visitor scrolls through four
       steps: the customer asks, HeyDesk works the numbers out from the
       shop's own list, the assistant reads the order back word by word with
       those numbers, the customer says yes, and only then does it land in the
       inbox. Scrolling back plays it backwards. Example data, labelled so. -->
  <section ref="root" class="story" :aria-label="t('landing.story.label')">
    <div class="pin">
      <div class="wrap grid w-full items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <!-- The steps. On a wide screen all four, the open one expanded with
             a line filling as it plays; on a phone only the open one. -->
        <div>
          <SplitWords v-reveal :text="t('landing.story.title')" class="story-title"></SplitWords>

          <ol class="mt-8 hidden flex-col lg:flex">
            <li v-for="(id, index) in STEPS" :key="id" class="step" :class="{ 'is-open': step === index, 'is-done': step > index }">
              <button type="button" class="flex w-full items-baseline gap-4 py-4 text-left" :aria-current="step === index ? 'step' : undefined" @click="jump(index)">
                <span class="step-number tabular-nums">{{ formatNumber(index + 1, { minimumIntegerDigits: 2 }) }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block text-xl font-semibold tracking-[-0.02em]">{{ t(`landing.story.steps.${id}.title`) }}</span>
                  <span class="step-text">
                    <span class="block overflow-hidden">
                      <span class="block pt-2 leading-relaxed text-ink-soft">{{ t(`landing.story.steps.${id}.text`) }}</span>
                    </span>
                  </span>
                </span>
              </button>
              <span class="step-line" aria-hidden="true"><span :style="{ transform: `scaleX(${lineOf(index)})` }"></span></span>
            </li>
          </ol>

          <div class="mt-5 lg:hidden">
            <div class="flex gap-1.5" aria-hidden="true">
              <span v-for="(id, index) in STEPS" :key="id" class="step-line flex-1"><span :style="{ transform: `scaleX(${lineOf(index)})` }"></span></span>
            </div>
            <Transition name="swap" mode="out-in">
              <div :key="step" class="mt-4">
                <p class="text-lg font-semibold tracking-[-0.02em]">{{ t(`landing.story.steps.${STEPS[step]}.title`) }}</p>
                <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ t(`landing.story.steps.${STEPS[step]}.text`) }}</p>
              </div>
            </Transition>
          </div>
        </div>

        <!-- The stage: the customer's chat, the sum beside it, the inbox. -->
        <div class="stage" :class="`is-step-${step}`">
          <figure class="chat card" :aria-label="t('demo.customerChat')">
            <header class="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <span class="grid h-9 w-9 place-items-center rounded-full bg-night text-xs font-semibold text-lime" aria-hidden="true">BT</span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold">{{ t('demo.shop.business') }}</span>
                <span class="block text-xs text-ink-soft">{{ t('landing.channels.web.name') }}</span>
              </span>
            </header>
            <div class="flex flex-1 flex-col gap-2.5 overflow-hidden bg-wash p-4 text-sm leading-relaxed">
              <span class="beat photo" :class="{ on: at(0.03) }" role="img" :aria-label="t('demo.photo')">
                <PhTShirt :size="44" weight="duotone"></PhTShirt>
              </span>
              <p class="beat bubble-them" :class="{ on: at(0.06) }">{{ t('demo.shop.asks') }}</p>

              <p v-if="at(0.24) && !at(0.5)" class="flex items-center gap-2 text-xs text-ink-soft">
                <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
                {{ t('landing.story.working') }}
              </p>

              <!-- The read-back arrives word by word with the scroll; its
                   numbers are the lime ones from the sum. -->
              <p v-if="at(0.5)" class="bubble-us">
                <template v-for="(word, index) in reply" :key="index">
                  <template v-if="index < replyShown">
                    <span v-if="word.money" class="number">{{ money[word.money] }}</span>{{ word.text }}{{ ' ' }}
                  </template>
                </template>
                <span v-if="replyShown < reply.length" class="caret" aria-hidden="true"></span>
              </p>
              <p class="beat flex items-center gap-1.5 px-1 text-xs text-ink-soft" :class="{ on: at(0.62) }">
                <PhCalculator :size="14" class="shrink-0 text-ink-faint"></PhCalculator>
                {{ t('demo.shop.source') }}
              </p>

              <div class="beat relative self-end" :class="{ on: at(0.66) }">
                <p class="bubble-them yes">{{ t('demo.shop.yes') }}</p>
                <span class="seal" :class="{ on: at(0.7) }">
                  <PhSealCheck :size="16" weight="fill"></PhSealCheck>
                  {{ t('demo.seal') }}
                </span>
              </div>
            </div>
          </figure>

          <!-- The sum, from the shop's list, never from the AI. -->
          <figure class="ledger card" :aria-label="t('landing.story.ledger')">
            <p class="flex items-center gap-2 text-sm font-semibold">
              <span class="grid h-7 w-7 place-items-center rounded-full bg-lime" aria-hidden="true"><PhCalculator :size="15" weight="bold"></PhCalculator></span>
              {{ t('landing.story.ledger') }}
            </p>
            <ul class="mt-4 flex flex-col gap-1 text-sm">
              <li class="line" :class="{ on: at(0.28) }">
                <span class="min-w-0 flex-1">
                  <span class="block font-medium">{{ t('landing.story.item') }}</span>
                  <span class="block text-xs text-ink-soft">{{ t('landing.story.fromList') }}</span>
                </span>
                <span class="font-semibold tabular-nums">{{ money.price }}</span>
              </li>
              <li class="line" :class="{ on: at(0.34) }">
                <span class="min-w-0 flex-1">
                  <span class="block font-medium">{{ t('landing.story.delivery') }}</span>
                  <span class="block text-xs text-ink-soft">{{ t('landing.story.fromAreas') }}</span>
                </span>
                <span class="font-semibold tabular-nums">{{ money.delivery }}</span>
              </li>
              <li class="line total" :class="{ on: at(0.4) }">
                <span class="flex-1 font-semibold">{{ t('landing.story.total') }}</span>
                <span class="text-2xl font-semibold tracking-[-0.02em] tabular-nums">{{ formatMoney(counted) }}</span>
              </li>
            </ul>
            <p class="mt-4 border-t border-hairline pt-3 text-xs leading-relaxed text-ink-soft">{{ t('landing.story.ledgerNote') }}</p>
          </figure>

          <!-- The inbox: the order lands only after the yes. -->
          <figure class="inbox card" :aria-label="t('demo.yourInbox')">
            <header class="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span class="flex items-center gap-2 text-sm font-semibold">
                <PhTray :size="18" weight="bold"></PhTray>
                {{ t('demo.yourInbox') }}
              </span>
              <span class="count-pill" :class="{ bump: at(0.82) }">{{ t('demo.newCount', { n: formatNumber(at(0.82) ? 1 : 0) }) }}</span>
            </header>
            <ul class="text-sm">
              <li class="landing-row" :class="{ on: at(0.8) }">
                <InboxRow :row="rows[0]" :time="t('landing.handoffNow')"></InboxRow>
              </li>
              <li v-for="row in rows.slice(1)" :key="row.code" class="border-t border-hairline px-4 py-3">
                <InboxRow :row="row" :time="row.time"></InboxRow>
              </li>
            </ul>
            <p class="beat flex items-center gap-1.5 border-t border-hairline px-4 py-3 text-xs font-medium text-success" :class="{ on: at(0.86) }">
              <PhSealCheck :size="15" weight="fill" class="shrink-0"></PhSealCheck>
              {{ t('demo.confirmed') }}
            </p>
          </figure>
        </div>
      </div>
      <p class="wrap mt-4 flex justify-end"><ExampleTag></ExampleTag></p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalculator, PhSealCheck, PhTShirt, PhTray } from '@phosphor-icons/vue';

import ExampleTag from './ExampleTag.vue';
import InboxRow from './InboxRow.vue';
import SplitWords from './SplitWords.vue';
import vReveal from '../../directives/reveal.js';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

const STEPS = ['ask', 'work', 'readBack', 'inbox'];
// The shop's own numbers, in paisa. The total is added up here, never typed.
const PRICE = 125000;
const DELIVERY = 6000;
const TOTAL = PRICE + DELIVERY;

const { t } = useI18n();

const root = ref(null);
const { progress } = useScrollProgress(root, { pinned: true });

const step = computed(() => Math.min(STEPS.length - 1, Math.floor(progress.value * STEPS.length)));
// Is the story at least this far along?
const at = (mark) => progress.value >= mark;
// How far through `from`..`to` the story is, from 0 to 1.
const between = (from, to) => Math.min(1, Math.max(0, (progress.value - from) / (to - from)));
// Each step's line fills while that step plays.
const lineOf = (index) => between(index / STEPS.length, (index + 1) / STEPS.length);

const money = computed(() => ({ price: formatMoney(PRICE), delivery: formatMoney(DELIVERY), total: formatMoney(TOTAL) }));
// The total counts up to itself as the sum is worked out, in whole taka.
const counted = computed(() => Math.round((TOTAL * between(0.4, 0.47)) / 100) * 100);

// The read-back as words. Its numbers come through as {price}, {delivery}
// and {total}, so each one can show as the sum's lime pill; what follows one
// ("{delivery},") stays as text after the pill.
const reply = computed(() =>
  t('landing.story.reply', { price: '{price}', delivery: '{delivery}', total: '{total}' })
    .split(' ')
    .map((word) => {
      const found = word.match(/^\{(\w+)\}(.*)$/);
      return found ? { money: found[1], text: found[2] } : { text: word };
    })
);
const replyShown = computed(() => Math.ceil(reply.value.length * between(0.5, 0.6)));

// The inbox: the new order, then two from earlier in the day.
const rows = computed(() => [
  { initials: 'SR', name: 'Sabbir Rahman', code: 'O-215', amount: formatMoney(TOTAL), status: 'new', summary: t('demo.shop.rows.0') },
  { initials: 'MA', name: 'Mitu Akter', code: 'O-214', amount: formatMoney(249000), status: 'shipped', summary: t('demo.shop.rows.1'), time: t('demo.shop.times.1') },
  { initials: 'RK', name: 'Rahim Khan', code: 'O-213', amount: formatMoney(98000), status: 'delivered', summary: t('demo.shop.rows.2'), time: t('demo.shop.times.2') },
]);

// A step's title scrolls the page to where that step starts playing.
function jump(index) {
  const box = root.value.getBoundingClientRect();
  const travel = box.height - window.innerHeight;
  const top = window.scrollY + box.top + travel * (index / STEPS.length + 0.04);
  window.scrollTo({ top, behavior: 'smooth' });
}
</script>

<style scoped>
/* Tall, so the pinned contents have room to play while the page scrolls. */
.story {
  position: relative;
  height: 460vh;
}

.pin {
  position: sticky;
  top: 0;
  display: flex;
  height: 100dvh;
  flex-direction: column;
  justify-content: center;
  padding-top: 4.5rem;
  padding-bottom: 1rem;
  overflow: hidden;
}

.wrap {
  width: 100%;
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

@media (min-width: 640px) {
  .wrap {
    padding-inline: 2rem;
  }
}

.story-title {
  font-size: clamp(1.75rem, 1.2rem + 1.8vw, 3rem);
  line-height: 1.05;
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.story-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

/* The steps: faint until open; the open one shows its words. */
.step {
  position: relative;
  color: var(--color-ink-faint);
  transition: color 0.4s var(--ease-settle);
}

.step.is-open,
.step.is-done {
  color: var(--color-ink);
}

.step.is-done {
  opacity: 0.55;
}

.step-number {
  font-size: 0.875rem;
  font-weight: 600;
}

.step-text {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.5s var(--ease-settle);
}

.is-open .step-text {
  grid-template-rows: 1fr;
}

.step-line {
  position: relative;
  display: block;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background-color: var(--color-hairline);
}

.step-line > span {
  position: absolute;
  inset: 0;
  background-color: var(--color-ink);
  transform-origin: left;
}

/* The stage: three cards placed over each other, moved by the step. */
.stage {
  position: relative;
  height: min(34rem, calc(100dvh - 19.5rem));
}

.card {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.25rem;
  background-color: var(--color-surface);
  box-shadow:
    0 0 0 1px var(--color-hairline),
    0 30px 60px -30px rgb(17 17 17 / 0.3);
  transition:
    transform 0.8s var(--ease-settle),
    opacity 0.6s var(--ease-settle),
    filter 0.6s var(--ease-settle);
}

.chat {
  inset: 0;
}

.ledger {
  inset: auto 0 0 0;
  padding: 1.25rem;
  opacity: 0;
  transform: translateY(2rem) scale(0.96);
  pointer-events: none;
}

.inbox {
  inset: 10% 0 auto 0;
  opacity: 0;
  transform: translateY(3rem) scale(0.96);
  pointer-events: none;
}

.is-step-1 .ledger {
  opacity: 1;
  transform: none;
}

.is-step-3 .chat {
  opacity: 0.35;
  filter: blur(2px);
  transform: scale(0.94);
}

.is-step-3 .inbox {
  opacity: 1;
  transform: none;
}

/* From 1024px the cards sit side by side: the chat on the left, the sum and
   then the inbox overlapping it on the right. */
@media (min-width: 1024px) {
  .stage {
    height: min(36rem, calc(100dvh - 9rem));
  }

  .chat {
    inset: 0 auto 0 0;
    width: 62%;
  }

  .ledger {
    inset: 14% 0 auto auto;
    width: 46%;
    transform: translateX(2rem) scale(0.96);
  }

  .is-step-2 .ledger {
    opacity: 1;
    transform: translateY(-1rem) scale(0.94);
    filter: saturate(0.6);
  }

  .inbox {
    inset: 18% 0 auto auto;
    width: 58%;
    transform: translateX(3rem) scale(0.96);
  }

  .is-step-3 .chat {
    opacity: 0.5;
    filter: none;
    transform: translateX(-1.5rem) scale(0.96);
  }
}

/* A beat of the chat appears once the story reaches it. */
.beat {
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.4s var(--ease-settle),
    transform 0.4s var(--ease-settle);
}

.beat.on {
  opacity: 1;
  transform: none;
}

.photo {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
  place-items: center;
  align-self: flex-end;
  border-radius: var(--radius-card);
  border-top-right-radius: 0.25rem;
  background-color: var(--color-tint-sky);
}

@media (min-width: 1024px) {
  .photo {
    width: 6rem;
    height: 6rem;
  }
}

.bubble-them,
.bubble-us {
  max-width: 88%;
  border-radius: var(--radius-card);
  padding: 0.625rem 1rem;
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

/* The yes is short: one line, with the seal beside it. */
.yes {
  max-width: none;
  white-space: nowrap;
}

/* A number from the sum, pressed into the reply. */
.number {
  display: inline-block;
  border-radius: 9999px;
  background-color: var(--color-lime);
  padding: 0 0.4em;
  font-weight: 600;
  animation: press 0.45s var(--ease-settle) both;
}

@keyframes press {
  from {
    transform: translateY(-0.6em) scale(1.35);
    opacity: 0;
  }
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 1px;
  vertical-align: -0.125em;
  background-color: var(--color-ink);
  animation: blink 0.9s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

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

/* "Confirmed by the customer" thuds down beside the yes: it speeds up as it
   falls, like a stamp, and stops dead. */
.seal {
  position: absolute;
  right: calc(100% + 0.5rem);
  top: 50%;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: var(--color-success-tint);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-success);
  opacity: 0;
  transform: translateY(-50%) scale(1.8) rotate(-8deg);
  transition:
    opacity 0.2s ease-out,
    transform 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

.seal.on {
  opacity: 1;
  transform: translateY(-50%) rotate(-3deg);
}

/* The sum's lines light up pale lime in turn. */
.line {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: var(--radius-card);
  padding: 0.625rem 0.75rem;
  opacity: 0.3;
  transition:
    opacity 0.4s var(--ease-settle),
    background-color 0.4s var(--ease-settle);
}

.line.on {
  opacity: 1;
  background-color: var(--color-brand-tint);
}

.line.total {
  margin-top: 0.25rem;
  border-top: 1px dashed var(--color-line-strong);
  border-radius: 0;
  background-color: transparent;
}

/* The new order slides in from the chat's side and is lit for a beat. */
.landing-row {
  padding: 0.75rem 1rem;
  opacity: 0;
  transform: translateX(-2rem);
  transition:
    opacity 0.5s var(--ease-settle),
    transform 0.6s var(--ease-settle);
}

.landing-row.on {
  opacity: 1;
  transform: none;
  animation: lit 1.6s ease-out 0.3s both;
}

@keyframes lit {
  from {
    background-color: var(--color-brand-tint);
  }
}

.count-pill {
  border-radius: 9999px;
  background-color: var(--color-hover);
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: background-color 0.3s;
}

.count-pill.bump {
  background-color: var(--color-lime);
  animation: bump 0.4s var(--ease-settle);
}

@keyframes bump {
  40% {
    transform: scale(1.2);
  }
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.25s var(--ease-settle),
    transform 0.25s var(--ease-settle);
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.swap-leave-to {
  opacity: 0;
}

/* Under reduced motion the section is not pinned and shows the finished
   story: the chat, the sum and the inbox one under the other. */
@media (prefers-reduced-motion: reduce) {
  .story {
    height: auto;
  }

  .pin {
    position: static;
    height: auto;
    padding-block: 5rem;
  }

  .stage {
    display: flex;
    height: auto;
    flex-direction: column;
    gap: 1rem;
  }

  .card,
  .is-step-3 .chat {
    position: static;
    width: auto;
    opacity: 1;
    filter: none;
    transform: none;
  }

  .number,
  .caret,
  .dots i,
  .count-pill.bump,
  .landing-row.on {
    animation: none;
  }
}
</style>
