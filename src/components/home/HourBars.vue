<template>
  <!-- Today, hour by hour: one bar per hour, the busiest in black. Small on
       Home's figure tiles; with hour labels and a "Now" line on its own. -->
  <figure class="flex flex-col" :aria-label="label">
    <div class="flex min-h-0 flex-1 items-end" :class="large ? 'gap-1 sm:gap-2' : 'gap-[3px]'" aria-hidden="true">
      <div
        v-for="(value, hour) in values"
        :key="hour"
        class="relative flex h-full flex-1 items-end"
        :title="large ? `${hourLabel(hour)}: ${formatNumber(value)}` : undefined"
      >
        <span
          class="block w-full"
          :class="[large ? 'rounded-[0.625rem]' : 'rounded-full', hour === peak ? 'bg-ink' : barClass]"
          :style="{ height: `${Math.max(4, (value / max) * 100)}%` }"
        ></span>
        <span v-if="large && hour === now" class="absolute inset-y-0 left-1/2 -top-5 border-l border-dashed border-ink">
          <span class="absolute -top-0.5 left-0 -translate-x-1/2 -translate-y-full text-xs font-semibold whitespace-nowrap">{{ t('home.now') }}</span>
        </span>
      </div>
    </div>
    <div v-if="large" class="mt-3 flex text-xs text-ink-soft" aria-hidden="true">
      <span
        v-for="(value, hour) in values"
        :key="hour"
        class="flex-1 text-center whitespace-nowrap"
        :class="{ 'max-sm:invisible': hour % 6 !== 0 }"
      >
        {{ hour % 3 === 0 ? hourLabel(hour) : '' }}
      </span>
    </div>
  </figure>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { formatNumber } from '../../lib/format.js';

const props = defineProps({
  values: { type: Array, required: true }, // 24 numbers, 00:00 first
  label: { type: String, required: true }, // what the bars say, for a screen reader
  now: { type: Number, default: -1 }, // the current hour, marked on a large chart
  large: { type: Boolean, default: false },
  barClass: { type: String, default: 'bg-hover' },
});
const { t } = useI18n();

const max = computed(() => Math.max(1, ...props.values));
const peak = computed(() => (Math.max(...props.values) > 0 ? props.values.indexOf(Math.max(...props.values)) : -1));

function hourLabel(hour) {
  return `${formatNumber(hour, { minimumIntegerDigits: 2 })}:${formatNumber(0, { minimumIntegerDigits: 2 })}`;
}
</script>
