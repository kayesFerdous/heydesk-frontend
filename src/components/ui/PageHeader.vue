<template>
  <!-- The top of every page: title and one line of help on the left, the
       page's actions on the right, and tabs (if any) underneath. -->
  <header class="px-5 pt-6 sm:px-8 sm:pt-8" :class="{ 'pb-6': !$slots.tabs }">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-[-0.02em] text-balance">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-ink-soft">{{ subtitle }}</p>
        <slot name="subtitle"></slot>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div v-if="$slots.tabs" class="mt-5">
      <slot name="tabs"></slot>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>
