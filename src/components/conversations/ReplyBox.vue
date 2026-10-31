<template>
  <!-- The team answers the visitor from here (backend D136). Sending takes the
       chat over, so the agent stays quiet (D135). One card: the reply, and under
       it the AI's help (D137) as small tools: the summary (shown or hidden above
       the transcript, ConversationSummary), a question about the chat (its answer
       shows here) and a draft (it fills the box). Nothing goes to the visitor
       until the team sends it. -->
  <form class="flex flex-col gap-2 border-t border-hairline px-3 py-2.5" @submit.prevent="send">
    <div v-if="asking" class="flex gap-2">
      <input
        ref="questionBox"
        v-model="question"
        class="field !h-8 text-sm"
        maxlength="500"
        :placeholder="t('conversations.assist.askPlaceholder')"
        :aria-label="t('conversations.assist.ask')"
        @keydown.esc="asking = false"
        @keydown.enter.prevent="question.trim() && help('ask')"
      />
      <button type="button" class="btn btn-secondary btn-sm" :disabled="thinking || !question.trim()" @click="help('ask')">
        {{ t('conversations.assist.askSend') }}
      </button>
    </div>

    <div v-if="answer" class="relative max-h-40 overflow-y-auto rounded-[var(--radius-card)] bg-brand-tint px-3 py-2 pr-8 text-sm whitespace-pre-wrap">
      {{ answer }}
      <button type="button" class="absolute top-1.5 right-1.5" :aria-label="t('conversations.assist.dismiss')" @click="answer = ''">
        <PhX :size="14"></PhX>
      </button>
    </div>
    <p v-if="helpError" class="text-sm text-danger" role="alert">{{ helpError }}</p>

    <div
      class="rounded-[var(--radius-card)] border border-line-strong bg-surface transition-[border-color,box-shadow] duration-200 focus-within:border-ink focus-within:ring-4 focus-within:ring-lime/70"
    >
      <textarea
        ref="box"
        v-model="text"
        class="block max-h-40 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-sm leading-relaxed text-ink placeholder:text-ink-soft focus:outline-none"
        rows="1"
        maxlength="2000"
        :placeholder="t('conversations.reply.placeholder')"
        :aria-label="t('conversations.reply.placeholder')"
        @input="grow"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <div class="flex items-center gap-0.5 px-1.5 pb-1.5">
        <button
          v-if="worth"
          type="button"
          class="btn btn-quiet btn-sm !px-2"
          :class="summaryShown ? '!text-ink' : '!text-ink-soft'"
          :aria-pressed="summaryShown"
          :title="summaryShown ? t('conversations.summary.hide') : t('conversations.summary.show')"
          :disabled="summary?.loading"
          @click="toggleSummary"
        >
          <PhSparkle :size="16" :weight="summaryShown ? 'fill' : 'regular'"></PhSparkle>
          <span class="hidden sm:inline">{{ t('conversations.summary.title') }}</span>
        </button>
        <button
          type="button"
          class="btn btn-quiet btn-sm !px-2"
          :class="asking ? '!text-ink' : '!text-ink-soft'"
          :aria-pressed="asking"
          :title="t('conversations.assist.ask')"
          :disabled="thinking"
          @click="toggleAsking"
        >
          <PhQuestion :size="16"></PhQuestion>
          <span class="hidden sm:inline">{{ t('conversations.assist.askShort') }}</span>
        </button>
        <button type="button" class="btn btn-quiet btn-sm !px-2 !text-ink-soft" :title="t('conversations.assist.draft')" :disabled="thinking" @click="help('draft')">
          <PhNotePencil :size="16"></PhNotePencil>
          <span class="hidden sm:inline">{{ t('conversations.assist.draftShort') }}</span>
        </button>
        <span v-if="thinking" class="ml-1 text-xs text-ink-soft">{{ t('conversations.assist.thinking') }}</span>

        <!-- Quiet: the screen's black button is the hand-off's own. -->
        <button type="submit" class="btn btn-secondary btn-sm ml-auto" :disabled="busy || !text.trim()">
          <PhPaperPlaneRight :size="16"></PhPaperPlaneRight>
          {{ t('conversations.reply.send') }}
        </button>
      </div>
    </div>

    <!-- Said only while there is something to send, when it matters. -->
    <p v-if="text.trim()" class="px-1 text-xs text-ink-soft">{{ t('conversations.reply.note') }}</p>
    <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
  </form>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhNotePencil, PhPaperPlaneRight, PhQuestion, PhSparkle, PhX } from '@phosphor-icons/vue';

import { assist } from '../../api/conversations.js';
import { useSummary } from '../../composables/useSummary.js';
import { useUiStore } from '../../stores/ui.js';

const MAX_HEIGHT = 160; // the box grows with the reply up to this, then scrolls

const props = defineProps({
  conversation: { type: Object, required: true },
  busy: { type: Boolean, default: false }, // sending
  error: { type: String, default: null }, // the send's
});
const emit = defineEmits(['send']);
const { t } = useI18n();
const ui = useUiStore();

const box = ref(null);
const questionBox = ref(null);
const text = ref('');
const question = ref('');
const asking = ref(false);
const thinking = ref(false);
const answer = ref(''); // the AI's answer to the team's question
const helpError = ref(null);

const { summary, worth, load: loadSummary } = useSummary(() => props.conversation);
const summaryShown = computed(() => !ui.summaryHidden && Boolean(summary.value));

// The box fits what is typed: one line to start, taller as the reply grows.
function grow() {
  if (!box.value) return;
  box.value.style.height = 'auto';
  box.value.style.height = `${Math.min(box.value.scrollHeight, MAX_HEIGHT)}px`;
}

function toggleSummary() {
  if (summaryShown.value) {
    ui.summaryHidden = true;
    return;
  }
  ui.summaryHidden = false;
  if (!summary.value) loadSummary();
}

async function toggleAsking() {
  asking.value = !asking.value;
  if (asking.value) {
    await nextTick();
    questionBox.value?.focus();
  }
}

// The page clears the box once the reply is sent: `done`.
function send() {
  if (!text.value.trim() || props.busy) return;
  emit('send', text.value.trim(), () => {
    text.value = '';
    if (box.value) box.value.style.height = '';
  });
}

// "ask" shows the answer; "draft" puts the next reply in the box for the team to check.
async function help(kind) {
  const id = props.conversation.id;
  thinking.value = true;
  helpError.value = null;
  try {
    const said = await assist(id, kind, kind === 'ask' ? question.value.trim() : '');
    if (id !== props.conversation.id) return;
    if (kind === 'draft') {
      text.value = said.text;
      await nextTick();
      grow();
    } else {
      answer.value = said.text;
    }
  } catch (err) {
    if (id === props.conversation.id) helpError.value = err.message;
  } finally {
    thinking.value = false;
  }
}

// Another chat opened: a clean box.
watch(
  () => props.conversation.id,
  () => {
    text.value = '';
    question.value = '';
    asking.value = false;
    answer.value = '';
    helpError.value = null;
    if (box.value) box.value.style.height = '';
  },
);
</script>
