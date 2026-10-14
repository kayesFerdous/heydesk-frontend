<template>
  <!-- The top of every page: title and one line of help on the left, the
       page's actions on the right, and tabs (if any) underneath. -->
  <header class="px-5 pt-6 sm:px-8 sm:pt-9" :class="{ 'pb-6': !$slots.tabs }">
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div class="min-w-0">
        <h1 class="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em] text-balance">
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
    <div v-if="$slots.tabs" class="mt-5 [&_.tabs]:-mx-5 [&_.tabs]:px-5 sm:[&_.tabs]:-mx-8 sm:[&_.tabs]:px-8">
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
