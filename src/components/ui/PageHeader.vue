<template>
  <!-- The top of every page, on the grey canvas above its islands: one line
       with the title, its "i", a short status (if any), the tabs and the
       page's actions on the right. What the page is for lives behind the "i",
       so the screen's height goes to the work. A page with tabs keeps the whole
       line at the top while it scrolls. On a phone the tabs move to a line of
       their own. -->
  <header
    class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-1 pb-3 md:min-h-[3.25rem] md:px-3 md:pb-2"
    :class="$slots.tabs ? 'sticky top-[var(--sticky-top,0px)] z-20 bg-canvas' : ''"
  >
    <!-- The status gives way before the title does: its own line on a phone, cut short beside the title from 640px. -->
    <div class="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 sm:flex-nowrap">
      <SidebarToggle></SidebarToggle>
      <h1 class="min-w-0 truncate text-xl leading-tight font-semibold tracking-[-0.02em]">{{ title }}</h1>
      <InfoTip v-if="tip" :text="tip" class="-ml-1"></InfoTip>
      <p v-if="subtitle" class="min-w-0 basis-full truncate text-[0.8125rem] text-ink-soft sm:shrink-[8] sm:basis-auto">{{ subtitle }}</p>
    </div>
    <!-- The tabs on a white track, beside the title from 1024px. -->
    <div
      v-if="$slots.tabs"
      class="order-last w-full min-w-0 lg:order-none lg:w-auto [&_.tabs]:inline-flex [&_.tabs]:max-w-full [&_.tabs]:rounded-[0.875rem] [&_.tabs]:bg-surface [&_.tabs]:p-1 [&_.tabs]:shadow-[var(--shadow-lift)]"
    >
      <slot name="tabs"></slot>
    </div>
    <!-- On a phone the actions take a full line of their own, so a search box is full width. -->
    <div v-if="$slots.actions" class="ml-auto flex flex-wrap items-center justify-end gap-2 max-sm:basis-full">
      <slot name="actions"></slot>
    </div>
    <div v-if="$slots.subtitle" class="order-last w-full min-w-0">
      <slot name="subtitle"></slot>
    </div>
  </header>
</template>

<script setup>
import InfoTip from './InfoTip.vue';
import SidebarToggle from '../layout/SidebarToggle.vue';

defineProps({
  title: { type: String, required: true },
  // A few words of status beside the title ("3 of 20 documents"), never a
  // sentence about the page: that is the tip.
  subtitle: { type: String, default: '' },
  // What the page is for, behind an "i" next to the title instead of a paragraph.
  tip: { type: String, default: '' },
});
</script>
