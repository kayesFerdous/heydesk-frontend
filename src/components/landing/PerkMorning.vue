<template>
  <!-- The morning after: the night's work adds itself up as the owner arrives. -->
  <div ref="root" class="morning" :class="{ 'is-on': step >= 1 }" aria-hidden="true">
    <div class="island p-4">
      <p class="mb-3 font-semibold">{{ t('home.needsYou') }}</p>
      <ul class="flex flex-col gap-2">
        <li class="need" style="--i: 0">
          <span class="tile bg-attention-tint text-attention"><PhUserSound :size="20"></PhUserSound></span>
          <span class="min-w-0 flex-1 truncate font-semibold">{{ t('landing.night.people.tanvir') }}</span>
          <StatusChip status="needs_human"></StatusChip>
        </li>
        <li v-for="(order, index) in ORDERS" :key="order.person" class="need" :style="{ '--i': index + 1 }">
          <span class="tile" :class="order.tint">{{ order.initials }}</span>
          <span class="min-w-0 flex-1 truncate font-semibold">{{ t(`landing.night.people.${order.person}`) }}</span>
          <span class="font-semibold">{{ formatMoney(order.amount) }}</span>
        </li>
      </ul>
    </div>
    <div class="island flex flex-col p-5">
      <p class="text-sm text-ink-soft">{{ t('home.figures.taken') }}</p>
      <p class="taken"><RollingNumber :value="step >= 1 ? 1254000 : 0" money></RollingNumber></p>
      <HourBars class="bars mt-5 h-20" :values="HOURS" :label="t('home.figures.taken')"></HourBars>
      <div class="mt-auto flex flex-col gap-2 pt-5 text-sm">
        <p class="flex justify-between gap-2"><span class="text-ink-soft">{{ t('home.figures.ai') }}</span><span class="font-semibold">{{ t('home.figures.ofTotal', { n: formatNumber(9), total: formatNumber(10) }) }}</span></p>
        <p class="flex justify-between gap-2"><span class="text-ink-soft">{{ t('home.figures.handed') }}</span><span class="font-semibold">{{ formatNumber(1) }}</span></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUserSound } from '@phosphor-icons/vue';

import RollingNumber from './RollingNumber.vue';
import HourBars from './HourBars.vue';
import StatusChip from '../ui/StatusChip.vue';
import { useSceneClock } from '../../composables/useSceneClock.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

const ORDERS = [
  { person: 'lamia', initials: 'LC', tint: 'bg-tint-sky', amount: 330000 },
  { person: 'sabbir', initials: 'SH', tint: 'bg-tint-lilac', amount: 191000 },
  { person: 'mim', initials: 'MA', tint: 'bg-tint-sand', amount: 196000 },
];
const HOURS = [1, 3, 1, 2, 1, 0, 1, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 2];

const { t } = useI18n();

const root = ref(null);
const { step } = useSceneClock({ root, times: [200] });
</script>

<style scoped>
.morning {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .morning {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}

.need {
  display: flex;
  height: 3.25rem;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius-card);
  background-color: var(--color-wash);
  padding-inline: 0.625rem 0.875rem;
}

.tile {
  display: grid;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.taken {
  margin-top: 0.25rem;
  font-size: 2.5rem;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
}

@media (prefers-reduced-motion: no-preference) {
  .need {
    opacity: 0;
    transform: translateX(-1.5rem);
    transition:
      opacity 0.4s,
      transform 0.6s var(--ease-settle);
    transition-delay: calc(var(--i) * 90ms);
  }

  .is-on .need {
    opacity: 1;
    transform: none;
  }

  /* Each hour grows from the floor, left to right. */
  .bars :deep(span) {
    transform: scaleY(0);
    transform-origin: 50% 100%;
    transition: transform 0.6s var(--ease-settle);
  }

  .bars :deep(span:nth-child(3n)) {
    transition-delay: 0.1s;
  }

  .bars :deep(span:nth-child(3n + 1)) {
    transition-delay: 0.2s;
  }

  .is-on .bars :deep(span) {
    transform: none;
  }
}
</style>
