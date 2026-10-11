<template>
  <div class="flex h-full min-h-0 flex-col">
    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
      <div class="mx-auto flex max-w-2xl flex-col gap-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-[var(--radius-panel)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            :class="
              message.role === 'user'
                ? 'rounded-tr-sm bg-brand text-white'
                : 'rounded-tl-sm bg-surface text-ink shadow-[var(--shadow-lift)] ring-1 ring-hairline'
            "
          >
            <span v-if="message.text"><template v-for="(part, i) in linkParts(message.text)" :key="i"><a v-if="part.url" :href="part.url" target="_blank" rel="noopener" class="break-all underline">{{ part.text }}</a><template v-else>{{ part.text }}</template></template></span>
            <span v-else class="inline-flex gap-1 py-1" :aria-label="t('chat.typing')">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </span>
          </div>
        </div>

        <p v-if="status" class="text-xs text-ink-soft">{{ status }}</p>

        <div v-if="handoff" class="notice" role="status">
          <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
          <div class="min-w-0">
            <p class="font-semibold text-ink">{{ t('chat.handedOver') }}</p>
            <p class="mt-0.5 text-ink-soft">{{ handoff.message }}</p>
            <p v-if="handoff.phone || handoff.email" class="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium">
              <a v-if="handoff.phone" :href="`tel:${handoff.phone}`" class="link">{{ handoff.phone }}</a>
              <a v-if="handoff.email" :href="`mailto:${handoff.email}`" class="link">{{ handoff.email }}</a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="mx-auto w-full max-w-2xl px-5 pb-2 text-sm text-danger" role="alert">{{ error }}</p>

    <div class="border-t border-hairline bg-surface p-4">
      <div class="mx-auto max-w-2xl">
        <form class="flex gap-2" @submit.prevent="send">
          <label class="flex-1">
            <span class="sr-only">{{ t('chat.typeMessage') }}</span>
            <input
              ref="input"
              v-model="draft"
              class="field !rounded-full !px-4"
              type="text"
              :placeholder="t('chat.typeMessage')"
              autocomplete="off"
              :disabled="sending"
            />
          </label>
          <button
            type="submit"
            class="btn btn-primary btn-icon shrink-0 !rounded-full"
            :disabled="sending || !draft.trim()"
            :aria-label="t('chat.send')"
          >
            <PhPaperPlaneTilt :size="18" weight="fill"></PhPaperPlaneTilt>
          </button>
        </form>
        <div class="mt-2 flex items-center justify-between text-xs text-ink-soft">
          <span>{{ note || t('chat.testNote') }}</span>
          <button type="button" class="link shrink-0 whitespace-nowrap" @click="restart">
            {{ t('chat.startOver') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPaperPlaneTilt, PhUserSound } from '@phosphor-icons/vue';

import { fetchChatAgent, fetchTeamReplies, streamChat } from '../../api/chat.js';
import { linkParts } from '../../lib/format.js';

const TEAM_CHECK_MS = 4000;

const props = defineProps({
  publicKey: { type: String, required: true },
  // The {name, greeting} a page already loaded; without it the chat asks itself.
  agent: { type: Object, default: null },
  // The line under the input; "Test chats show up in Conversations" when left out.
  note: { type: String, default: '' },
});
const { t } = useI18n();

const messages = ref([]);
const conversationId = ref(null);
const draft = ref('');
const sending = ref(false);
const status = ref(null);
const handoff = ref(null);
const error = ref(null);
const scroller = ref(null);
const input = ref(null);
let teamSeen = 0;
let teamTimer = null;

// The greeting is shown on load; the first turn stores it (backend D8).
async function start() {
  messages.value = [];
  conversationId.value = null;
  teamSeen = 0;
  clearInterval(teamTimer);
  teamTimer = null;
  handoff.value = null;
  status.value = null;
  error.value = null;
  try {
    const agent = props.agent || (await fetchChatAgent(props.publicKey));
    messages.value.push({ role: 'agent', text: agent.greeting });
  } catch (err) {
    error.value = err.message;
  }
}

function restart() {
  draft.value = '';
  start();
}

function scrollDown() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  });
}

// Someone from the business can answer from Telegram; their words show up here.
function watchTeam() {
  if (!teamTimer) teamTimer = setInterval(checkTeam, TEAM_CHECK_MS);
}

async function checkTeam() {
  const id = conversationId.value;
  // Nobody is looking at a hidden tab: skip this check, the next visible one catches up.
  if (!id || document.hidden) return;
  try {
    const replies = await fetchTeamReplies(props.publicKey, id);
    if (id !== conversationId.value) return; // started over meanwhile
    replies.slice(teamSeen).forEach((text) => messages.value.push({ role: 'agent', text }));
    if (replies.length > teamSeen) scrollDown();
    teamSeen = replies.length;
  } catch (err) {
    // A missed check is fine: the next one catches up.
  }
}

async function send() {
  const text = draft.value.trim();
  if (!text || sending.value) return;

  draft.value = '';
  error.value = null;
  sending.value = true;
  messages.value.push({ role: 'user', text });
  messages.value.push({ role: 'agent', text: '' });
  // The reactive copy, so streamed text shows up as it arrives.
  const reply = messages.value[messages.value.length - 1];
  scrollDown();

  try {
    await streamChat(props.publicKey, text, conversationId.value, {
      open: (data) => {
        conversationId.value = data.conversation_id;
        watchTeam();
      },
      status: (data) => (status.value = data.label),
      token: (data) => {
        status.value = null;
        reply.text += data.text;
        scrollDown();
      },
      handoff: (data) => (handoff.value = data),
      error: (data) => (error.value = data.message),
    });
  } catch (err) {
    error.value = err.message;
  }

  // An empty reply bubble is worse than none.
  if (!reply.text) messages.value.splice(messages.value.indexOf(reply), 1);
  status.value = null;
  sending.value = false;
  scrollDown();
  nextTick(() => input.value && input.value.focus());
}

watch(() => props.publicKey, start, { immediate: true });
onBeforeUnmount(() => clearInterval(teamTimer));
</script>

<style scoped>
.dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: currentColor;
  animation: blink 1.2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>
