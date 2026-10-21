<template>
  <!-- The 6-digit code we email (backend D93). One real input lies over six
       printed cells, so typing, pasting, the browser's one-time-code autofill,
       Backspace and screen readers all work as they do in any input. The cells
       only show what is in it. -->
  <div class="relative" :class="{ shake: shaking }">
    <input
      :id="id"
      ref="input"
      :value="modelValue"
      class="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :maxlength="LENGTH"
      :aria-invalid="invalid"
      :disabled="disabled"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    />
    <div class="grid grid-cols-6 gap-2" aria-hidden="true">
      <span
        v-for="n in LENGTH"
        :key="n"
        class="cell"
        :class="{
          'cell-filled': modelValue[n - 1],
          'cell-active': focused && n - 1 === activeIndex,
          'cell-invalid': invalid,
          'cell-disabled': disabled,
        }"
      >
        <template v-if="modelValue[n - 1]">{{ modelValue[n - 1] }}</template>
        <span v-else-if="focused && n - 1 === activeIndex" class="caret"></span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const LENGTH = 6;

const props = defineProps({
  modelValue: { type: String, required: true },
  id: { type: String, default: 'code' },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'complete']);

const input = ref(null);
const focused = ref(false);
const shaking = ref(false);
// The cell the next digit goes in; the last one once all six are there.
const activeIndex = computed(() => Math.min(props.modelValue.length, LENGTH - 1));

// Bangla digits (০-৯) count as digits: a Bangla keyboard types them.
function digitsOnly(text) {
  return text
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/\D/g, '')
    .slice(0, LENGTH);
}

function onInput(event) {
  const next = digitsOnly(event.target.value);
  event.target.value = next; // drop anything that was not a digit
  emit('update:modelValue', next);
  if (next.length === LENGTH) emit('complete', next);
}

// A wrong code: a short shake, then the cells empty for another try.
watch(
  () => props.invalid,
  (now) => {
    if (!now) return;
    shaking.value = true;
    setTimeout(() => (shaking.value = false), 400);
  }
);

function focus() {
  input.value?.focus();
}

onMounted(focus);
defineExpose({ focus });
</script>

<style scoped>
/* Each cell is a ruled box like the fields, the digit set as a serial. */
.cell {
  display: grid;
  place-items: center;
  height: 3.25rem;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  font-family: var(--font-serial);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-ink);
  transition:
    border-color 0.2s var(--ease-settle),
    box-shadow 0.2s var(--ease-settle),
    background-color 0.2s var(--ease-settle);
}

.cell-filled {
  border-color: var(--color-ink-faint);
}

.cell-active {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgb(0 74 172 / 0.15);
}

.cell-invalid {
  border-color: var(--color-danger);
  background: var(--color-danger-tint);
}

.cell-invalid.cell-active {
  box-shadow: 0 0 0 3px rgb(194 43 43 / 0.15);
}

.cell-disabled {
  opacity: 0.6;
}

.caret {
  width: 1.5px;
  height: 1.5rem;
  background: var(--color-brand);
}

@media (prefers-reduced-motion: no-preference) {
  .shake {
    animation: shake 0.4s var(--ease-settle);
  }
}

@keyframes shake {
  20% {
    transform: translateX(-6px);
  }
  45% {
    transform: translateX(5px);
  }
  70% {
    transform: translateX(-3px);
  }
}
</style>
