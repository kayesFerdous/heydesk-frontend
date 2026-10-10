<template>
  <!-- The end of a list that comes a page at a time. Clicking asks the page for
       the next page; if that fails, the backend's sentence shows above it and
       the same button tries again. -->
  <div class="my-4 flex flex-col items-center gap-2 px-5">
    <p v-if="error" class="flex items-center gap-2 text-sm text-ink" role="alert">
      <ph-warning-circle :size="18" class="shrink-0 text-danger"></ph-warning-circle>
      {{ error }}
    </p>
    <button type="button" class="btn btn-quiet" :disabled="loading" @click="$emit('more')">
      {{ loading ? 'Loading...' : 'Show more' }}
    </button>
  </div>
</template>

<script>
import { PhWarningCircle } from '@phosphor-icons/vue';

export default {
  components: { PhWarningCircle },
  props: {
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
  emits: ['more'],
};
</script>
