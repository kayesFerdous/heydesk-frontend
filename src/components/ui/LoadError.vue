<template>
  <!-- A page could not load. Shows the backend's own sentence and a retry. -->
  <div class="px-5 py-10 sm:px-8" role="alert">
    <p class="flex items-start gap-2 text-sm">
      <PhWarningCircle :size="18" class="mt-px shrink-0 text-danger" />
      <span>
        <span class="text-ink">{{ message }}</span>
        <button type="button" class="link ml-2" @click="$emit('retry')">{{ t('common.tryAgain') }}</button>
      </span>
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhWarningCircle } from '@phosphor-icons/vue';

defineProps({
  message: { type: String, required: true },
});
defineEmits(['retry']);
const { t } = useI18n();
</script>
