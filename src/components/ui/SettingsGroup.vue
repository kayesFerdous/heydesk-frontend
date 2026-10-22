<template>
  <!-- One group of settings: its name (and a tip) on the left, its fields on
       the right. On phones the name sits above the fields. -->
  <section class="grid gap-x-8 gap-y-3 border-t border-hairline py-6 first:border-t-0 first:pt-2 md:grid-cols-[11rem_minmax(0,1fr)]">
    <h2 class="section-title self-start text-balance">
      {{ title }}
      <InfoTip v-if="tip" :text="tip" class="ml-0.5 -translate-y-px"></InfoTip>
    </h2>
    <div class="flex min-w-0 flex-col gap-4">
      <slot></slot>
    </div>
  </section>
</template>

<script setup>
import InfoTip from './InfoTip.vue';

defineProps({
  title: { type: String, required: true },
  tip: { type: String, default: '' },
});
</script>
