<template>
  <div class="flex h-full min-h-0 flex-col">
    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
      <div class="flex flex-col gap-3">
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
            <span v-if="message.text">{{ message.text }}</span>
            <span v-else class="inline-flex gap-1 py-1" aria-label="Typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </span>
          </div>
        </div>

        <p v-if="status" class="text-xs text-ink-soft">{{ status }}</p>

        <div
          v-if="handoff"
          class="rounded-[var(--radius-panel)] border border-attention/20 bg-attention-tint px-4 py-3 text-sm text-attention"
          role="status"
        >
          <p class="flex items-center gap-2 font-semibold">
            <ph-user-sound :size="18" weight="bold" class="shrink-0"></ph-user-sound>
            Handed over to a person
          </p>
          <p class="mt-1">{{ handoff.message }}</p>
        </div>
      </div>
    </div>

    <p v-if="error" class="px-5 pb-2 text-sm text-danger" role="alert">{{ error }}</p>

    <div class="border-t border-hairline bg-surface p-4">
      <form class="flex gap-2" @submit.prevent="send">
        <label class="flex-1">
          <span class="sr-only">Type a message</span>
          <input
            ref="input"
            v-model="draft"
            class="field !rounded-full !px-4"
            type="text"
            placeholder="Type a message"
            autocomplete="off"
            :disabled="sending"
          />
        </label>
        <button
          type="submit"
          class="btn btn-primary btn-icon shrink-0 !rounded-full"
          :disabled="sending || !draft.trim()"
          aria-label="Send message"
        >
          <ph-paper-plane-tilt :size="18" weight="fill"></ph-paper-plane-tilt>
        </button>
      </form>
      <div class="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <span>Test chats show up in Conversations like real ones.</span>
        <button type="button" class="link" @click="restart">
          Start over
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { PhPaperPlaneTilt, PhUserSound } from '@phosphor-icons/vue';

import { fetchChatAgent, fetchTeamReplies, streamChat } from '../../api/chat.js';

const TEAM_CHECK_MS = 4000;

export default {
  components: { PhPaperPlaneTilt, PhUserSound },
  props: {
    publicKey: { type: String, required: true },
  },
  data() {
    return {
      messages: [],
      conversationId: null,
      draft: '',
      sending: false,
      status: null,
      handoff: null,
      error: null,
      teamSeen: 0,
      teamTimer: null,
    };
  },
  created() {
    this.start();
  },
  beforeUnmount() {
    clearInterval(this.teamTimer);
  },
  watch: {
    publicKey() {
      this.start();
    },
  },
  methods: {
    // The greeting is shown on load; the first turn stores it (backend D8).
    async start() {
      this.messages = [];
      this.conversationId = null;
      this.teamSeen = 0;
      clearInterval(this.teamTimer);
      this.teamTimer = null;
      this.handoff = null;
      this.status = null;
      this.error = null;
      try {
        const agent = await fetchChatAgent(this.publicKey);
        this.messages.push({ role: 'agent', text: agent.greeting });
      } catch (error) {
        this.error = error.message;
      }
    },
    restart() {
      this.draft = '';
      this.start();
    },
    scrollDown() {
      this.$nextTick(() => {
        const el = this.$refs.scroller;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    // Someone from the business can answer from Telegram; their words show up here.
    watchTeam() {
      if (this.teamTimer) return;
      this.teamTimer = setInterval(this.checkTeam, TEAM_CHECK_MS);
    },
    async checkTeam() {
      const conversationId = this.conversationId;
      if (!conversationId) return;
      try {
        const replies = await fetchTeamReplies(this.publicKey, conversationId);
        if (conversationId !== this.conversationId) return; // started over meanwhile
        replies.slice(this.teamSeen).forEach((text) => this.messages.push({ role: 'agent', text }));
        if (replies.length > this.teamSeen) this.scrollDown();
        this.teamSeen = replies.length;
      } catch (error) {
        // A missed check is fine: the next one catches up.
      }
    },
    async send() {
      const text = this.draft.trim();
      if (!text || this.sending) return;

      this.draft = '';
      this.error = null;
      this.sending = true;
      this.messages.push({ role: 'user', text });
      this.messages.push({ role: 'agent', text: '' });
      const reply = this.messages[this.messages.length - 1];
      this.scrollDown();

      try {
        await streamChat(this.publicKey, text, this.conversationId, {
          open: (data) => {
            this.conversationId = data.conversation_id;
            this.watchTeam();
          },
          status: (data) => (this.status = data.label),
          token: (data) => {
            this.status = null;
            reply.text += data.text;
            this.scrollDown();
          },
          handoff: (data) => (this.handoff = data),
          error: (data) => (this.error = data.message),
        });
      } catch (error) {
        this.error = error.message;
      }

      // An empty reply bubble is worse than none.
      if (!reply.text) {
        this.messages.splice(this.messages.indexOf(reply), 1);
      }
      this.status = null;
      this.sending = false;
      this.scrollDown();
      this.$nextTick(() => this.$refs.input && this.$refs.input.focus());
    },
  },
};
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
