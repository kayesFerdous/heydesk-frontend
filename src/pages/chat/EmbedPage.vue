<template>
  <!-- The website chat (backend D82): the customer chat inside the window that
       public/widget.js opens on a business's own website. The business's
       colour and logo, a close button, and the conversation kept in the browser.
       It talks to widget.js with postMessage: ready, reply and close go up,
       open comes down. -->
  <div v-if="error" class="grid h-dvh place-items-center bg-surface p-6">
    <div class="max-w-sm text-center" role="alert">
      <span class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-hover text-ink-soft" aria-hidden="true">
        <PhChatSlash :size="22"></PhChatSlash>
      </span>
      <h1 class="mt-4 text-base font-semibold">{{ t('chat.couldNotOpen') }}</h1>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ error.message }}</p>
    </div>
  </div>

  <div v-else class="flex h-dvh flex-col bg-surface" :style="brand">
    <header class="flex shrink-0 items-center gap-3 px-4 py-3" :style="{ background: colour, color: onColour }">
      <template v-if="agent">
        <img
          v-if="widget.logo"
          :src="widget.logo"
          alt=""
          class="h-10 w-10 shrink-0 rounded-full bg-white object-cover ring-2 ring-white/30"
        />
        <span
          v-else
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-semibold ring-2 ring-white/20"
          aria-hidden="true"
        >
          {{ initials(agent.name) }}
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-[0.9375rem] leading-tight font-semibold">{{ agent.name }}</h1>
          <p class="mt-0.5 flex items-center gap-1.5 text-xs opacity-85">
            <span class="live h-2 w-2 rounded-full bg-success-tint" aria-hidden="true"></span>
            {{ t('chat.repliesInstantly') }}
          </p>
        </div>
        <button
          v-if="chat?.started"
          type="button"
          class="head-btn"
          :aria-label="t('chat.startOver')"
          :title="t('chat.startOver')"
          @click="chat.restart()"
        >
          <PhArrowCounterClockwise :size="18"></PhArrowCounterClockwise>
        </button>
        <button v-if="inFrame" type="button" class="head-btn" :aria-label="t('chat.close')" :title="t('chat.close')" @click="close">
          <PhX :size="18" weight="bold"></PhX>
        </button>
      </template>
      <template v-else>
        <span class="h-10 w-10 shrink-0 rounded-full bg-white/20"></span>
        <span class="h-4 w-32 rounded bg-white/20"></span>
      </template>
    </header>

    <main class="flex min-h-0 flex-1 flex-col">
      <AgentChat
        v-if="agent"
        ref="chat"
        class="min-h-0 flex-1"
        :public-key="publicKey"
        :agent="agent"
        :starters="widget.starters"
        customer
        remember
        @reply="tell('heydesk:reply')"
      >
        <!-- Only a receptionist or a clinic takes calls (backend D108). -->
        <template v-if="agent.voice" #intro>
          <div class="mb-6 flex justify-center">
            <VoiceCall :public-key="publicKey"></VoiceCall>
          </div>
        </template>
      </AgentChat>
    </main>

    <p class="shrink-0 pb-2 text-center text-[0.6875rem] text-ink-faint">{{ t('chat.poweredBy') }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowCounterClockwise, PhChatSlash, PhX } from '@phosphor-icons/vue';

import AgentChat from '../../components/chat/AgentChat.vue';
import VoiceCall from '../../components/chat/VoiceCall.vue';
import { fetchChatAgent } from '../../api/chat.js';
import { initials } from '../../lib/group.js';
import { isLight } from '../../lib/colour.js';

const route = useRoute();
const { t } = useI18n();

const agent = ref(null);
const chat = ref(null);
const error = ref(null);
const inFrame = window.parent !== window; // opened by widget.js, not as a page of its own

const publicKey = computed(() => route.params.key);
const DEFAULT_COLOUR = '#0f766e'; // the backend's own default (D82), until the agent loads
const widget = computed(() => agent.value?.widget || { colour: DEFAULT_COLOUR, starters: [], logo: '' });
const colour = computed(() => widget.value.colour);
const onColour = computed(() => (isLight(colour.value) ? 'var(--color-ink)' : 'white'));
// Inside the chat the business's colour is the brand (your messages, the send
// button). White words on a light colour can't be read, so a light one is darkened.
const brand = computed(() => {
  const c = isLight(colour.value) ? `color-mix(in srgb, ${colour.value} 55%, black)` : colour.value;
  return {
    '--color-brand': c,
    '--color-brand-hover': c,
    '--color-brand-tint': `color-mix(in srgb, ${colour.value} 10%, white)`,
  };
});

// To widget.js on the business's page. Nothing secret goes up: the settings
// are public, like the chat link.
function tell(type, data = {}) {
  if (inFrame) window.parent.postMessage({ type, ...data }, '*');
}

function close() {
  tell('heydesk:close');
}

function onMessage(event) {
  if (event.source === window.parent && event.data?.type === 'heydesk:open') chat.value?.focus();
}

function onKey(event) {
  if (event.key === 'Escape') close();
}

async function load() {
  agent.value = null;
  error.value = null;
  try {
    const found = await fetchChatAgent(publicKey.value);
    // The plain object, before Vue wraps it: postMessage can't send Vue's copy.
    tell('heydesk:ready', { name: found.name, widget: found.widget });
    agent.value = found;
    document.title = found.name;
  } catch (err) {
    error.value = err;
  }
}

watch(publicKey, load, { immediate: true });
onMounted(() => {
  window.addEventListener('message', onMessage);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
.head-btn {
  display: grid;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.head-btn:hover {
  background-color: rgb(255 255 255 / 0.18);
}

/* The live dot breathes, slowly. */
.live {
  animation: breathe 2.4s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live {
    animation: none;
  }
}
</style>
