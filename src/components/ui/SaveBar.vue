<template>
  <!-- Appears at the bottom of a settings form once something has changed, so
       Save is always in reach without a button at the top of every section. -->
  <transition name="save-bar">
    <div v-if="dirty || saving || note" class="sticky bottom-0 z-10 mt-10 -mx-5 sm:-mx-8">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-surface/95 px-5 py-3 backdrop-blur sm:px-8"
      >
        <p class="flex items-center gap-2 text-sm" aria-live="polite">
          <template v-if="dirty || saving">
            <PhPencilSimpleLine :size="16" class="text-ink-soft" />
            <span class="text-ink-soft">{{ t('common.unsavedChanges') }}</span>
          </template>
          <template v-else>
            <PhCheckCircle :size="16" weight="fill" class="text-success" />
            <span>{{ note }}</span>
          </template>
        </p>
        <div v-if="dirty || saving" class="flex gap-2">
          <button type="button" class="btn btn-quiet" :disabled="saving" @click="$emit('discard')">{{ t('common.discard') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('common.saving') : t('common.saveChanges') }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhCheckCircle, PhPencilSimpleLine } from '@phosphor-icons/vue';

defineProps({
  dirty: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  // Shown for a moment after a save: "Saved. Live on the next message."
  note: { type: String, default: '' },
});
defineEmits(['discard']);
const { t } = useI18n();
</script>

<style scoped>
.save-bar-enter-active,
.save-bar-leave-active {
  transition: opacity 0.2s var(--ease-settle), transform 0.2s var(--ease-settle);
}

.save-bar-enter-from,
.save-bar-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .save-bar-enter-active,
  .save-bar-leave-active {
    transition: none;
  }
}
</style>
