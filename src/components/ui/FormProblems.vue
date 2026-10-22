<template>
  <!-- A save the backend refused: its sentence, then one line per field. -->
  <div
    v-if="message"
    class="mb-6 flex gap-3 rounded-[var(--radius-card)] border border-danger/20 bg-danger-tint px-4 py-3 text-sm"
    role="alert"
  >
    <PhWarningCircle :size="20" class="mt-px shrink-0 text-danger" />
    <div>
      <p class="font-semibold text-danger">{{ message }}</p>
      <ul v-if="problems.length" class="mt-1 list-disc pl-4">
        <li v-for="problem in problems" :key="problem">{{ problem }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { PhWarningCircle } from '@phosphor-icons/vue';

defineProps({
  message: { type: String, default: null },
  problems: { type: Array, default: () => [] },
});
</script>
