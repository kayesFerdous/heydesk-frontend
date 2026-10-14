<template>
  <!-- The customer's side: the page a business shares as its chat link. Public,
       no sign-in, no sidebar. The public key in the URL is the whole credential.
       Laid out like a checkout page: the business on the left, the
       conversation on the right. On a phone the left column folds into a
       one-line header and the conversation takes the screen. -->
  <div v-if="error" class="grid h-dvh place-items-center bg-surface p-6">
    <div class="max-w-sm text-center" role="alert">
      <span class="mx-auto grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-hover text-ink-soft" aria-hidden="true">
        <PhChatSlash :size="22"></PhChatSlash>
      </span>
      <h1 class="mt-4 text-lg font-semibold tracking-[-0.01em]">{{ errorTitle }}</h1>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ error.message }}</p>
      <button v-if="canRetry" type="button" class="btn btn-primary mt-5" @click="load">{{ t('common.tryAgain') }}</button>
    </div>
  </div>

  <div v-else class="flex h-dvh flex-col bg-surface lg:flex-row">
    <aside
      class="flex shrink-0 items-center gap-2 border-b border-hairline px-4 py-3 lg:w-[22rem] lg:flex-col lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:bg-sidebar lg:px-8 lg:py-10"
    >
      <!-- Who you are talking to. -->
      <div class="flex min-w-0 flex-1 items-center gap-3 lg:flex-none lg:flex-col lg:items-start lg:gap-5">
        <span
          v-if="agent"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-semibold text-brand lg:h-14 lg:w-14 lg:text-lg"
          aria-hidden="true"
        >
          {{ initials(agent.name) }}
        </span>
        <span v-else class="skeleton h-10 w-10 shrink-0 !rounded-full lg:h-14 lg:w-14"></span>

        <div class="min-w-0">
          <h1
            v-if="agent"
            class="truncate text-base font-semibold tracking-[-0.01em] lg:text-[1.625rem] lg:leading-tight lg:tracking-[-0.025em] lg:whitespace-normal"
          >
            {{ agent.name }}
          </h1>
          <span v-else class="skeleton block h-4 w-36 lg:h-7 lg:w-48"></span>
          <LiveStatus v-if="agent" :label="t('chat.online')" class="mt-0.5 lg:mt-2"></LiveStatus>
        </div>
      </div>

      <!-- What to expect, on a laptop. A phone shows the same note above the
           first message. -->
      <div v-if="agent" class="hidden lg:block">
        <p class="mt-6 text-sm leading-relaxed text-ink-soft">{{ t('chat.aiNote') }}</p>
        <ul class="mt-6 border-t border-hairline text-sm text-ink-soft">
          <li v-for="fact in facts" :key="fact.text" class="flex items-center gap-3 border-b border-hairline py-3">
            <component :is="fact.icon" :size="18" class="shrink-0 text-ink-faint" aria-hidden="true"></component>
            {{ fact.text }}
          </li>
        </ul>
      </div>

      <template v-if="agent">
        <div
          class="max-lg:order-2 lg:mt-8 lg:rounded-[var(--radius-panel)] lg:border lg:border-hairline lg:bg-surface lg:p-4"
        >
          <div class="hidden lg:mb-3 lg:block">
            <p class="text-sm font-semibold">{{ t('chat.ratherTalk') }}</p>
            <p class="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-soft">{{ t('chat.callNote') }}</p>
          </div>
          <VoiceCall :public-key="publicKey"></VoiceCall>
        </div>

        <!-- Only once there is something to clear. -->
        <button
          v-if="chat?.started"
          type="button"
          class="btn btn-quiet shrink-0 max-lg:order-1 max-lg:w-10 max-lg:px-0 lg:mt-auto lg:-ml-3 lg:self-start"
          :title="t('chat.startOver')"
          @click="chat.restart()"
        >
          <PhArrowCounterClockwise :size="18"></PhArrowCounterClockwise>
          <span class="max-lg:sr-only">{{ t('chat.startOver') }}</span>
        </button>
      </template>
    </aside>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div v-if="!agent" class="mx-auto flex w-full max-w-[42rem] flex-col gap-3 px-4 pt-10 sm:px-6" aria-hidden="true">
        <span class="skeleton h-3.5 w-24"></span>
        <span class="skeleton h-4 w-full max-w-md"></span>
        <span class="skeleton h-4 w-2/3 max-w-sm"></span>
      </div>

      <AgentChat v-else ref="chat" class="min-h-0 flex-1" :public-key="publicKey" :agent="agent" customer>
        <template #intro>
          <p class="mb-8 text-center text-[0.8125rem] leading-relaxed text-balance text-ink-soft lg:hidden">
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
import { PhArrowCounterClockwise, PhChatSlash, PhClock, PhImage, PhTranslate } from '@phosphor-icons/vue';

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

const facts = computed(() => [
  { icon: PhClock, text: t('chat.anyTime') },
  { icon: PhTranslate, text: t('chat.anyLanguage') },
  ...(agent.value?.photos ? [{ icon: PhImage, text: t('chat.photosWelcome') }] : []),
]);

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
