<template>
  <!-- The customer's side: the page a business shares as its chat link. Public,
       no sign-in, no sidebar. The public key in the URL is the whole credential.
       One quiet column: who answers, the conversation, the composer. -->
  <div v-if="error" class="grid h-dvh place-items-center bg-surface p-6">
    <div class="max-w-sm text-center" role="alert">
      <span class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-hover text-ink-soft" aria-hidden="true">
        <PhChatSlash :size="22"></PhChatSlash>
      </span>
      <h1 class="mt-4 text-lg font-semibold tracking-[-0.01em]">{{ errorTitle }}</h1>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ error.message }}</p>
      <button v-if="canRetry" type="button" class="btn btn-primary mt-5" @click="load">{{ t('common.tryAgain') }}</button>
    </div>
  </div>

  <div v-else class="flex h-dvh flex-col bg-surface">
    <!-- Who you are talking to, lined up with the conversation below. -->
    <header class="shrink-0 border-b border-hairline">
      <div class="mx-auto flex max-w-[42rem] items-center gap-2 px-4 py-3 sm:px-6">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span
            v-if="agent"
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-[0.8125rem] font-semibold text-brand"
            aria-hidden="true"
          >
            {{ initials(agent.name) }}
          </span>
          <span v-else class="skeleton h-9 w-9 shrink-0 !rounded-full"></span>
          <h1 v-if="agent" class="truncate text-base font-semibold tracking-[-0.01em]">{{ agent.name }}</h1>
          <span v-else class="skeleton h-4 w-36"></span>
        </div>

        <template v-if="agent">
          <!-- Only once there is something to clear. -->
          <button
            v-if="chat?.started"
            type="button"
            class="btn btn-quiet btn-icon shrink-0"
            :aria-label="t('chat.startOver')"
            :title="t('chat.startOver')"
            @click="chat.restart()"
          >
            <PhArrowCounterClockwise :size="18"></PhArrowCounterClockwise>
          </button>
          <VoiceCall :public-key="publicKey"></VoiceCall>
        </template>
      </div>
    </header>

    <main class="flex min-h-0 flex-1 flex-col">
      <div v-if="!agent" class="mx-auto flex w-full max-w-[42rem] flex-col gap-3 px-4 pt-10 sm:px-6" aria-hidden="true">
        <span class="skeleton h-3.5 w-24"></span>
        <span class="skeleton h-4 w-full max-w-md"></span>
        <span class="skeleton h-4 w-2/3 max-w-sm"></span>
      </div>

      <AgentChat v-else ref="chat" class="min-h-0 flex-1" :public-key="publicKey" :agent="agent" customer>
        <template #intro>
          <p class="mb-8 text-center text-[0.8125rem] leading-relaxed text-balance text-ink-soft">
            {{ t('chat.intro') }}
          </p>
        </template>
      </AgentChat>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowCounterClockwise, PhChatSlash } from '@phosphor-icons/vue';

import AgentChat from '../../components/chat/AgentChat.vue';
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
