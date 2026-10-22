<template>
  <!-- What the agent can do beyond the demo, one row each. On a wide screen
       the example sits still beside the list and changes as each row passes
       the middle of the screen; on a phone each row carries its own. -->
  <div class="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
    <ol class="tour relative">
      <!-- How far through the list you are: the rail fills to the open row. -->
      <span class="rail" aria-hidden="true">
        <span class="rail-fill" :style="{ transform: `scaleY(${(active + 1) / ITEMS.length})` }"></span>
      </span>

      <li
        v-for="(item, index) in ITEMS"
        :key="item.id"
        :ref="(el) => (rows[index] = el)"
        :data-index="index"
        class="tour-row relative flex gap-5 py-8 lg:min-h-[56vh] lg:items-center lg:py-0"
        :class="{ 'is-active': index === active }"
      >
        <span class="tour-mark" aria-hidden="true">
          <component :is="item.icon" :size="18" :weight="index === active ? 'fill' : 'regular'"></component>
        </span>
        <div class="min-w-0 flex-1">
          <h3 class="text-xl font-bold tracking-[-0.02em]">
            <button type="button" class="text-left" :aria-current="index === active ? 'step' : undefined" @click="open(index)">
              {{ t(`landing.tour.${item.id}.title`) }}
            </button>
          </h3>
          <p class="mt-2 max-w-md leading-relaxed text-ink-soft">{{ t(`landing.tour.${item.id}.text`) }}</p>

          <!-- Full width under the text: it pulls back over the marker's column. -->
          <div v-if="!wide" class="scene-frame mt-5 -ml-[3.75rem]">
            <CapabilityScene :id="item.id" :playing="index === active"></CapabilityScene>
          </div>
        </div>
      </li>
    </ol>

    <div v-if="wide" class="relative">
      <div class="sticky top-[calc(50vh-15rem)]">
        <div class="scene-frame h-[30rem]">
          <Transition name="swap" mode="out-in">
            <CapabilityScene :id="ITEMS[active].id" :key="ITEMS[active].id" playing></CapabilityScene>
          </Transition>
        </div>
        <p class="mt-3 px-1 text-[0.8125rem] text-ink-soft">{{ t('demo.notReal') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCamera, PhFileText, PhPhoneCall, PhTranslate, PhTruck } from '@phosphor-icons/vue';

import CapabilityScene from './CapabilityScene.vue';

// The words are `landing.tour.<id>.*`; CapabilityScene draws each example.
const ITEMS = [
  { id: 'photo', icon: PhCamera },
  { id: 'delivery', icon: PhTruck },
  { id: 'calls', icon: PhPhoneCall },
  { id: 'docs', icon: PhFileText },
  { id: 'language', icon: PhTranslate },
];

const { t } = useI18n();

const rows = [];
const active = ref(0);
const wide = ref(false);

let observer = null;
let wideQuery = null;

function onWide() {
  wide.value = wideQuery.matches;
}

// A row is open while it crosses the middle of the screen.
function onCross(entries) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    active.value = Number(entry.target.dataset.index);
  }
}

function open(index) {
  active.value = index;
  rows[index].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

onMounted(() => {
  wideQuery = window.matchMedia('(min-width: 1024px)');
  onWide();
  wideQuery.addEventListener('change', onWide);

  observer = new IntersectionObserver(onCross, { rootMargin: '-45% 0px -45% 0px' });
  rows.forEach((row) => observer.observe(row));
});

onBeforeUnmount(() => {
  observer.disconnect();
  wideQuery.removeEventListener('change', onWide);
});
</script>

<style scoped>
/* The rail runs through the row markers, behind them. */
.rail {
  position: absolute;
  top: 3rem;
  bottom: 3rem;
  left: calc(1.25rem - 0.5px);
  width: 1px;
  background-color: var(--color-hairline);
}

.rail-fill {
  position: absolute;
  inset: 0;
  background-color: var(--color-brand);
  transform-origin: top;
  transition: transform 0.6s var(--ease-settle);
}

.tour-mark {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
  color: var(--color-ink-soft);
  transition:
    background-color 0.3s var(--ease-settle),
    border-color 0.3s var(--ease-settle),
    color 0.3s var(--ease-settle),
    transform 0.3s var(--ease-settle);
}

/* Lime is "you are here": the row the example on the right belongs to. */
.is-active .tour-mark {
  border-color: var(--color-brand);
  background-color: var(--color-lime);
  color: var(--color-ink);
  transform: scale(1.08);
}

@media (min-width: 1024px) {
  .tour-row {
    opacity: 0.4;
    transition: opacity 0.4s var(--ease-settle);
  }

  .tour-row.is-active,
  .tour-row:hover {
    opacity: 1;
  }

  .tour-mark {
    align-self: center;
  }
}

.scene-frame {
  overflow: hidden;
  border-radius: var(--radius-card);
  background-color: var(--color-wash);
  padding: 1.25rem;
  min-height: 20rem;
}

/* One example gives way to the next: out quickly, in a touch slower. */
.swap-enter-active {
  transition:
    opacity 0.35s var(--ease-settle),
    transform 0.35s var(--ease-settle),
    filter 0.35s var(--ease-settle);
}

.swap-leave-active {
  transition:
    opacity 0.15s ease-in,
    filter 0.15s ease-in;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(4px);
}

.swap-leave-to {
  opacity: 0;
  filter: blur(4px);
}

@media (prefers-reduced-motion: reduce) {
  .rail-fill,
  .tour-mark,
  .tour-row,
  .swap-enter-active,
  .swap-leave-active {
    transition: none;
  }

  .swap-enter-from {
    transform: none;
    filter: none;
  }
}
</style>
