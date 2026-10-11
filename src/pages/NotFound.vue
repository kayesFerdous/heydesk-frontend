<template>
  <div class="grid min-h-dvh place-items-center bg-surface p-6">
    <div class="max-w-sm text-center">
      <BrandMark mark-only class="justify-center"></BrandMark>
      <h1 class="mt-6 text-xl font-semibold tracking-[-0.01em]">{{ t('notFound.title') }}</h1>
      <p class="mt-2 text-sm text-ink-soft">{{ t('notFound.text') }}</p>
      <router-link to="/" class="btn btn-primary mt-6">{{ t('common.goHome') }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

import BrandMark from '../components/ui/BrandMark.vue';

const { t } = useI18n();
</script>
