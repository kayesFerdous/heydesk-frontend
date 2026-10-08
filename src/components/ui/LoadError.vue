<template>
  <!-- A page could not load. Shows the backend's own sentence and a retry. -->
  <div class="px-5 py-10 sm:px-8" role="alert">
    <p class="flex items-start gap-2 text-sm">
      <ph-warning-circle :size="18" class="mt-px shrink-0 text-danger"></ph-warning-circle>
      <span>
        <span class="text-ink">{{ message }}</span>
        <button type="button" class="link ml-2" @click="$emit('retry')">Try again</button>
      </span>
    </p>
  </div>
</template>

<script>
import { PhWarningCircle } from '@phosphor-icons/vue';

export default {
  components: { PhWarningCircle },
  props: {
    message: { type: String, required: true },
  },
  emits: ['retry'],
};
</script>
