<template>
  <!-- A small "i" that shows a line of help on hover, on keyboard focus or on
       a tap, so forms stay short. The help is also the button's description,
       so a screen reader reads it without opening anything. -->
  <span class="inline-flex shrink-0 align-middle">
    <button
      ref="button"
      type="button"
      class="grid h-5 w-5 place-items-center rounded-full text-ink-faint transition-colors hover:text-brand focus-visible:text-brand"
      :aria-label="label || t('common.moreInfo')"
      :aria-describedby="id"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
      @click="open ? hide() : show()"
      @keydown.esc="hide"
    >
      <PhInfo :size="16"></PhInfo>
    </button>
    <!-- Rendered into <body> and fixed to the window: a scrolling form never
         clips it, and a transformed parent (a nudged icon, a page settling in)
         cannot shift it. -->
    <Teleport to="body">
      <span
        v-show="open"
        :id="id"
        role="tooltip"
        class="fixed z-50 w-max max-w-72 rounded-[var(--radius-thumb)] bg-ink px-3 py-2 text-[0.8125rem] leading-snug font-normal text-white shadow-[var(--shadow-float)]"
        :style="place"
      >
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhInfo } from '@phosphor-icons/vue';

defineProps({
  text: { type: String, required: true },
  // What the button is about, for screen readers: "About the greeting".
  label: { type: String, default: '' },
});
const { t } = useI18n();

const id = useId();
const button = ref(null);
const open = ref(false);
const place = ref({});

// Just under the "i", kept inside the window on narrow screens.
function show() {
  const box = button.value.getBoundingClientRect();
  const left = Math.max(12, Math.min(box.left - 8, window.innerWidth - 300));
  place.value = { top: `${box.bottom + 6}px`, left: `${left}px` };
  open.value = true;
}

function hide() {
  open.value = false;
}
</script>
