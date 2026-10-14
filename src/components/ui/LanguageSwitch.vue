<template>
  <!-- English or Bangla. The choice is remembered in this browser. -->
  <div class="segmented" role="radiogroup" :aria-label="t('common.language')">
    <button
      v-for="option in LOCALES"
      :key="option.code"
      type="button"
      role="radio"
      class="segment flex-1 justify-center"
      :class="{ 'segment-active': locale === option.code }"
      :aria-checked="locale === option.code"
      :aria-label="option.label"
      :lang="option.code"
      @click="setLocale(option.code)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

import { LOCALES, setLocale } from '../../i18n/index.js';

const { t, locale } = useI18n();
</script>
