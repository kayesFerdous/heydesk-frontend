<template>
  <!-- Every example on the landing page says it is one, the same way. -->
  <span class="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-soft">
    <PhInfo :size="14" class="shrink-0 text-ink-faint"></PhInfo>
    {{ t('demo.notReal') }}
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhInfo } from '@phosphor-icons/vue';

const { t } = useI18n();
</script>
