<template>
  <!-- The top of every page, on the grey canvas above its islands: title and
       one line of help on the left, the page's actions on the right, and tabs
       (if any) underneath on a white pill track. -->
  <header class="px-1 pb-5 md:px-3 md:pt-3">
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div class="min-w-0">
        <h1 class="text-[2rem] leading-tight font-extrabold tracking-[-0.03em] text-balance">
          {{ title }}
          <InfoTip v-if="tip" :text="tip" class="ml-0.5 -translate-y-0.5"></InfoTip>
        </h1>
        <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-ink-soft">{{ subtitle }}</p>
        <slot name="subtitle"></slot>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div v-if="$slots.tabs" class="mt-4 [&_.tabs]:inline-flex [&_.tabs]:max-w-full [&_.tabs]:rounded-full [&_.tabs]:bg-surface [&_.tabs]:p-1">
      <slot name="tabs"></slot>
    </div>
  </header>
</template>

<script setup>
import InfoTip from './InfoTip.vue';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // What the page is for, behind an "i" next to the title instead of a paragraph.
  tip: { type: String, default: '' },
});
</script>
