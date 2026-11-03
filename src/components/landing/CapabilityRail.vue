<template>
  <!-- What else the assistant does, one wide panel each. From 1024px the
       section pins and scrolling down slides the panels sideways; the panel in
       the middle plays its example (CapabilityScene). On a phone the panels
       stand one under the other, each playing while it is on screen. -->
  <section ref="root" class="rail-section" :class="{ 'is-pinned': wide && !reduce }">
    <div class="pin">
      <div class="wrap flex items-end justify-between gap-6">
        <div v-reveal class="max-w-2xl">
          <SplitWords :text="t('landing.tourTitle')" class="rail-title"></SplitWords>
          <p class="mt-4 max-w-xl leading-relaxed text-ink-soft">{{ t('landing.tourText') }}</p>
        </div>
        <!-- Which panel is open, and how far along the row the page is. -->
        <p v-if="wide && !reduce" class="hidden shrink-0 items-center gap-3 text-sm font-semibold tabular-nums lg:flex" aria-hidden="true">
          {{ formatNumber(active + 1) }}
          <span class="rail-line"><span :style="{ transform: `scaleX(${progress})` }"></span></span>
          {{ formatNumber(ITEMS.length) }}
        </p>
      </div>

      <div class="viewport">
        <ol ref="track" class="track" :style="wide && !reduce ? { transform: `translate3d(${-shift}px, 0, 0)` } : null">
          <li
            v-for="(item, index) in ITEMS"
            :key="item.id"
            :ref="(el) => (panels[index] = el)"
            :data-index="index"
            class="panel-card"
            :class="{ 'is-active': index === active }"
          >
            <div class="flex flex-col justify-between gap-6 p-6 sm:p-8">
              <span class="grid h-12 w-12 place-items-center rounded-full" :class="index === active ? 'bg-lime' : 'bg-hover'" aria-hidden="true">
                <component :is="item.icon" :size="22" :weight="index === active ? 'fill' : 'regular'"></component>
              </span>
              <div>
                <h3 class="text-2xl font-semibold tracking-[-0.025em] sm:text-[1.75rem]">{{ t(`landing.tour.${item.id}.title`) }}</h3>
                <p class="mt-3 max-w-sm leading-relaxed text-ink-soft">{{ t(`landing.tour.${item.id}.text`) }}</p>
              </div>
            </div>
            <div class="scene">
              <CapabilityScene :id="item.id" :playing="index === active"></CapabilityScene>
            </div>
          </li>
        </ol>
      </div>
      <p class="wrap mt-4"><ExampleTag></ExampleTag></p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCamera, PhFileText, PhPhoneCall, PhTranslate, PhTruck } from '@phosphor-icons/vue';

import CapabilityScene from './CapabilityScene.vue';
import ExampleTag from './ExampleTag.vue';
import SplitWords from './SplitWords.vue';
import vReveal from '../../directives/reveal.js';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatNumber } from '../../lib/format.js';

// The words are `landing.tour.<id>.*`; CapabilityScene draws each example.
const ITEMS = [
  { id: 'photo', icon: PhCamera },
  { id: 'delivery', icon: PhTruck },
  { id: 'calls', icon: PhPhoneCall },
  { id: 'docs', icon: PhFileText },
  { id: 'language', icon: PhTranslate },
];

const { t } = useI18n();

const root = ref(null);
const track = ref(null);
const panels = [];
const wide = ref(false);
// How far the track can slide: its width less the screen's.
const travel = ref(0);
const { progress, reduce } = useScrollProgress(root, { pinned: true });

const shift = computed(() => progress.value * travel.value);
const active = ref(0);

let wideQuery = null;
let observer = null;

// After the panels have moved into (or out of) their row.
async function measure() {
  wide.value = wideQuery.matches;
  await nextTick();
  travel.value = track.value ? Math.max(0, track.value.scrollWidth - window.innerWidth) : 0;
}

// Pinned, the open panel is the one nearest the middle as the track slides.
watch(progress, (value) => {
  if (wide.value && !reduce) active.value = Math.round(value * (ITEMS.length - 1));
});

// Stacked, the open panel is the one crossing the middle of the screen.
function onCross(entries) {
  if (wide.value && !reduce) return;
  for (const entry of entries) {
    if (entry.isIntersecting) active.value = Number(entry.target.dataset.index);
  }
}

onMounted(() => {
  wideQuery = window.matchMedia('(min-width: 1024px)');
  measure();
  wideQuery.addEventListener('change', measure);
  window.addEventListener('resize', measure);
  observer = new IntersectionObserver(onCross, { rootMargin: '-45% 0px -45% 0px' });
  panels.forEach((panel) => observer.observe(panel));
});

onBeforeUnmount(() => {
  wideQuery.removeEventListener('change', measure);
  window.removeEventListener('resize', measure);
  observer.disconnect();
});
</script>

<style scoped>
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

.rail-section {
  position: relative;
  padding-block: 5rem;
}

.rail-title {
  font-size: clamp(1.75rem, 1.2rem + 1.8vw, 3rem);
  line-height: 1.05;
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.rail-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

.viewport {
  margin-top: 2.5rem;
}

.track {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-inline: 0.75rem;
}

.panel-card {
  display: grid;
  overflow: hidden;
  border-radius: 1.75rem;
  background-color: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-hairline);
}

.scene {
  min-height: 22rem;
  background-color: var(--color-wash);
  padding: 1.25rem;
}

/* Pinned: the section is as tall as the slide is long, and the panels sit in
   one row that the scroll moves sideways. */
.rail-section.is-pinned {
  height: 340vh;
  padding-block: 0;
}

.is-pinned .pin {
  position: sticky;
  top: 0;
  display: flex;
  height: 100dvh;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding-top: 4rem;
}

.is-pinned .viewport {
  overflow: visible;
}

.is-pinned .track {
  width: max-content;
  flex-direction: row;
  gap: 1.25rem;
  /* The first panel lines up with the heading above it. */
  padding-inline: max(2rem, calc((100vw - 76rem) / 2 + 2rem));
  will-change: transform;
}

.is-pinned .panel-card {
  width: min(64rem, 78vw);
  height: min(32rem, calc(100dvh - 17rem));
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  opacity: 0.45;
  transform: scale(0.94);
  transition:
    opacity 0.6s var(--ease-settle),
    transform 0.6s var(--ease-settle);
}

.is-pinned .panel-card.is-active {
  opacity: 1;
  transform: none;
}

.is-pinned .scene {
  min-height: 0;
  margin: 0.75rem;
  border-radius: 1.25rem;
  overflow: hidden;
}

.rail-line {
  position: relative;
  display: block;
  width: 6rem;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background-color: var(--color-line-strong);
}

.rail-line > span {
  position: absolute;
  inset: 0;
  background-color: var(--color-ink);
  transform-origin: left;
}
</style>
