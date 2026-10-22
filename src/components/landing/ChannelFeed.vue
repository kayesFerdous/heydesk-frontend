<template>
  <!-- Every channel lands in one list. While on screen, a new conversation
       arrives every couple of seconds, from the next channel in turn; its
       channel lights up in the list beside it. Example data. -->
  <div ref="root" class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
    <ul class="border-t border-hairline">
      <li
        v-for="id in ORDER"
        :key="id"
        class="channel flex items-start gap-4 border-b border-hairline px-3 py-4"
        :class="{ 'is-sending': id === sending }"
      >
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full" :class="channelOf(id).avatar" aria-hidden="true">
          <component :is="channelOf(id).icon" :size="20" :weight="channelOf(id).weight"></component>
        </span>
        <div class="min-w-0">
          <h3 class="font-semibold tracking-[-0.01em]">{{ t(`landing.channels.${id}.name`) }}</h3>
          <p class="mt-0.5 text-sm leading-relaxed text-ink-soft">{{ t(`landing.channels.${id}.text`) }}</p>
        </div>
      </li>
    </ul>

    <figure class="self-start overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface" :aria-label="t('landing.feed.label')">
      <header class="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
        <span class="flex items-center gap-2 text-sm font-semibold">
          <PhChatsCircle :size="18" class="text-ink-faint"></PhChatsCircle>
          {{ t('nav.conversations') }}
        </span>
        <span :key="count" class="count count-bump">{{ formatNumber(count) }}</span>
      </header>
      <TransitionGroup tag="ul" name="feed" class="relative overflow-hidden text-sm">
        <li v-for="entry in entries" :key="entry.key" class="feed-row flex items-center gap-3 border-b border-hairline px-5 py-3.5">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="channelOf(entry.id).avatar" aria-hidden="true">
            <component :is="channelOf(entry.id).icon" :size="17" :weight="channelOf(entry.id).weight"></component>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ t(`landing.feed.${entry.id}.name`) }}</span>
            <span class="block truncate text-ink-soft">{{ t(`landing.feed.${entry.id}.text`) }}</span>
          </span>
          <span class="shrink-0 text-xs text-ink-soft">{{ channelOf(entry.id).long }}</span>
        </li>
      </TransitionGroup>
      <figcaption class="border-t border-hairline px-5 py-3 text-xs text-ink-soft">{{ t('demo.notReal') }}</figcaption>
    </figure>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatsCircle } from '@phosphor-icons/vue';

import { channelOf } from '../../lib/channels.js';
import { formatNumber } from '../../lib/format.js';

// The order the channels take turns in; the words are `landing.channels.<id>`
// and one example conversation each at `landing.feed.<id>`.
const ORDER = ['web', 'whatsapp', 'messenger', 'voice', 'telegram'];
const SHOWN = 5;
const EVERY = 2200;

const { t } = useI18n();

const root = ref(null);
// Newest first, as in Conversations. It starts full, so the list never looks empty.
const entries = ref(
  ORDER.slice()
    .reverse()
    .map((id, index) => ({ id, key: index }))
);
const count = ref(ORDER.length);
const sending = ref(null);

let next = 0;
let timer = null;
let observer = null;

function arrive() {
  const id = ORDER[next % ORDER.length];
  next += 1;
  sending.value = id;
  entries.value = [{ id, key: count.value }, ...entries.value].slice(0, SHOWN);
  count.value += 1;
}

function start() {
  if (timer) return;
  timer = setInterval(arrive, EVERY);
}

function stop() {
  clearInterval(timer);
  timer = null;
  sending.value = null;
}

onMounted(() => {
  // Without motion the list stays as it is: every channel already in it.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.4 });
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.channel {
  border-radius: var(--radius-card);
  transition: background-color 0.5s var(--ease-settle);
}

/* The channel the newest conversation came from, for as long as it is newest. */
.channel.is-sending {
  background-color: var(--color-brand-tint);
}

/* A new conversation comes in at the top and pushes the others down. */
.feed-move,
.feed-enter-active {
  transition:
    transform 0.55s var(--ease-settle),
    opacity 0.55s var(--ease-settle);
}

.feed-enter-active {
  animation: lit 2s ease-out both;
}

.feed-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: opacity 0.3s ease-in;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.feed-leave-to {
  opacity: 0;
}

.count-bump {
  animation: bump 0.4s var(--ease-settle);
}

@keyframes lit {
  from {
    background-color: var(--color-brand-tint);
  }
  to {
    background-color: var(--color-surface);
  }
}

@keyframes bump {
  40% {
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .count-bump {
    animation: none;
  }
}
</style>
