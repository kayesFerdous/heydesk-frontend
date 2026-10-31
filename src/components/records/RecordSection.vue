<template>
  <!-- Every part of the open record has the same shape: a small label, then
       what it holds, ruled off from the one before. -->
  <section class="border-t border-hairline px-4 py-4 sm:px-5">
    <h3 class="text-xs font-medium text-ink-soft">{{ label }}</h3>
    <div class="mt-2 text-sm"><slot></slot></div>
  </section>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
});
</script>
