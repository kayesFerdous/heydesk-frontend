<template>
  <!-- Every example on the landing page says it is one, the same way. -->
  <span class="inline-flex items-center gap-1.5 text-[0.8125rem]" :class="dark ? 'text-night-soft' : 'text-ink-soft'">
    <PhInfo :size="14" class="shrink-0" :class="dark ? 'text-night-soft' : 'text-ink-faint'"></PhInfo>
    {{ text || t('demo.notReal') }}
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhInfo } from '@phosphor-icons/vue';

defineProps({
  text: { type: String, default: '' },
  dark: { type: Boolean, default: false },
});

const { t } = useI18n();
</script>
