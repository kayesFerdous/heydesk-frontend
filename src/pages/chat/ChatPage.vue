<template>
  <!-- The customer's side: the page a business shares as its chat link. Public,
       no sign-in, no sidebar. The public key in the URL is the whole credential. -->
  <div class="flex h-dvh flex-col bg-wash">
    <header v-if="!error" class="border-b border-hairline bg-surface">
      <div class="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 sm:px-5">
        <span
          v-if="agent"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-semibold text-brand"
          aria-hidden="true"
        >
          {{ initials(agent.name) }}
        </span>
        <span v-else class="skeleton h-10 w-10 shrink-0 !rounded-full"></span>

        <div class="min-w-0 flex-1">
          <h1 v-if="agent" class="truncate text-base font-semibold tracking-[-0.01em]">{{ agent.name }}</h1>
          <span v-else class="skeleton block h-4 w-36"></span>
          <live-status v-if="agent" label="Online" class="mt-0.5"></live-status>
        </div>

        <voice-call v-if="agent" :public-key="publicKey"></voice-call>
      </div>
    </header>

    <div v-if="error" class="grid flex-1 place-items-center p-6">
      <div class="max-w-sm text-center" role="alert">
        <span class="mx-auto grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-hover text-ink-soft" aria-hidden="true">
          <ph-chat-slash :size="22"></ph-chat-slash>
        </span>
        <h2 class="mt-4 text-lg font-semibold tracking-[-0.01em]">{{ errorTitle }}</h2>
        <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ error.message }}</p>
        <button v-if="canRetry" type="button" class="btn btn-primary mt-5" @click="load">Try again</button>
      </div>
    </div>

    <div v-else-if="!agent" class="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-5" aria-hidden="true">
      <span class="skeleton h-16 w-3/4"></span>
    </div>

    <agent-chat
      v-else
      class="min-h-0 flex-1"
      :public-key="publicKey"
      :agent="agent"
      note="You are chatting with an AI assistant. Tap Call to talk instead."
    ></agent-chat>
  </div>
</template>

<script>
import { PhChatSlash } from '@phosphor-icons/vue';

import AgentChat from '../../components/chat/AgentChat.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import VoiceCall from '../../components/chat/VoiceCall.vue';
import { fetchChatAgent } from '../../api/chat.js';
import { initials } from '../../lib/group.js';

export default {
  components: { AgentChat, LiveStatus, PhChatSlash, VoiceCall },
  data() {
    return {
      agent: null,
      error: null,
    };
  },
  computed: {
    publicKey() {
      return this.$route.params.key;
    },
    // A wrong link or a paused business will not fix itself on a retry.
    canRetry() {
      return this.error && this.error.status !== 404;
    },
    errorTitle() {
      if (this.error.code === 'unavailable') return 'This chat is not available right now';
      if (this.error.status === 404) return 'This chat link does not work';
      return 'We could not open the chat';
    },
  },
  created() {
    this.load();
  },
  watch: {
    publicKey() {
      this.load();
    },
  },
  methods: {
    initials,
    async load() {
      this.agent = null;
      this.error = null;
      try {
        this.agent = await fetchChatAgent(this.publicKey);
        document.title = this.agent.name;
      } catch (error) {
        this.error = error;
      }
    },
  },
};
</script>
