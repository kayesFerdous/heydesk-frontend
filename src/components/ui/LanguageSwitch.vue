<template>
  <!-- English or Bangla. The choice is remembered in this browser. `compact`
       shows "EN" / "বাং" where a header has little room (phones). -->
  <div class="segmented" role="radiogroup" :aria-label="t('common.language')">
    <button
      v-for="option in LOCALES"
      :key="option.code"
      type="button"
      role="radio"
      class="segment flex-1 justify-center"
      :class="{ 'segment-active': locale === option.code, '!px-2': compact }"
      :aria-checked="locale === option.code"
      :aria-label="option.label"
      :lang="option.code"
      @click="setLocale(option.code)"
    >
      {{ compact ? option.short : option.label }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

import { LOCALES, setLocale } from '../../i18n/index.js';

defineProps({
  compact: { type: Boolean, default: false },
});
const { t, locale } = useI18n();
</script>
