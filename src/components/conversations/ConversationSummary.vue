<template>
  <!-- What the chat comes to, pinned above the transcript, so the team reads two
       lines instead of twenty (backend D137). It shows once there is one (it comes
       by itself for a chat waiting for a person, or from the reply box's Summary
       button), and folds away with Hide; the same button brings it back. -->
  <section v-if="shown" class="flex items-start gap-2.5 border-b border-hairline bg-wash px-4 py-2.5 text-sm sm:px-6" aria-live="polite">
    <PhSparkle :size="16" class="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true"></PhSparkle>
    <div class="min-w-0 flex-1">
      <h3 class="text-xs font-semibold text-ink-soft">{{ t('conversations.summary.title') }}</h3>
      <p v-if="summary.loading" class="sr-only">{{ t('conversations.summary.reading') }}</p>
      <div v-if="summary.loading" class="mt-1.5 flex flex-col gap-1.5" aria-hidden="true">
        <div class="skeleton h-3 w-11/12"></div>
        <div class="skeleton h-3 w-2/3"></div>
      </div>
      <p v-else-if="summary.error" class="mt-0.5 text-danger" role="alert">{{ summary.error }}</p>
      <p v-else class="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap text-ink">{{ summary.text }}</p>
    </div>
    <div class="-my-1 flex shrink-0 items-center gap-0.5">
      <button
        v-if="!summary.loading && (behind || summary.error)"
        type="button"
        class="btn btn-quiet btn-sm"
        :title="behind ? t('conversations.summary.behind') : undefined"
        @click="load"
      >
        <PhArrowClockwise :size="16"></PhArrowClockwise>
        {{ t('conversations.summary.refresh') }}
      </button>
      <button
        type="button"
        class="btn btn-quiet btn-sm btn-icon"
        :aria-label="t('conversations.summary.hide')"
        :title="t('conversations.summary.hide')"
        @click="ui.summaryHidden = true"
      >
        <PhCaretUp :size="16"></PhCaretUp>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowClockwise, PhCaretUp, PhSparkle } from '@phosphor-icons/vue';

import { useSummary } from '../../composables/useSummary.js';
import { useUiStore } from '../../stores/ui.js';

const props = defineProps({
  conversation: { type: Object, required: true },
});
const { t } = useI18n();
const ui = useUiStore();

const { summary, worth, behind, load } = useSummary(() => props.conversation);
const shown = computed(() => worth.value && !ui.summaryHidden && Boolean(summary.value));
</script>
