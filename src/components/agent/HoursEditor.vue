<template>
  <div class="panel divide-y divide-hairline">
    <div
      v-for="day in DAYS"
      :key="day"
      class="flex min-h-13 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2"
    >
      <span class="w-24 text-sm font-medium" :class="{ 'text-ink-soft': !hours[day] }">{{ t(`days.${day}`) }}</span>

      <ToggleSwitch
        :model-value="!!hours[day]"
        :label="t('hours.openOn', { day: t(`days.${day}`) })"
        @update:model-value="setOpen(day, $event)"
      ></ToggleSwitch>

      <div v-if="hours[day]" class="flex items-center gap-2">
        <input
          class="field !h-9 !w-32"
          type="time"
          :aria-label="t('hours.opens', { day: t(`days.${day}`) })"
          :value="hours[day][0]"
          @input="setTime(day, 0, $event.target.value)"
        />
        <span class="text-sm text-ink-soft">{{ t('hours.to') }}</span>
        <input
          class="field !h-9 !w-32"
          type="time"
          :aria-label="t('hours.closes', { day: t(`days.${day}`) })"
          :value="hours[day][1]"
          @input="setTime(day, 1, $event.target.value)"
        />
      </div>
      <span v-else class="text-sm text-ink-soft">{{ t('hours.closed') }}</span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { DAYS } from '../../lib/hours.js';

// { mon: ["11:00", "22:00"], tue: null, ... }; a new object is emitted on each change.
const hours = defineModel({ type: Object, required: true });
const { t } = useI18n();

function update(key, value) {
  hours.value = { ...hours.value, [key]: value };
}

// Turning a day on starts it at a sensible shop day the owner can change.
function setOpen(key, open) {
  update(key, open ? ['11:00', '22:00'] : null);
}

function setTime(key, index, value) {
  const next = [...hours.value[key]];
  next[index] = value;
  update(key, next);
}
</script>
