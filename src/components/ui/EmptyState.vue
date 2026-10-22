<template>
  <!-- Nothing to show yet. Says why, and offers the next move in the slot. -->
  <div class="px-5 py-14 sm:px-8">
    <div class="max-w-md">
      <span class="grid h-11 w-11 place-items-center rounded-full bg-brand-tint text-ink" aria-hidden="true">
        <component :is="icon" :size="22"></component>
      </span>
      <h2 class="mt-4 text-lg font-bold tracking-[-0.015em]">{{ title }}</h2>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ text }}</p>
      <div v-if="$slots.default" class="mt-5 flex flex-wrap gap-2">
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
