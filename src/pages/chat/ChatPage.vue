<template>
  <!-- The customer's side: the page a business shares as its chat link. Public,
       no sign-in, no sidebar. The public key in the URL is the whole credential.
       One ruled sheet: who you are talking to, the conversation, the composer.
       Full screen on a phone, a centred page on a laptop. -->
  <div class="flex h-dvh justify-center bg-surface">
    <div class="flex w-full max-w-2xl min-w-0 flex-col bg-wash sm:border-x sm:border-hairline">
      <header v-if="!error" class="flex shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4 py-3">
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
          <LiveStatus v-if="agent" :label="t('chat.online')" class="mt-0.5"></LiveStatus>
        </div>

        <template v-if="agent">
          <button
            type="button"
            class="btn btn-quiet btn-icon shrink-0"
            :aria-label="t('chat.startOver')"
            :title="t('chat.startOver')"
            @click="chat?.restart()"
          >
            <PhArrowCounterClockwise :size="18"></PhArrowCounterClockwise>
          </button>
          <VoiceCall :public-key="publicKey"></VoiceCall>
        </template>
      </header>

      <div v-if="error" class="grid flex-1 place-items-center p-6">
        <div class="max-w-sm text-center" role="alert">
          <span class="mx-auto grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-hover text-ink-soft" aria-hidden="true">
            <PhChatSlash :size="22"></PhChatSlash>
          </span>
          <h2 class="mt-4 text-lg font-semibold tracking-[-0.01em]">{{ errorTitle }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ error.message }}</p>
          <button v-if="canRetry" type="button" class="btn btn-primary mt-5" @click="load">{{ t('common.tryAgain') }}</button>
        </div>
      </div>

      <div v-else-if="!agent" class="flex flex-col items-center gap-3 px-5 py-10" aria-hidden="true">
        <span class="skeleton h-14 w-14 !rounded-full"></span>
        <span class="skeleton h-4 w-40"></span>
        <span class="skeleton h-3.5 w-64"></span>
      </div>

      <AgentChat v-else ref="chat" class="min-h-0 flex-1" :public-key="publicKey" :agent="agent" customer>
        <!-- The business introduces itself above the first message: who
             answers, that it is an AI, and that any language works. -->
        <template #intro>
          <div class="mb-3 flex flex-col items-center border-b border-hairline px-4 pt-4 pb-6 text-center">
            <span class="grid h-14 w-14 place-items-center rounded-full bg-brand-tint text-lg font-semibold text-brand" aria-hidden="true">
              {{ initials(agent.name) }}
            </span>
            <p class="mt-3 font-semibold tracking-[-0.01em]">{{ agent.name }}</p>
            <p class="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">{{ t('chat.intro') }}</p>
            <p class="mt-1 text-sm text-ink-soft">{{ t('chat.callInstead', { call: t('voice.call') }) }}</p>
          </div>
        </template>
      </AgentChat>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowCounterClockwise, PhChatSlash } from '@phosphor-icons/vue';

import AgentChat from '../../components/chat/AgentChat.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import VoiceCall from '../../components/chat/VoiceCall.vue';
import { fetchChatAgent } from '../../api/chat.js';
import { initials } from '../../lib/group.js';

const route = useRoute();
const { t } = useI18n();

const agent = ref(null);
const chat = ref(null);
const error = ref(null);

const publicKey = computed(() => route.params.key);
// A wrong link or a paused business will not fix itself on a retry.
const canRetry = computed(() => error.value && error.value.status !== 404);
const errorTitle = computed(() => {
  if (error.value.code === 'unavailable') return t('chat.unavailable');
  if (error.value.status === 404) return t('chat.badLink');
  return t('chat.couldNotOpen');
});

async function load() {
  agent.value = null;
  error.value = null;
  try {
    agent.value = await fetchChatAgent(publicKey.value);
    document.title = agent.value.name;
  } catch (err) {
    error.value = err;
  }
}

watch(publicKey, load, { immediate: true });
</script>
