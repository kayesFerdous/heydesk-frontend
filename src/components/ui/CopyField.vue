<template>
  <div>
    <label class="label" :for="id">{{ label }}</label>
    <div class="flex gap-2">
      <input :id="id" class="field min-w-0 flex-1 !bg-wash" type="text" :value="value" readonly @focus="$event.target.select()" />
      <button type="button" class="btn btn-secondary shrink-0" @click="copy">
        <component :is="copied ? 'ph-check' : 'ph-copy'" :size="16" :class="{ 'text-success': copied }"></component>
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
  </div>
</template>

<script>
import { PhCopy, PhCheck } from '@phosphor-icons/vue';

let nextId = 0;

export default {
  components: { PhCopy, PhCheck },
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  emits: ['copied'],
  data() {
    nextId += 1;
    return { id: `copy-field-${nextId}`, copied: false, timer: null };
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    async copy() {
      try {
        await navigator.clipboard.writeText(this.value);
        this.copied = true;
        this.$emit('copied');
        clearTimeout(this.timer);
        this.timer = setTimeout(() => (this.copied = false), 2000);
      } catch (error) {
        // Clipboard blocked: the field is selectable, so the owner can copy by hand.
      }
    },
  },
};
</script>
