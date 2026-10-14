<template>
  <!-- Whether customers get answers right now. The dot is real state, so it is
       always paired with a word. It stays still: a status is read, not watched. -->
  <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="paused ? 'text-attention' : 'text-success'">
    <span class="h-2 w-2 shrink-0 rounded-full" :class="paused ? 'bg-attention' : 'bg-success'" aria-hidden="true"></span>
    {{ paused ? pausedLabel || t('common.pausedByHeyDesk') : label || t('common.live') }}
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  paused: { type: Boolean, default: false },
  label: { type: String, default: '' }, // "Live" when left out
  pausedLabel: { type: String, default: '' }, // "Paused by HeyDesk" when left out
});
const { t } = useI18n();
</script>
