<template>
  <!-- The problem, as one night in an owner's messages. The section is tall and
       its contents pin, so the scroll runs the clock: 9 PM to 8 AM, and each
       message lands in the list at its own time, unanswered. Under reduced
       motion nothing pins and every line shows. -->
  <section ref="track" class="night" :class="{ 'is-flat': reduce }">
    <h2 class="sr-only">{{ t('landing.night.title') }}</h2>
    <div class="night-pin">
      <div class="night-grid">
        <div class="flex min-w-0 flex-col">
          <p class="clock" aria-hidden="true">{{ clock }}</p>
          <div class="beats">
            <p v-for="(beat, index) in BEATS" :key="beat.id" class="beat" :class="{ 'is-on': reduce || current === index }">
              {{ t(`landing.night.beats.${beat.id}`, { n: unreadTotal }) }}
            </p>
          </div>
          <ExampleTag dark class="mt-6 hidden lg:inline-flex" :text="t('landing.night.example')"></ExampleTag>
        </div>

        <!-- What the owner's phone holds by then: newest on top, the older ones
             pushed down and off the screen. -->
        <div class="phone" :aria-label="t('landing.night.phone')" role="img">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <p class="text-lg font-semibold">{{ t('landing.night.phoneTitle') }}</p>
            <span class="unread" :class="{ 'is-on': shown > 0 }">{{ t('landing.night.unread', { n: formatNumber(shown) }) }}</span>
          </div>
          <div class="phone-list">
            <ol class="rows" :style="{ transform: `translateY(calc(${shown - MESSAGES.length} * var(--row)))` }">
              <li v-for="(message, index) in NEWEST_FIRST" :key="message.id" class="msg" :class="{ 'is-in': MESSAGES.length - index <= shown, 'is-gone': message.gone }">
                <span class="avatar" :class="message.tint" aria-hidden="true">{{ message.initials }}</span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm font-semibold">{{ t(`landing.night.people.${message.person}`) }}</span>
                    <span class="shrink-0 text-xs text-ink-soft">{{ timeOf(message.at) }}</span>
                  </span>
                  <span class="msg-text">{{ t(`landing.night.says.${message.id}`) }}</span>
                </span>
                <span class="dot" aria-hidden="true"></span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ExampleTag from './ExampleTag.vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatNumber, formatTime } from '../../lib/format.js';

// Minutes since 9 PM, so the night is one straight line.
const NIGHT = 11 * 60 + 5; // 9:00 PM to 8:05 AM
const at = (hour, minute) => ((hour + 24 - 21) % 24) * 60 + minute;

const MESSAGES = [
  { id: 'ritu', person: 'ritu', initials: 'RP', tint: 'bg-tint-sand', at: at(21, 12) },
  { id: 'imran', person: 'imran', initials: 'IK', tint: 'bg-tint-sky', at: at(21, 40) },
  { id: 'tania', person: 'tania', initials: 'TF', tint: 'bg-tint-lilac', at: at(22, 26) },
  { id: 'sabbir', person: 'sabbir', initials: 'SH', tint: 'bg-tint-sky', at: at(23, 47) },
  { id: 'mim', person: 'mim', initials: 'MA', tint: 'bg-tint-sand', at: at(0, 31) },
  { id: 'nusrat', person: 'nusrat', initials: 'NJ', tint: 'bg-tint-lilac', at: at(1, 20) },
  { id: 'tanvir', person: 'tanvir', initials: 'TI', tint: 'bg-tint-sand', at: at(2, 14) },
  { id: 'rafi', person: 'rafi', initials: 'RA', tint: 'bg-tint-sky', at: at(3, 5) },
  { id: 'mehedi', person: 'mehedi', initials: 'MH', tint: 'bg-tint-lilac', at: at(6, 12) },
  { id: 'again', person: 'sabbir', initials: 'SH', tint: 'bg-tint-sky', at: at(7, 2) },
  { id: 'gone', person: 'nusrat', initials: 'NJ', tint: 'bg-tint-lilac', at: at(7, 40), gone: true },
];
const NEWEST_FIRST = [...MESSAGES].reverse();
const unreadTotal = formatNumber(MESSAGES.length);

// What the owner is doing, from this minute of the night.
const BEATS = [
  { id: 'packing', from: 0 },
  { id: 'asleep', from: at(23, 20) },
  { id: 'same', from: at(1, 40) },
  { id: 'morning', from: at(7, 50) },
];

const { t } = useI18n();

const track = ref(null);
const { progress, reduce } = useScrollProgress(track, { pinned: true });

// The last stretch of the scroll holds on the morning, so it can be read.
const minute = computed(() => Math.min(1, progress.value / 0.88) * NIGHT);
const shown = computed(() => MESSAGES.filter((message) => message.at <= minute.value).length);
const current = computed(() => BEATS.findLastIndex((beat) => beat.from <= minute.value));

function timeOf(sinceNine) {
  return formatTime(new Date(Date.UTC(2026, 0, 1, 21, sinceNine)).toISOString(), 'UTC');
}
const clock = computed(() => timeOf(Math.floor(minute.value)));
</script>

<style scoped>
.night {
  height: 300svh;
  background-color: var(--color-night);
  color: #fff;
}

.night-pin {
  position: sticky;
  top: 0;
  display: flex;
  height: 100svh;
  align-items: center;
  overflow: hidden;
}

.night-grid {
  display: grid;
  width: 100%;
  max-width: 76rem;
  height: 100%;
  margin-inline: auto;
  padding: 5rem 1.25rem 0;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .night-grid {
    padding: 0 2rem;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    grid-template-rows: none;
    align-items: center;
    gap: 4rem;
  }
}

.clock {
  font-size: clamp(3.5rem, 1.5rem + 9vw, 9.5rem);
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Bengali digits run wider. */
.clock:lang(bn) {
  font-size: clamp(3rem, 1rem + 7.5vw, 8rem);
  letter-spacing: normal;
}

/* The lines share one place; only the night's current one shows. */
.beats {
  display: grid;
  margin-top: 1.25rem;
}

.beat {
  grid-area: 1 / 1;
  max-width: 34rem;
  font-size: clamp(1.25rem, 1rem + 1.1vw, 2rem);
  line-height: 1.25;
  font-weight: 500;
  letter-spacing: -0.015em;
  text-wrap: pretty;
  opacity: 0;
  transform: translateY(0.75rem);
  transition:
    opacity 0.45s var(--ease-settle),
    transform 0.45s var(--ease-settle);
}

.beat:lang(bn) {
  line-height: 1.45;
  letter-spacing: normal;
}

.beat.is-on {
  opacity: 1;
  transform: none;
}

/* The phone: the white on black is where the eye goes. It runs off the bottom
   of the screen on a phone. */
.phone {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--color-surface);
  color: var(--color-ink);
}

@media (min-width: 1024px) {
  .phone {
    height: min(40rem, 82svh);
    border-radius: 2.25rem;
  }
}

.unread {
  border-radius: var(--radius-stamp);
  background-color: var(--color-attention-tint);
  padding: 0.25rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-attention);
  opacity: 0;
  transition: opacity 0.3s var(--ease-settle);
}

.unread.is-on {
  opacity: 1;
}

.phone-list {
  --row: 4.5rem;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.rows {
  transition: transform 0.55s var(--ease-settle);
}

.msg {
  display: flex;
  height: var(--row);
  align-items: center;
  gap: 0.75rem;
  padding-inline: 1.25rem;
  opacity: 0;
  transition: opacity 0.4s var(--ease-settle);
}

.msg.is-in {
  opacity: 1;
}

.avatar {
  display: grid;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.msg-text {
  display: block;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.is-gone .msg-text {
  color: var(--color-attention);
  font-weight: 600;
}

.dot {
  height: 0.5rem;
  width: 0.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: var(--color-attention-bright);
}

/* Reduced motion: no pin, the lines stacked, the whole list. */
.night.is-flat {
  height: auto;
  padding-block: 6rem;
}

.is-flat .night-pin {
  position: static;
  height: auto;
}

.is-flat .night-grid {
  height: auto;
  padding-top: 0;
}

.is-flat .beats {
  gap: 1rem;
}

.is-flat .beat {
  grid-area: auto;
  transform: none;
}

.is-flat .clock {
  display: none;
}

.is-flat .phone {
  height: auto;
  border-radius: 2.25rem;
}

.is-flat .phone-list {
  overflow: visible;
}

@media (prefers-reduced-motion: reduce) {
  .beat,
  .rows,
  .msg,
  .unread {
    transition: none;
  }
}
</style>
