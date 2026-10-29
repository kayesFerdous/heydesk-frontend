<template>
  <!-- The team answers the visitor from here (backend D136). Sending takes the
       chat over, so the agent stays quiet (D135). Above it, the AI's help (D137):
       an answer shows here, and a draft fills the box; nothing goes to the
       visitor until the team sends it. The summary sits above the transcript
       (ConversationSummary). -->
  <form class="flex flex-col gap-2 border-t border-hairline p-3 sm:px-6" @submit.prevent="send">
    <div class="flex flex-wrap items-center gap-1.5">
      <button type="button" class="btn btn-quiet btn-sm" :disabled="thinking" @click="asking = !asking">
        <PhQuestion :size="16"></PhQuestion>
        {{ t('conversations.assist.ask') }}
      </button>
      <button type="button" class="btn btn-quiet btn-sm" :disabled="thinking" @click="help('draft')">
        <PhNotePencil :size="16"></PhNotePencil>
        {{ t('conversations.assist.draft') }}
      </button>
      <span v-if="thinking" class="text-xs text-ink-soft">{{ t('conversations.assist.thinking') }}</span>
    </div>

    <div v-if="asking" class="flex gap-2">
      <input
        v-model="question"
        class="field !py-1.5 text-sm"
        maxlength="500"
        :placeholder="t('conversations.assist.askPlaceholder')"
        :aria-label="t('conversations.assist.ask')"
        @keydown.enter.prevent="question.trim() && help('ask')"
      />
      <button type="button" class="btn btn-secondary btn-sm" :disabled="thinking || !question.trim()" @click="help('ask')">
        {{ t('conversations.assist.askSend') }}
      </button>
    </div>

    <div v-if="answer" class="relative rounded-[var(--radius-card)] bg-brand-tint px-3 py-2 pr-8 text-sm whitespace-pre-wrap">
      {{ answer }}
      <button type="button" class="absolute top-1.5 right-1.5" :aria-label="t('common.close')" @click="answer = ''">
        <PhX :size="14"></PhX>
      </button>
    </div>
    <p v-if="helpError" class="text-sm text-danger" role="alert">{{ helpError }}</p>

    <div class="flex items-end gap-2">
      <textarea
        v-model="text"
        class="field min-h-[2.75rem] flex-1 resize-none"
        rows="2"
        maxlength="2000"
        :placeholder="t('conversations.reply.placeholder')"
        :aria-label="t('conversations.reply.placeholder')"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <!-- Quiet: the screen's black button is the hand-off's own. -->
      <button type="submit" class="btn btn-secondary" :disabled="busy || !text.trim()">
        <PhPaperPlaneRight :size="18"></PhPaperPlaneRight>
        {{ t('conversations.reply.send') }}
      </button>
    </div>
    <p class="text-xs text-ink-soft">{{ t('conversations.reply.note') }}</p>
    <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhNotePencil, PhPaperPlaneRight, PhQuestion, PhX } from '@phosphor-icons/vue';

import { assist } from '../../api/conversations.js';

const props = defineProps({
  conversationId: { type: String, required: true },
  busy: { type: Boolean, default: false }, // sending
  error: { type: String, default: null }, // the send's
});
const emit = defineEmits(['send']);
const { t } = useI18n();

const text = ref('');
const question = ref('');
const asking = ref(false);
const thinking = ref(false);
const answer = ref(''); // the AI's answer to the team's question
const helpError = ref(null);

// The page clears the box once the reply is sent: `done`.
function send() {
  if (text.value.trim() && !props.busy) emit('send', text.value.trim(), () => (text.value = ''));
}

// "ask" shows the answer; "draft" puts the next reply in the box for the team to check.
async function help(kind) {
  const id = props.conversationId;
  thinking.value = true;
  helpError.value = null;
  try {
    const said = await assist(id, kind, kind === 'ask' ? question.value.trim() : '');
    if (id !== props.conversationId) return;
    if (kind === 'draft') text.value = said.text;
    else answer.value = said.text;
  } catch (err) {
    if (id === props.conversationId) helpError.value = err.message;
  } finally {
    thinking.value = false;
  }
}

// Another chat opened: a clean box.
watch(
  () => props.conversationId,
  () => {
    text.value = '';
    question.value = '';
    asking.value = false;
    answer.value = '';
    helpError.value = null;
  },
);
</script>
