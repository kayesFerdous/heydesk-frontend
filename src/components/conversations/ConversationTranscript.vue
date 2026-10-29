<template>
  <!-- What was said, word for word, under a header saying who and where.
       A hand-off shows at the top with the way to pick it up. It opens at the
       newest line; scrolling up loads the older ones (backend D157). -->
  <div class="flex flex-col">
    <header class="flex flex-wrap items-center gap-3 border-b border-hairline p-4 sm:px-6">
      <button type="button" class="btn btn-secondary btn-icon btn-sm lg:hidden" :aria-label="t('conversations.back')" @click="$emit('back')">
        <PhArrowLeft :size="18"></PhArrowLeft>
      </button>
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold" :class="tint" aria-hidden="true">
        <template v-if="named">{{ initials(name) }}</template>
        <component :is="channel.icon" v-else :size="22" :weight="channel.weight"></component>
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-lg font-bold">{{ name }}</h2>
        <p class="truncate text-sm text-ink-soft">{{ channel.long }}, {{ when }}</p>
      </div>
      <!-- Who has it (backend I1), Done and the rest, from the page. -->
      <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
        <slot name="actions"></slot>
      </div>
    </header>
    <!-- The AI's summary of the chat, from the page (backend D137). -->
    <slot name="top"></slot>

    <div ref="scroller" class="flex flex-col px-4 py-5 sm:px-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto" @scroll="scrolled">
      <div
        v-if="conversation.status === 'needs_human'"
        class="mx-auto mb-6 flex max-w-2xl flex-wrap items-center gap-3 rounded-[var(--radius-card)] bg-attention-tint p-4 text-sm"
        role="status"
      >
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-attention" aria-hidden="true">
          <PhUserSound :size="20" weight="bold"></PhUserSound>
        </span>
        <div class="min-w-[12rem] flex-1">
          <p class="font-bold text-ink">{{ t('conversations.askedForPerson', { name }) }}</p>
          <p class="mt-0.5 text-ink">
            <template v-if="phone">{{ t('conversations.callToPickUp', { phone }) }}</template>
            <template v-else>{{ t('conversations.readThenReach') }}</template>
          </p>
          <p v-if="canTake" class="mt-0.5 text-ink-soft">{{ t('conversations.assign.nobodyHasIt') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <!-- Nobody has it yet (backend I1): taking it is the first step. -->
          <button v-if="canTake" type="button" class="btn btn-secondary" :disabled="busy" @click="$emit('take')">
            <PhHandGrabbing :size="16"></PhHandGrabbing>
            {{ t('conversations.assign.take') }}
          </button>
          <a v-if="phone" :href="`tel:${phone}`" class="btn btn-primary">
            <PhPhone :size="16" weight="fill"></PhPhone>
            {{ t('conversations.callBack') }}
          </a>
          <button
            type="button"
            class="btn"
            :class="phone ? 'btn-secondary' : 'btn-primary'"
            :title="t('conversations.handledHint')"
            :disabled="busy"
            @click="$emit('handled')"
          >
            <PhCheck :size="16" weight="bold"></PhCheck>
            {{ t('conversations.markHandled') }}
          </button>
        </div>
        <p v-if="error" class="w-full text-sm text-danger" role="alert">{{ error }}</p>
      </div>

      <!-- The newest lines sit at the bottom, as in a messaging app. -->
      <div class="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3">
        <div v-if="more" ref="top" class="flex flex-col items-center gap-1">
          <button type="button" class="btn btn-secondary btn-sm" :disabled="loading" @click="showEarlier">
            {{ t('conversations.showEarlier') }}
          </button>
          <p v-if="earlier.failed" class="text-xs text-danger" role="alert">{{ t('conversations.earlierFailed') }}</p>
        </div>
        <template v-for="(line, index) in lines" :key="line.index ?? index">
          <!-- Where the agent's memory starts: before it, the chat went quiet (backend D157). -->
          <div
            v-if="index === freshAt"
            role="separator"
            class="flex items-center gap-3 py-1 text-xs font-semibold text-ink-soft"
            :title="t('conversations.remembersFromHereHint')"
          >
            <span class="h-px flex-1 bg-hairline" aria-hidden="true"></span>
            {{ t('conversations.remembersFromHere') }}
            <span class="h-px flex-1 bg-hairline" aria-hidden="true"></span>
          </div>
          <div class="flex" :class="line.role === 'user' ? 'justify-start' : 'justify-end'">
            <div class="max-w-[85%]">
              <p class="mb-1 px-1 text-xs text-ink-soft" :class="{ 'text-right': line.role !== 'user' }">
                {{ line.role === 'user' ? name : t('conversations.yourAgent') }}
              </p>
              <div
                class="rounded-[var(--radius-card)] px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
                :class="line.role === 'user' ? 'rounded-tl-md bg-hover text-ink' : 'rounded-tr-md bg-brand-tint text-ink'"
              >
                <!-- The photo the visitor sent, and the products the agent showed (D57). -->
                <a v-if="line.photo" :href="line.photo" target="_blank" rel="noopener">
                  <img :src="line.photo" :alt="t('conversations.theirPhoto', { name })" class="mb-1.5 max-h-60 rounded-[0.875rem]" />
                </a>
                <div v-if="line.photos?.length" class="flex flex-wrap gap-2">
                  <figure v-for="product in line.photos" :key="product.url" class="w-28">
                    <img :src="product.url" :alt="product.name" class="aspect-square w-full rounded-[0.875rem] object-cover" />
                    <figcaption class="mt-1 text-xs leading-snug">
                      <span class="block font-semibold">{{ product.name }}</span>
                      <span class="text-ink-soft">{{ product.price }}</span>
                    </figcaption>
                  </figure>
                </div>
                <span v-if="line.text">{{ line.text }}</span>
              </div>
            </div>
          </div>
        </template>
        <div
          v-if="from > 0 && freshAt === -1"
          role="separator"
          class="flex items-center gap-3 py-1 text-xs font-semibold text-ink-soft"
          :title="t('conversations.remembersFromHereHint')"
        >
          <span class="h-px flex-1 bg-hairline" aria-hidden="true"></span>
          {{ t('conversations.remembersFromHere') }}
          <span class="h-px flex-1 bg-hairline" aria-hidden="true"></span>
        </div>
        <p v-if="!lines.length" class="text-sm text-ink-soft">{{ t('conversations.nothingSaid') }}</p>
        <!-- Clear of the phone's bottom bar, like the page's own padding. -->
        <div ref="end" class="scroll-mb-28 md:scroll-mb-0" aria-hidden="true"></div>
      </div>
    </div>
    <!-- The team's reply box, from the page (backend D136). -->
    <slot name="bottom"></slot>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowLeft, PhCheck, PhHandGrabbing, PhPhone, PhUserSound } from '@phosphor-icons/vue';

import { fetchConversation } from '../../api/conversations.js';
import { channelOf } from '../../lib/channels.js';
import { formatTime, formatDay } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  busy: { type: Boolean, default: false }, // marking the hand-off handled
  error: { type: String, default: null },
  canTake: { type: Boolean, default: false }, // waiting, and nobody on the team has it (I1)
});
defineEmits(['back', 'handled', 'take']);
const { t } = useI18n();

const channel = computed(() => channelOf(props.conversation.channel));
const known = computed(() => props.conversation.name || props.conversation.records[0]?.customer_name);
const named = computed(() => Boolean(known.value));
const name = computed(() => known.value || t('conversations.visitor'));
const tint = computed(() => (named.value ? avatarTint(name.value) : channel.value.avatar));
const phone = computed(() => props.conversation.records.find((r) => r.customer_phone)?.customer_phone ?? '');
const when = computed(
  () => `${formatDay(props.conversation.created_at)}, ${formatTime(props.conversation.created_at)}`,
);

// Older pages, loaded as the team scrolls up; the newest page is `conversation`
// itself, kept fresh by the page. Another chat opened starts over.
const earlier = ref({ id: props.conversation.id, lines: [], more: false, failed: false });
const loading = ref(false);
watch(
  () => props.conversation.id,
  (id) => {
    earlier.value = { id, lines: [], more: false, failed: false };
    atBottom = true;
  },
  { flush: 'sync' },
);

// Older pages and the newest one, once each and in order. A line with no index
// (a backend without pages) only ever comes in the one page.
const lines = computed(() => {
  const newest = props.conversation.messages;
  const seen = new Set(newest.map((line) => line.index));
  return [...earlier.value.lines.filter((line) => line.index === undefined || !seen.has(line.index)), ...newest];
});
const more = computed(() => (earlier.value.lines.length ? earlier.value.more : Boolean(props.conversation.more)));
// The agent starts afresh after a quiet spell (D157): the line it remembers from.
const from = computed(() => props.conversation.history_from ?? 0);
const freshAt = computed(() => (from.value > 0 ? lines.value.findIndex((line) => (line.index ?? 0) >= from.value) : -1));

const scroller = ref(null);
const top = ref(null);
const end = ref(null);
let atBottom = true;

// What scrolls the transcript: its own box on a wide screen, else the nearest
// box above it that scrolls, else the page.
function scrollBox() {
  for (let el = scroller.value; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return document.scrollingElement;
}

async function showEarlier() {
  const first = lines.value[0]?.index;
  if (loading.value || !more.value || first === undefined) return;
  const id = props.conversation.id;
  loading.value = true;
  try {
    const page = await fetchConversation(id, first);
    if (earlier.value.id !== id) return;
    // Older lines in: the same line stays in front of the reader.
    const box = scrollBox();
    const fromBottom = box.scrollHeight - box.scrollTop;
    earlier.value = { id, lines: [...page.messages, ...earlier.value.lines], more: Boolean(page.more), failed: false };
    await nextTick();
    box.scrollTop = box.scrollHeight - fromBottom;
  } catch (err) {
    if (earlier.value.id === id) earlier.value = { ...earlier.value, failed: true };
  } finally {
    loading.value = false;
  }
}

// A chat opens at its newest line, and a new line keeps it there unless the
// team scrolled up to read.
const last = computed(() => {
  const lastLine = lines.value[lines.value.length - 1];
  return `${props.conversation.id}:${lastLine?.index ?? lines.value.length}`;
});
function toBottom() {
  if (atBottom) end.value?.scrollIntoView({ block: 'end' });
}
onMounted(toBottom);
watch(last, toBottom, { flush: 'post' });

function scrolled() {
  const box = scrollBox();
  atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
}

// Reaching the top loads the page before it.
let observer = null;
watch(top, (el) => {
  observer?.disconnect();
  if (!el) return;
  observer = new IntersectionObserver(([entry]) => entry.isIntersecting && showEarlier());
  observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());
</script>
