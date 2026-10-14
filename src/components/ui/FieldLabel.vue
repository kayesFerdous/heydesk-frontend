<template>
  <!-- A field's label with its help behind an "i", instead of a hint line. -->
  <div class="mb-1.5 flex items-center gap-1.5">
    <label class="label !mb-0" :for="htmlFor">
      <slot></slot>
    </label>
    <InfoTip v-if="tip" :text="tip"></InfoTip>
    <span v-if="$slots.end" class="ml-auto text-xs text-ink-soft"><slot name="end"></slot></span>
  </div>
</template>

<script setup>
import InfoTip from './InfoTip.vue';

defineProps({
  // The input's id (`for` is a reserved word in props).
  htmlFor: { type: String, required: true },
  tip: { type: String, default: '' },
});
</script>
