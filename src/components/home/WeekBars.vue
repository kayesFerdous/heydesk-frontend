<template>
  <!-- The last seven days under the figure that leads Home: one bar a day, today
       in black. A bar shows its day's figure on hover or focus, and a screen
       reader reads the same words. -->
  <figure>
    <figcaption class="flex items-baseline justify-between gap-3 text-[0.8125rem] text-ink-soft">
      {{ t('home.lastSevenDays') }}
      <span class="font-semibold text-ink">{{ total }}</span>
    </figcaption>
    <ol class="mt-2 grid grid-cols-7 gap-1">
      <li v-for="(day, index) in days" :key="day.key" class="group relative flex min-w-0 flex-col items-center" tabindex="0">
        <span class="flex h-14 w-full items-end justify-center" aria-hidden="true">
          <span
            class="block w-full max-w-6 rounded-t-[0.25rem] transition-colors duration-150"
            :class="barClass(day, index)"
            :style="{ height: day.value ? `${Math.max(10, (day.value / max) * 100)}%` : '2px' }"
          ></span>
        </span>
        <span class="mt-1 text-xs" :class="index === lastIndex ? 'font-semibold text-ink' : 'text-ink-soft'" aria-hidden="true">{{ day.label }}</span>
        <span class="pointer-events-none absolute bottom-full z-10 mb-1 rounded-[var(--radius-thumb)] bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-[var(--shadow-float)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
          {{ day.text }}
        </span>
      </li>
    </ol>
  </figure>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  // Seven days, today last: { key, label, value, text } (`text` is the day and its figure in words).
  days: { type: Array, required: true },
  total: { type: String, required: true }, // the week's figure, already formatted
});
const { t } = useI18n();

const max = computed(() => Math.max(1, ...props.days.map((day) => day.value)));
const lastIndex = computed(() => props.days.length - 1);

function barClass(day, index) {
  if (!day.value) return 'bg-hairline';
  return index === lastIndex.value ? 'bg-ink' : 'bg-line-strong group-hover:bg-ink-faint';
}
</script>
