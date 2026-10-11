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
          <LiveStatus v-if="agent" :label="t('chat.online')" class="mt-0.5"></LiveStatus>
        </div>

        <LanguageSwitch compact></LanguageSwitch>
        <VoiceCall v-if="agent" :public-key="publicKey"></VoiceCall>
      </div>
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

    <div v-else-if="!agent" class="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-5" aria-hidden="true">
      <span class="skeleton h-16 w-3/4"></span>
    </div>

    <AgentChat
      v-else
      class="min-h-0 flex-1"
      :public-key="publicKey"
      :agent="agent"
      :note="t('chat.customerNote')"
    ></AgentChat>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhChatSlash } from '@phosphor-icons/vue';

import AgentChat from '../../components/chat/AgentChat.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import LanguageSwitch from '../../components/ui/LanguageSwitch.vue';
import VoiceCall from '../../components/chat/VoiceCall.vue';
import { fetchChatAgent } from '../../api/chat.js';
import { initials } from '../../lib/group.js';

const route = useRoute();
const { t } = useI18n();

const agent = ref(null);
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
