<template>
  <!-- What the chat comes to, pinned above the transcript, so the team reads two
       lines instead of twenty (backend D137). Each one is a model call counted on
       the plan, so it comes by itself only when the visitor waits for a person;
       otherwise the team asks. New lines since offer a fresh one. -->
  <div v-if="count >= MIN_LINES" class="border-b border-hairline">
    <div v-if="!summary && !loading && !error" class="px-4 py-2 sm:px-6">
      <button type="button" class="btn btn-quiet btn-sm" @click="load">
        <PhSparkle :size="16"></PhSparkle>
        {{ t('conversations.summary.ask') }}
      </button>
    </div>

    <section v-else class="flex items-start gap-2.5 bg-wash px-4 py-2.5 text-sm sm:px-6" aria-live="polite">
      <PhSparkle :size="16" class="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true"></PhSparkle>
      <div class="min-w-0 flex-1">
        <h3 class="text-xs font-semibold text-ink-soft">{{ t('conversations.summary.title') }}</h3>
        <p v-if="loading" class="sr-only">{{ t('conversations.summary.reading') }}</p>
        <div v-if="loading" class="mt-1.5 flex flex-col gap-1.5" aria-hidden="true">
          <div class="skeleton h-3 w-11/12"></div>
          <div class="skeleton h-3 w-2/3"></div>
        </div>
        <p v-else-if="error" class="mt-0.5 text-danger" role="alert">{{ error }}</p>
        <p v-else class="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap text-ink">{{ summary.text }}</p>
      </div>
      <button
        v-if="!loading && (behind || error)"
        type="button"
        class="btn btn-quiet btn-sm shrink-0"
        :title="behind ? t('conversations.summary.behind') : undefined"
        @click="load"
      >
        <PhArrowClockwise :size="16"></PhArrowClockwise>
        {{ t('conversations.summary.refresh') }}
      </button>
    </section>
  </div>
</template>

<script>
// Kept for each chat while the page is open, so going back to a chat shows the same summary
// without a new model call: conversation id -> { text, at } (`at`: how many lines it read).
const kept = new Map();
</script>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowClockwise, PhSparkle } from '@phosphor-icons/vue';

import { assist } from '../../api/conversations.js';

// Too short to be worth a summary: the lines are right there.
const MIN_LINES = 4;

const props = defineProps({
  conversation: { type: Object, required: true },
});
const { t } = useI18n();

const summary = ref(null);
const loading = ref(false);
const error = ref(null);
const count = computed(() => props.conversation.count ?? props.conversation.messages.length);
const behind = computed(() => Boolean(summary.value) && summary.value.at < count.value);

async function load() {
  const id = props.conversation.id;
  const at = count.value;
  loading.value = true;
  error.value = null;
  try {
    const { text } = await assist(id, 'summary');
    kept.set(id, { text, at });
    if (props.conversation.id === id) summary.value = kept.get(id);
  } catch (err) {
    if (props.conversation.id === id) error.value = err.message;
  }
  if (props.conversation.id === id) loading.value = false;
}

// Another chat opened: its kept summary, or one by itself when the visitor waits for a person.
watch(
  () => props.conversation.id,
  (id) => {
    summary.value = kept.get(id) ?? null;
    loading.value = false;
    error.value = null;
    if (!summary.value && count.value >= MIN_LINES && props.conversation.status === 'needs_human') load();
  },
  { immediate: true },
);
</script>
