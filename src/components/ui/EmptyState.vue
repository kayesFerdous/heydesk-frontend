<template>
  <!-- Nothing to show yet. Says why, and offers the next move in the slot.
       It sits in the middle of whatever holds it (`.empty-state` in main.css). -->
  <div class="empty-state px-5 py-14 sm:px-8">
    <div class="max-w-sm">
      <span class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-wash text-ink-soft" aria-hidden="true">
        <component :is="icon" :size="22"></component>
      </span>
      <h2 class="mt-4 text-lg font-semibold tracking-[-0.015em]">{{ title }}</h2>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ text }}</p>
      <div v-if="$slots.default" class="mt-5 flex flex-wrap justify-center gap-2">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // A Phosphor icon component, e.g. PhTray.
  icon: { type: [Object, Function], required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
});
</script>
