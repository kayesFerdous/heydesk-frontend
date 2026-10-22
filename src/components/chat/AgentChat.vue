<template>
  <div class="flex h-full min-h-0 flex-col bg-surface">
    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
      <div class="mx-auto flex max-w-[42rem] flex-col px-4 pt-6 pb-6 sm:px-6 lg:pt-10">
        <p class="mb-6 flex items-center gap-3 text-xs font-medium text-ink-soft">
          <span class="h-px flex-1 bg-hairline"></span>
          {{ formatToday() }}
          <span class="h-px flex-1 bg-hairline"></span>
        </p>
        <!-- What the page shows above the first message (the customer's page
             says who answers here). -->
        <slot name="intro"></slot>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="msg"
          :class="[message.role === 'user' ? 'ml-auto max-w-[85%]' : 'pl-8', gapAbove(index)]"
        >
          <!-- A run of replies starts with who wrote it: the agent, or a person
               from the team answering from Telegram. -->
          <p v-if="message.role !== 'user' && startsRun(index)" class="-ml-8 mb-1.5 flex items-center gap-2 text-[0.8125rem]">
            <span
              class="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold"
              :class="message.role === 'team' ? 'bg-hover text-ink-soft' : 'bg-brand-tint text-brand'"
              aria-hidden="true"
            >
              <PhUser v-if="message.role === 'team'" :size="13" weight="bold"></PhUser>
              <img v-else-if="agentLogo" :src="agentLogo" alt="" class="h-6 w-6 rounded-full object-cover ring-1 ring-hairline" />
              <template v-else>{{ initials(agentName) }}</template>
            </span>
            <span class="font-semibold">{{ message.role === 'team' ? t('chat.fromTeam') : agentName }}</span>
            <span class="text-ink-soft">{{ formatTime(message.at) }}</span>
          </p>

          <div
            v-if="message.role === 'user'"
            class="rounded-[var(--radius-card)] rounded-br-md bg-brand text-white text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
            :class="message.text ? 'px-4 py-2.5' : 'p-1'"
          >
            <img
              v-if="message.photo"
              :src="message.photo"
              :alt="t('chat.yourPhoto')"
              class="max-h-64 rounded-[calc(var(--radius-panel)-4px)]"
              :class="{ 'mb-2': message.text }"
            />
            <span v-if="message.text">{{ message.text }}</span>
          </div>

          <div v-else class="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink">
            <span v-if="message.text"><template v-for="(part, i) in linkParts(message.text)" :key="i"><a v-if="part.url" :href="part.url" target="_blank" rel="noopener" class="font-medium break-all text-brand underline">{{ part.text }}</a><template v-else>{{ part.text }}</template></template></span>

            <!-- Products the agent showed (D57): swipe along a row of them. -->
            <div v-if="message.photos?.length" class="-mr-4 mt-3 flex snap-x gap-3 overflow-x-auto pr-4 pb-1 sm:mr-0 sm:pr-0">
              <figure v-for="product in message.photos" :key="product.url" class="w-40 shrink-0 snap-start">
                <img
                  :src="product.url"
                  :alt="product.name"
                  class="aspect-square w-full rounded-[var(--radius-thumb)] bg-wash object-cover ring-1 ring-hairline"
                />
                <figcaption class="mt-2 text-[0.8125rem] leading-snug whitespace-normal">
                  <span class="line-clamp-2 font-medium">{{ product.name }}</span>
                  <span class="text-ink-soft">{{ product.price }}</span>
                </figcaption>
              </figure>
            </div>

            <span
              v-if="isPending(index) && (!message.text || status)"
              class="inline-flex items-center gap-2 py-1 text-[0.8125rem] text-ink-soft"
              :class="{ 'mt-1 flex': message.text }"
              :aria-label="status || t('chat.typing')"
            >
              <span class="inline-flex gap-1"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
              <span v-if="status">{{ status }}</span>
            </span>
          </div>
        </div>

        <!-- Tap-to-ask buttons the business chose (backend D82), until the first message. -->
        <div v-if="starters.length && messages.length === 1 && !sending" class="msg mt-4 flex flex-wrap gap-2 pl-8">
          <button
            v-for="starter in starters"
            :key="starter"
            type="button"
            class="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-left text-sm font-medium text-ink transition-colors duration-200 hover:border-brand hover:text-brand"
            @click="ask(starter)"
          >
            {{ starter }}
          </button>
        </div>

        <div v-if="handoff" class="notice msg mt-6" role="status">
          <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
          <div class="min-w-0">
            <p class="font-semibold text-ink">{{ t('chat.handedOver') }}</p>
            <p class="mt-0.5 text-ink-soft">{{ handoff.message }}</p>
            <p v-if="handoff.phone || handoff.email" class="mt-3 flex flex-wrap gap-2">
              <a v-if="handoff.phone" :href="`tel:${handoff.phone}`" class="btn btn-secondary btn-sm">
                <PhPhone :size="14" weight="bold"></PhPhone>
                {{ handoff.phone }}
              </a>
              <a v-if="handoff.email" :href="`mailto:${handoff.email}`" class="btn btn-secondary btn-sm">
                <PhEnvelopeSimple :size="14" weight="bold"></PhEnvelopeSimple>
                {{ handoff.email }}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
      <div class="mx-auto max-w-[42rem]">
        <p v-if="error" class="mb-2 flex items-start gap-2 px-1 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ error }}
        </p>

        <!-- One ruled box: the photo you are about to send, then the words. -->
        <form
          class="rounded-[var(--radius-card)] border border-line-strong bg-surface p-1.5 transition-[border-color,box-shadow] duration-200 focus-within:border-ink focus-within:ring-4 focus-within:ring-lime/70 hover:border-ink-faint focus-within:hover:border-ink"
          @submit.prevent="send"
        >
          <div v-if="photo" class="relative m-1.5 mb-1 w-fit">
            <img :src="photo" :alt="t('chat.yourPhoto')" class="size-16 rounded-[var(--radius-thumb)] object-cover ring-1 ring-hairline" />
            <button
              type="button"
              class="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full border border-hairline bg-surface text-ink-soft shadow-[var(--shadow-lift)] hover:text-ink"
              :aria-label="t('chat.removePhoto')"
              @click="photo = null"
            >
              <PhX :size="12" weight="bold"></PhX>
            </button>
          </div>

          <div class="flex items-end gap-1">
            <label
              v-if="takesPhotos"
              class="btn btn-quiet btn-icon shrink-0 cursor-pointer"
              :class="{ 'pointer-events-none opacity-40': sending }"
              :title="t('chat.addPhoto')"
            >
              <span class="sr-only">{{ t('chat.addPhoto') }}</span>
              <PhImage :size="20"></PhImage>
              <input type="file" accept="image/*" class="sr-only" :disabled="sending" @change="pickPhoto" />
            </label>
            <label class="min-w-0 flex-1">
              <span class="sr-only">{{ t('chat.typeMessage') }}</span>
              <textarea
                ref="input"
                v-model="draft"
                rows="1"
                class="block max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-[0.9375rem] leading-6 text-ink placeholder:text-ink-soft focus-visible:outline-none"
                :placeholder="t('chat.typeMessage')"
                enterkeyhint="send"
                autocomplete="off"
                @input="fitInput"
                @keydown.enter="onEnter"
              ></textarea>
            </label>
            <button
              type="submit"
              class="btn btn-icon shrink-0"
              :class="canSend ? 'btn-primary' : 'btn-quiet'"
              :disabled="!canSend"
              :aria-label="t('chat.send')"
            >
              <PhArrowUp :size="18" weight="bold"></PhArrowUp>
            </button>
          </div>
        </form>

        <div v-if="!customer" class="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-ink-soft">
          <span>{{ t('chat.testNote') }}</span>
          <button type="button" class="link shrink-0 whitespace-nowrap" @click="restart">
            {{ t('chat.startOver') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhArrowUp,
  PhEnvelopeSimple,
  PhImage,
  PhPhone,
  PhUser,
  PhUserSound,
  PhWarningCircle,
  PhX,
} from '@phosphor-icons/vue';

import { fetchChatAgent, fetchTeamReplies, streamChat } from '../../api/chat.js';
import { formatTime, formatToday, linkParts } from '../../lib/format.js';
import { initials } from '../../lib/group.js';
import { shrinkPhoto } from '../../lib/photo.js';

const TEAM_CHECK_MS = 4000;
const REMEMBERED_FOR_MS = 24 * 60 * 60 * 1000; // a day: after that, a new conversation

const props = defineProps({
  publicKey: { type: String, required: true },
  // The {name, greeting, photos} a page already loaded; without it the chat asks itself.
  agent: { type: Object, default: null },
  // The customer's own page: no test note under the input, and the page puts
  // Start over in its header (it calls the exposed `restart`).
  customer: { type: Boolean, default: false },
  // Tap-to-ask buttons under the greeting (backend D82).
  starters: { type: Array, default: () => [] },
  // Keep the conversation in this browser, so it is still there after a reload
  // or on the website's next page (the website chat, backend D82).
  remember: { type: Boolean, default: false },
});
// `reply`: the agent finished a reply or the team wrote, for the website's unread dot.
const emit = defineEmits(['reply']);
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
const takesPhotos = ref(false); // a shop's chat takes a photo with a message (D57)
const photo = ref(null); // the picked photo, made small, as a data URL
const agentName = ref('');
const agentLogo = ref(''); // the business's logo for the website chat (backend D82)
let teamSeen = 0;
let teamTimer = null;

const canSend = computed(() => Boolean(draft.value.trim() || photo.value) && !sending.value);
// More than the greeting: the page offers Start over only then.
const started = computed(() => messages.value.length > 1);

// Messages carry the moment they appeared here, for the time beside a run.
function say(role, text, extra = {}) {
  messages.value.push({ role, text, at: new Date().toISOString(), ...extra });
}

function startsRun(index) {
  return index === 0 || messages.value[index - 1].role !== messages.value[index].role;
}

// Tight within a run, room between runs.
function gapAbove(index) {
  if (index === 0) return '';
  if (!startsRun(index)) return messages.value[index].role === 'user' ? 'mt-1.5' : 'mt-3';
  return 'mt-6';
}

// The reply being written right now.
function isPending(index) {
  return sending.value && index === messages.value.length - 1;
}

// The remembered conversation lives in localStorage, under the agent's key.
// Storage can be blocked (a private window): then the chat just isn't remembered.
const savedKey = () => `heydesk-chat:${props.publicKey}`;

function saved() {
  try {
    const found = JSON.parse(localStorage.getItem(savedKey()));
    return found && Date.now() - found.savedAt < REMEMBERED_FOR_MS ? found : null;
  } catch (err) {
    return null;
  }
}

function save() {
  if (!props.remember) return;
  const data = {
    savedAt: Date.now(),
    conversationId: conversationId.value,
    messages: messages.value,
    teamSeen,
    handoff: handoff.value,
  };
  try {
    localStorage.setItem(savedKey(), JSON.stringify(data));
  } catch (err) {
    // Too big with the photos the visitor sent: keep the words.
    data.messages = data.messages.map((m) => ({ ...m, photo: null }));
    try {
      localStorage.setItem(savedKey(), JSON.stringify(data));
    } catch (again) {
      // Storage is blocked: nothing to do.
    }
  }
}

function forget() {
  try {
    localStorage.removeItem(savedKey());
  } catch (err) {
    // Storage is blocked: nothing was kept.
  }
}

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
  photo.value = null;
  try {
    const agent = props.agent || (await fetchChatAgent(props.publicKey));
    takesPhotos.value = Boolean(agent.photos);
    agentName.value = agent.name;
    agentLogo.value = agent.widget?.logo || '';
    const before = props.remember && saved();
    if (before) {
      messages.value = before.messages;
      conversationId.value = before.conversationId;
      teamSeen = before.teamSeen;
      handoff.value = before.handoff;
      if (conversationId.value) watchTeam();
      scrollDown(true);
    } else {
      say('agent', agent.greeting);
    }
  } catch (err) {
    error.value = err.message;
  }
}

function restart() {
  forget();
  draft.value = '';
  fitInput();
  start();
}

// Follow the conversation down, unless the reader has scrolled up to read
// something earlier. Checked before the new words land, so a long reply does
// not count as scrolling away.
function scrollDown(force = false) {
  const el = scroller.value;
  if (!el) return;
  const following = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  if (force || following) nextTick(() => (el.scrollTop = el.scrollHeight));
}

// The box grows with the message, up to its max height, then scrolls.
function fitInput() {
  nextTick(() => {
    const el = input.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  });
}

// Enter sends, Shift+Enter starts a new line. A Bangla keyboard uses Enter to
// pick a word (isComposing): that Enter is the keyboard's, not ours.
function onEnter(event) {
  if (event.shiftKey || event.isComposing) return;
  event.preventDefault();
  send();
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
    replies.slice(teamSeen).forEach((text) => say('team', text));
    if (replies.length > teamSeen) {
      scrollDown();
      emit('reply');
    }
    teamSeen = replies.length;
    save();
  } catch (err) {
    // A missed check is fine: the next one catches up.
  }
}

async function pickPhoto(event) {
  const file = event.target.files[0];
  event.target.value = ''; // the same file can be picked again
  if (!file) return;
  error.value = null;
  try {
    photo.value = await shrinkPhoto(file);
  } catch (err) {
    error.value = t('chat.notAPhoto');
  }
  nextTick(() => input.value && input.value.focus());
}

function ask(text) {
  draft.value = text;
  send();
}

async function send() {
  const text = draft.value.trim();
  const sent = photo.value;
  if (!canSend.value) return;

  draft.value = '';
  fitInput();
  photo.value = null;
  error.value = null;
  sending.value = true;
  say('user', text, { photo: sent });
  say('agent', '');
  // The reactive copy, so streamed text shows up as it arrives.
  const reply = messages.value[messages.value.length - 1];
  scrollDown(true);

  try {
    await streamChat(props.publicKey, text, conversationId.value, {
      open: (data) => {
        conversationId.value = data.conversation_id;
        watchTeam();
      },
      status: (data) => {
        status.value = data.label;
        scrollDown();
      },
      token: (data) => {
        status.value = null;
        reply.text += data.text;
        scrollDown();
      },
      handoff: (data) => {
        handoff.value = data;
        scrollDown();
      },
      photos: (data) => {
        reply.photos = data.items;
        scrollDown();
      },
      error: (data) => (error.value = data.message),
    }, sent);
  } catch (err) {
    error.value = err.message;
  }

  // An empty reply bubble is worse than none.
  if (!reply.text && !reply.photos) messages.value.splice(messages.value.indexOf(reply), 1);
  status.value = null;
  sending.value = false;
  scrollDown();
  save();
  if (reply.text || reply.photos) emit('reply');
  focus();
}

function focus() {
  nextTick(() => input.value && input.value.focus());
}

watch(() => props.publicKey, start, { immediate: true });
onBeforeUnmount(() => clearInterval(teamTimer));

defineExpose({ restart, started, focus });
</script>

<style scoped>
/* A message settles into place as it arrives: the one moving thing here. */
.msg {
  animation: arrive 0.4s var(--ease-settle) both;
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

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
  .msg {
    animation: none;
  }

  .dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>
