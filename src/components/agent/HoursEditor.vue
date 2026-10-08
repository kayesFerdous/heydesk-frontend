<template>
  <div class="panel divide-y divide-hairline">
    <div
      v-for="day in days"
      :key="day.key"
      class="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2"
    >
      <span class="w-24 text-sm font-medium" :class="{ 'text-ink-soft': !modelValue[day.key] }">{{ day.label }}</span>

      <toggle-switch
        :model-value="!!modelValue[day.key]"
        :label="`Open on ${day.label}`"
        @update:model-value="setOpen(day.key, $event)"
      ></toggle-switch>

      <div v-if="modelValue[day.key]" class="flex items-center gap-2">
        <input
          class="field !w-32"
          type="time"
          :aria-label="`${day.label} opens`"
          :value="modelValue[day.key][0]"
          @input="setTime(day.key, 0, $event.target.value)"
        />
        <span class="text-sm text-ink-soft">to</span>
        <input
          class="field !w-32"
          type="time"
          :aria-label="`${day.label} closes`"
          :value="modelValue[day.key][1]"
          @input="setTime(day.key, 1, $event.target.value)"
        />
      </div>
      <span v-else class="text-sm text-ink-soft">Closed</span>
    </div>
  </div>
</template>

<script>
import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { DAYS } from '../../lib/hours.js';

export default {
  components: { ToggleSwitch },
  props: {
    modelValue: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  computed: {
    days() {
      return DAYS;
    },
  },
  methods: {
    setOpen(key, open) {
      // Turning a day on starts it at a sensible shop day the owner can change.
      this.update(key, open ? ['11:00', '22:00'] : null);
    },
    setTime(key, index, value) {
      const next = [...this.modelValue[key]];
      next[index] = value;
      this.update(key, next);
    },
    update(key, value) {
      this.$emit('update:modelValue', { ...this.modelValue, [key]: value });
    },
  },
};
</script>
