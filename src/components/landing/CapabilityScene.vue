<template>
  <!-- One small example of the agent at work, played beat by beat while
       `playing` is on. Example data, labelled on the landing page. -->
  <div class="flex h-full flex-col gap-2.5 text-sm leading-relaxed">
    <!-- A customer's photo, matched against the shop's own product photos. -->
    <template v-if="id === 'photo'">
      <span class="photo grid h-28 w-28 place-items-center self-end rounded-[var(--radius-card)] rounded-tr-sm bg-tint-sky" :class="{ scanning: beat === 1 }" role="img" :aria-label="t('demo.photo')">
        <PhTShirt :size="56" weight="duotone"></PhTShirt>
      </span>
      <p class="bubble-them arrive">{{ t('landing.tour.photo.ask') }}</p>

      <div v-if="beat >= 2" class="arrive flex max-w-[88%] flex-col gap-2 self-start">
        <p class="bubble-us">{{ t('landing.tour.photo.reply') }}</p>
        <div class="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface p-2.5 pr-4 ring-1 ring-hairline">
          <span class="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-thumb)] bg-tint-sky" aria-hidden="true">
            <PhTShirt :size="30" weight="duotone"></PhTShirt>
          </span>
          <span class="min-w-0">
            <span class="block font-semibold">{{ t('landing.tour.photo.product') }}</span>
            <span class="block text-ink-soft">{{ formatMoney(125000) }}</span>
            <span class="mt-1.5 flex gap-1" aria-hidden="true">
              <span v-for="size in SIZES" :key="size" class="size" :class="{ 'size-picked': size === 'L' }">{{ size }}</span>
            </span>
          </span>
        </div>
        <p class="flex items-center gap-1.5 px-1 text-xs text-ink-soft">
          <PhImages :size="14" class="shrink-0 text-ink-faint"></PhImages>
          {{ t('landing.tour.photo.source') }}
          <span class="font-medium text-attention">{{ t('landing.tour.photo.left') }}</span>
        </p>
      </div>
      <p v-if="beat >= 3" class="bubble-them arrive">{{ t('landing.tour.photo.yes') }}</p>
    </template>

    <!-- The address picks the delivery area; that area pays first. -->
    <template v-else-if="id === 'delivery'">
      <p class="bubble-them arrive">{{ t('landing.tour.delivery.ask') }}</p>

      <ul v-if="beat >= 1" class="arrive flex flex-col gap-1.5" :aria-label="t('landing.tour.delivery.areas')">
        <li
          v-for="area in AREAS"
          :key="area.key"
          class="area flex items-center gap-3 rounded-[var(--radius-card)] bg-surface px-4 py-2.5 ring-1 ring-hairline"
          :class="{ 'area-picked': area.key === 'outside' && beat >= 2 }"
        >
          <PhTruck :size="18" class="shrink-0 text-ink-faint"></PhTruck>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold">{{ t(`landing.tour.delivery.${area.key}`) }}</span>
            <span class="block text-xs text-ink-soft">{{ t(`landing.tour.delivery.${area.key}Days`) }}</span>
          </span>
          <span class="text-right">
            <span class="block font-semibold">{{ formatMoney(area.charge) }}</span>
            <span v-if="area.payFirst" class="block text-xs text-ink-soft">{{ t('landing.tour.delivery.payFirst') }}</span>
          </span>
        </li>
      </ul>

      <div v-if="beat >= 3" class="arrive mt-1 max-w-[88%] self-start rounded-[var(--radius-card)] bg-surface px-4 py-3 ring-1 ring-hairline">
        <p class="leader"><span>{{ t('landing.tour.delivery.item') }}</span><span>{{ formatMoney(125000) }}</span></p>
        <p class="leader"><span>{{ t('landing.tour.delivery.charge') }}</span><span>{{ formatMoney(12000) }}</span></p>
        <p class="leader mt-1 border-t border-hairline pt-2 font-bold"><span>{{ t('landing.tour.delivery.total') }}</span><span>{{ formatMoney(137000) }}</span></p>
        <p v-if="beat >= 4" class="arrive mt-3 flex items-center gap-2 rounded-full border border-line-strong px-3.5 py-2 font-semibold">
          <PhCreditCard :size="17" class="shrink-0"></PhCreditCard>
          {{ t('landing.tour.delivery.pay', { amount: formatMoney(12000) }) }}
          <span class="ml-auto text-xs font-normal text-ink-soft">{{ t('landing.tour.delivery.payWith') }}</span>
        </p>
      </div>
    </template>

    <!-- A cash order rung, read back and marked confirmed. -->
    <template v-else-if="id === 'calls'">
      <div class="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface px-4 py-3 ring-1 ring-hairline">
        <span class="ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hover" :class="{ ringing: callStatus === 'ringing' }" aria-hidden="true">
          <PhPhone :size="18" weight="bold"></PhPhone>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate font-semibold">Sabbir Rahman</span>
          <span class="block text-xs text-ink-soft"><span class="serial text-xs">O-215</span> · {{ formatMoney(131000) }}</span>
        </span>
        <StatusChip :key="callStatus" :status="callStatus" class="arrive"></StatusChip>
      </div>

      <div v-if="callStatus === 'talking'" class="arrive flex items-center gap-1 self-center py-1" aria-hidden="true">
        <span v-for="n in 12" :key="n" class="wave" :style="{ animationDelay: `${(n % 5) * 0.09}s` }"></span>
      </div>

      <p v-if="beat >= 3" class="bubble-us arrive">{{ t('landing.tour.calls.opening', { code: 'O-215', total: formatMoney(131000) }) }}</p>
      <p v-if="beat >= 4" class="bubble-them arrive">{{ t('landing.tour.calls.yes') }}</p>
      <p v-if="beat >= 5" class="arrive mt-auto flex items-center gap-1.5 px-1 text-xs font-medium text-success">
        <PhSealCheck :size="15" weight="fill" class="shrink-0"></PhSealCheck>
        {{ t('landing.tour.calls.confirmed') }}
      </p>
    </template>

    <!-- A question answered from the owner's own words. -->
    <template v-else-if="id === 'docs'">
      <div class="rounded-[var(--radius-card)] bg-surface px-4 py-3 ring-1 ring-hairline">
        <p class="flex items-center gap-2 border-b border-hairline pb-2 font-semibold">
          <PhFilePdf :size="18" class="shrink-0 text-ink-faint"></PhFilePdf>
          {{ t('landing.tour.docs.file') }}
        </p>
        <ul class="mt-2 flex flex-col gap-0.5 text-[0.8125rem] text-ink-soft">
          <li v-for="n in 4" :key="n" class="mark" :class="{ 'mark-on': beat >= 2 && n <= 2 }" :style="{ '--i': n - 1 }">
            {{ t(`landing.tour.docs.lines.${n - 1}`) }}
          </li>
        </ul>
      </div>
      <p v-if="beat >= 1" class="bubble-them arrive">{{ t('landing.tour.docs.ask') }}</p>
      <div v-if="beat >= 3" class="arrive max-w-[88%] self-start">
        <p class="bubble-us max-w-none">{{ t('landing.tour.docs.reply') }}</p>
        <p class="mt-1.5 flex items-center gap-1.5 px-1 text-xs text-ink-soft">
          <PhFileText :size="14" class="shrink-0 text-ink-faint"></PhFileText>
          {{ t('landing.tour.docs.source') }}
        </p>
      </div>
    </template>

    <!-- The same question in three ways of writing, and the reply follows. -->
    <template v-else-if="id === 'language'">
      <div class="segmented self-start" role="group" :aria-label="t('landing.tour.language.title')">
        <button
          v-for="(lang, index) in LANGUAGES"
          :key="lang"
          type="button"
          class="segment"
          :class="{ 'segment-active': index === langIndex }"
          :aria-pressed="index === langIndex ? 'true' : 'false'"
          @click="pickLanguage(index)"
        >
          {{ t(`landing.tour.language.names.${lang}`) }}
        </button>
      </div>
      <!-- The same bubbles stay; their words scramble into the next language. -->
      <p class="bubble-them mt-2" :lang="LANG_TAGS[currentLang]">{{ shownAsk }}</p>
      <p class="bubble-us" :lang="LANG_TAGS[currentLang]">{{ shownReply }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhCreditCard,
  PhFilePdf,
  PhFileText,
  PhImages,
  PhPhone,
  PhSealCheck,
  PhTShirt,
  PhTruck,
} from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { formatMoney } from '../../lib/format.js';

const props = defineProps({
  id: { type: String, required: true },
  playing: { type: Boolean, default: false },
});

const { t } = useI18n();

// The pause before each beat, in milliseconds (beat 1 waits the first one). A
// scene ends on its last beat and stays there.
const BEATS = {
  photo: [500, 1500, 1500],
  delivery: [800, 900, 1000, 900],
  calls: [900, 1900, 700, 2200, 1300],
  docs: [300, 1000, 1400],
  language: [],
};
const SIZES = ['M', 'L', 'XL'];
const AREAS = [
  { key: 'inside', charge: 6000 },
  { key: 'outside', charge: 12000, payFirst: true },
];
const LANGUAGES = ['en', 'bn', 'banglish'];
// Banglish is Bangla written in English letters, so the browser reads it as English.
const LANG_TAGS = { en: 'en', bn: 'bn', banglish: 'en' };
const CYCLE = 3600;
// How long each line takes to resolve, and how far the reply trails the question.
const SCRAMBLE = 750;
const REPLY_LAG = 300;
// Graphemes, so a Bangla letter and its vowel sign always stay together.
const segmenter = 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const lettersOf = (text) => (segmenter ? [...segmenter.segment(text)].map((piece) => piece.segment) : Array.from(text));
// The blur the new words resolve out of: letters from both scripts.
const GLYPHS = lettersOf('abcdeghijklmnoprstuwyকখগজঝটডতদনপবমরলশসহ');

const beat = ref(0);
const langIndex = ref(0);
const cycling = ref(true);
const currentLang = computed(() => LANGUAGES[langIndex.value]);
const sample = (lang, part) => t(`landing.tour.language.${lang}.${part}`);
const shownAsk = ref(sample('en', 'ask'));
const shownReply = ref(sample('en', 'reply'));

// The call's chip follows the beats: in the queue, ringing, talking, confirmed.
const callStatus = computed(() => {
  if (beat.value >= 5) return 'confirmed';
  if (beat.value >= 2) return 'talking';
  if (beat.value >= 1) return 'ringing';
  return 'queued';
});

let timers = [];
let frame = null;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function stop() {
  timers.forEach(clearTimeout);
  timers = [];
}

function later(ms, fn) {
  timers.push(setTimeout(fn, ms));
}

function play() {
  stop();
  const beats = BEATS[props.id];
  // Without motion, show where the story ends, and leave the languages to a click.
  if (reduce) {
    beat.value = beats.length;
    cycling.value = false;
    return;
  }
  beat.value = 0;
  let at = 0;
  beats.forEach((ms, index) => {
    at += ms;
    later(at, () => (beat.value = index + 1));
  });
  if (props.id === 'language') later(CYCLE, nextLanguage);
}

function nextLanguage() {
  if (!cycling.value) return;
  langIndex.value = (langIndex.value + 1) % LANGUAGES.length;
  later(CYCLE, nextLanguage);
}

function pickLanguage(index) {
  cycling.value = false;
  langIndex.value = index;
}

// Each line settles left to right; the letters not yet settled are random
// ones, picked again every frame, so the words seem to be translated in place.
function scrambleTo(lang) {
  cancelAnimationFrame(frame);
  const lines = [
    { shown: shownAsk, letters: lettersOf(sample(lang, 'ask')), lag: 0 },
    { shown: shownReply, letters: lettersOf(sample(lang, 'reply')), lag: REPLY_LAG },
  ];
  if (reduce) {
    lines.forEach((line) => (line.shown.value = line.letters.join('')));
    return;
  }
  const start = performance.now();
  const draw = (now) => {
    let busy = false;
    for (const { shown, letters, lag } of lines) {
      const progress = Math.min(Math.max((now - start - lag) / SCRAMBLE, 0), 1);
      const settled = Math.floor(progress * letters.length);
      shown.value = letters
        .map((letter, index) => (index < settled || letter === ' ' ? letter : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('');
      if (progress < 1) busy = true;
    }
    if (busy) frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
}

watch(currentLang, scrambleTo);

watch(
  () => props.playing,
  // Without motion every example shows its ending, open or not.
  (on) => (on || reduce ? play() : stop()),
  { immediate: true }
);

onBeforeUnmount(() => {
  stop();
  cancelAnimationFrame(frame);
});
</script>

<style scoped>
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

.photo {
  position: relative;
  overflow: hidden;
}

.size {
  display: grid;
  place-items: center;
  min-width: 1.75rem;
  height: 1.375rem;
  padding-inline: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  font-size: 0.6875rem;
  font-weight: 600;
}

.size-picked {
  border-color: var(--color-brand);
  background-color: var(--color-brand);
  color: #fff;
}

.area {
  transition:
    background-color 0.4s var(--ease-settle),
    box-shadow 0.4s var(--ease-settle);
}

.area-picked {
  background-color: var(--color-brand-tint);
  box-shadow: inset 0 0 0 1px var(--color-brand);
}

/* A receipt line: the words, dotted leaders, the amount. */
.leader {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding-block: 0.125rem;
  font-variant-numeric: tabular-nums;
}

.leader > span:first-child {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}

.leader > span:first-child::after {
  content: '';
  flex: 1;
  border-bottom: 1px dotted var(--color-line-strong);
  transform: translateY(-0.25rem);
}

/* The lines the answer came from light up in pale lime, one after the other. */
.mark {
  border-radius: 0.375rem;
  padding: 0.125rem 0.375rem;
  margin-inline: -0.375rem;
  background-image: linear-gradient(var(--color-brand-tint), var(--color-brand-tint));
  background-repeat: no-repeat;
  background-size: 0% 100%;
  transition:
    background-size 0.6s var(--ease-settle),
    color 0.3s;
  transition-delay: calc(var(--i) * 0.35s);
}

.mark-on {
  background-size: 100% 100%;
  color: var(--color-ink);
}

.wave {
  width: 3px;
  height: 1.25rem;
  border-radius: 9999px;
  background-color: var(--color-success);
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .arrive {
    animation: arrive 0.45s var(--ease-settle) both;
  }

  /* Looking at the photo: a line passes over it, top to bottom. */
  .scanning::after {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background-color: var(--color-brand);
    animation: scan 1.1s var(--ease-settle) both;
  }

  /* Ringing: rings go out from the phone. */
  .ringing {
    animation: ring 1s ease-out infinite;
  }

  /* Talking: a voice, drawn as moving bars. */
  .wave {
    animation: wave 0.9s ease-in-out infinite alternate;
  }
}

@media (prefers-reduced-motion: reduce) {
  .area,
  .mark {
    transition: none;
  }

  .wave {
    transform: scaleY(0.5);
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
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

@keyframes ring {
  from {
    box-shadow: 0 0 0 0 rgb(17 17 17 / 0.25);
  }
  to {
    box-shadow: 0 0 0 12px rgb(17 17 17 / 0);
  }
}

@keyframes wave {
  from {
    transform: scaleY(0.25);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
