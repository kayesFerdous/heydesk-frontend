<template>
  <div class="flex h-full min-h-0 flex-col">
    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
      <div class="flex flex-col gap-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.role === 'user' ? 'justify-start' : 'justify-end'"
        >
          <div
            class="max-w-[85%] rounded-[var(--radius-panel)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            :class="
              message.role === 'user'
                ? 'bg-wash text-ink ring-1 ring-hairline'
                : 'bg-brand-tint text-ink'
            "
          >
            <span v-if="message.text">{{ message.text }}</span>
            <span v-else class="inline-flex gap-1 py-1" aria-label="Typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </span>
          </div>
        </div>

        <p v-if="status" class="text-right text-xs text-ink-soft">{{ status }}</p>

        <div
          v-if="handoff"
          class="rounded-[var(--radius-control)] bg-attention-tint px-4 py-3 text-sm text-attention"
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

    <div class="border-t border-hairline p-4">
      <form class="flex gap-2" @submit.prevent="send">
        <label class="flex-1">
          <span class="sr-only">Type a message</span>
          <input
            ref="input"
            v-model="draft"
            class="field !rounded-full !px-5"
            type="text"
            placeholder="Type a message"
            autocomplete="off"
            :disabled="sending"
          />
        </label>
        <button
          type="submit"
          class="btn btn-primary !w-11 !rounded-full !px-0"
          :disabled="sending || !draft.trim()"
          aria-label="Send message"
        >
          <ph-paper-plane-tilt :size="20" weight="fill"></ph-paper-plane-tilt>
        </button>
      </form>
      <div class="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <span>Test chats are saved like real ones.</span>
        <button type="button" class="font-semibold text-brand hover:underline" @click="restart">
          Start over
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { PhPaperPlaneTilt, PhUserSound } from '@phosphor-icons/vue';

import { fetchChatAgent, streamChat } from '../../api/chat.js';

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
    };
  },
  created() {
    this.start();
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
          open: (data) => (this.conversationId = data.conversation_id),
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
  background-color: var(--color-ink-soft);
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
