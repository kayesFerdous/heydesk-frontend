<template>
  <!-- A figure whose digits roll like a meter, in the chosen language's digits. -->
  <span class="rolling">
    <template v-for="(part, index) in parts" :key="parts.length - index">
      <span v-if="part.digit < 0">{{ part.text }}</span>
      <span v-else class="column">
        <span class="digits" :style="{ transform: `translateY(${-part.digit * 10}%)` }">
          <span v-for="digit in DIGITS" :key="digit">{{ digit }}</span>
        </span>
      </span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { formatMoney, formatNumber } from '../../lib/format.js';

const props = defineProps({
  value: { type: Number, required: true },
  money: { type: Boolean, default: false },
});

const { locale } = useI18n();

const DIGITS = computed(() => (locale.value, Array.from({ length: 10 }, (_, digit) => formatNumber(digit))));
const parts = computed(() => {
  const text = props.money ? formatMoney(props.value) : formatNumber(props.value);
  return [...text].map((char) => ({ text: char, digit: DIGITS.value.indexOf(char) }));
});
</script>

<style scoped>
.rolling {
  display: inline-flex;
  font-variant-numeric: tabular-nums;
}

.column {
  display: inline-block;
  height: 1.15em;
  overflow: hidden;
  line-height: 1.15;
}

.digits {
  display: flex;
  flex-direction: column;
  transition: transform 0.8s var(--ease-settle);
}

@media (prefers-reduced-motion: reduce) {
  .digits {
    transition: none;
  }
}
</style>
