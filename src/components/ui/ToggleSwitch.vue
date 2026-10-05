<template>
  <button
    type="button"
    role="switch"
    class="switch"
    :class="{ 'switch-on': modelValue }"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="knob"></span>
  </button>
</template>

<script>
export default {
  props: {
    modelValue: { type: Boolean, required: true },
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
};
</script>

<style scoped>
.switch {
  position: relative;
  flex-shrink: 0;
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: var(--color-hairline);
  transition: background-color 0.2s var(--ease-settle);
}

.switch-on {
  background-color: var(--color-brand);
}

.switch:disabled {
  opacity: 0.4;
}

.knob {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgb(10 27 61 / 0.25);
  transition: transform 0.2s var(--ease-settle);
}

.switch-on .knob {
  transform: translateX(1.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .switch,
  .knob {
    transition: none;
  }
}
</style>
