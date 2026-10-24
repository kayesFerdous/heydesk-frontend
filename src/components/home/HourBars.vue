<template>
  <!-- Today, hour by hour: one bar per hour, the busiest in black. Sits under
       a figure on Home. -->
  <figure class="flex items-end gap-[3px]" :aria-label="label">
    <span
      v-for="(value, hour) in values"
      :key="hour"
      class="block flex-1 rounded-full"
      :class="hour === peak ? 'bg-ink' : barClass"
      :style="{ height: `${Math.max(8, (value / max) * 100)}%` }"
      aria-hidden="true"
    ></span>
  </figure>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  values: { type: Array, required: true }, // 24 numbers, 00:00 first
  label: { type: String, required: true }, // what the bars say, for a screen reader
  barClass: { type: String, default: 'bg-hover' },
});

const max = computed(() => Math.max(1, ...props.values));
const peak = computed(() => (Math.max(...props.values) > 0 ? props.values.indexOf(Math.max(...props.values)) : -1));
</script>
