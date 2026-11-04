<template>
  <!-- The one thing a visitor can do here: ask what customers ask and watch the
       answer come back in the same language. The answers are written in
       (i18n), against the example shop's real prices; it says so under the
       chat. Drawn like the customer's chat: their words in black, the
       assistant's as plain text. -->
  <div class="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
    <div>
      <h2 v-reveal class="section-title">{{ t('landing.try.title') }}</h2>
      <p class="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">{{ t('landing.try.text') }}</p>
      <div class="mt-8 flex flex-wrap gap-2" role="group" :aria-label="t('landing.try.pick')">
        <button
          v-for="id in QUESTIONS"
          :key="id"
          type="button"
          class="ask"
          :class="{ 'is-asked': lastAsked === id }"
          :disabled="pending"
          @click="ask(id)"
        >
          {{ t(`landing.try.asks.${id}.q`) }}
        </button>
      </div>
    </div>

    <div>
      <div class="chat">
        <div class="flex items-center gap-3 px-5 py-4">
          <span class="grid h-9 w-9 place-items-center rounded-full bg-night text-xs font-semibold text-lime" aria-hidden="true">NT</span>
          <span class="font-semibold">{{ t('landing.try.business') }}</span>
        </div>
        <div ref="log" class="chat-log" aria-live="polite">
          <template v-for="line in lines" :key="line.key">
            <p v-if="line.mine" class="bubble">{{ line.text }}</p>
            <div v-else class="reply">
              <p>{{ line.text }}</p>
              <span v-if="line.person" class="mt-2 inline-flex items-center gap-1 rounded-full bg-attention-tint px-2.5 py-1 text-xs font-semibold text-attention">
                <PhUserSound :size="14"></PhUserSound>
                {{ t('landing.try.needsPerson') }}
              </span>
            </div>
          </template>
          <p v-if="pending" class="status">
            <span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>
            {{ t('landing.try.checking') }}
          </p>
        </div>
      </div>
      <ExampleTag class="mt-3" :text="t('landing.try.example')"></ExampleTag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUserSound } from '@phosphor-icons/vue';

import ExampleTag from './ExampleTag.vue';
import vReveal from '../../directives/reveal.js';

const QUESTIONS = ['size', 'delivery', 'colour', 'discount', 'exchange', 'person'];

const { t } = useI18n();

const lastAsked = ref('size');
const asked = ref([{ id: 'size', answered: true, key: 0 }]);
const pending = ref(false);
const log = ref(null);
let timer = null;
let count = 0;

const lines = computed(() =>
  asked.value.flatMap(({ id, answered, key }) => {
    const said = [{ key: `${key}q`, mine: true, text: t(`landing.try.asks.${id}.q`) }];
    if (answered) said.push({ key: `${key}a`, text: t(`landing.try.asks.${id}.a`), person: id === 'person' });
    return said;
  })
);

function toBottom() {
  nextTick(() => {
    if (log.value) log.value.scrollTop = log.value.scrollHeight;
  });
}

function ask(id) {
  count += 1;
  const turn = { id, answered: false, key: count };
  asked.value.push(turn);
  lastAsked.value = id;
  pending.value = true;
  toBottom();
  const wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
  timer = setTimeout(() => {
    asked.value[asked.value.length - 1].answered = true;
    pending.value = false;
    toBottom();
  }, wait);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.section-title {
  font-size: clamp(2rem, 1.2rem + 2.6vw, 3.5rem);
  line-height: 1.04;
  font-weight: 600;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.section-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

.ask {
  min-height: 2.75rem;
  border-radius: var(--radius-stamp);
  background-color: var(--color-surface);
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border: 1px solid var(--color-line-strong);
  transition:
    background-color 0.15s var(--ease-settle),
    transform 0.15s var(--ease-settle);
}

.ask:active {
  transform: scale(0.97);
}

.ask:disabled {
  cursor: default;
}

/* Lime is "you are here": the question on screen. */
.ask.is-asked {
  border-color: var(--color-lime);
  background-color: var(--color-lime);
}

@media (hover: hover) and (pointer: fine) {
  .ask:not(.is-asked):not(:disabled):hover {
    background-color: var(--color-hover);
  }
}

.chat {
  overflow: hidden;
  border-radius: 1.75rem;
  background-color: var(--color-surface);
}

.chat-log {
  display: flex;
  height: 22rem;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 0.5rem 1.25rem 1.5rem;
  scroll-behavior: smooth;
}

/* Lines sit at the bottom of the chat and grow upwards, like a messaging app. */
.chat-log > :first-child {
  margin-top: auto;
}

.bubble {
  align-self: flex-end;
  max-width: 80%;
  border-radius: 1.25rem 1.25rem 0.375rem 1.25rem;
  background-color: var(--color-night);
  padding: 0.625rem 1rem;
  color: #fff;
  animation: settle 0.35s var(--ease-settle);
}

.reply {
  max-width: 90%;
  line-height: 1.55;
  animation: settle 0.35s var(--ease-settle);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-ink-soft);
}

.typing {
  display: inline-flex;
  gap: 3px;
}

.typing i {
  height: 5px;
  width: 5px;
  border-radius: 9999px;
  background-color: var(--color-ink-soft);
  animation: blink 1.1s var(--ease-settle) infinite;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes settle {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes blink {
  50% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble,
  .reply,
  .typing i {
    animation: none;
  }

  .chat-log {
    scroll-behavior: auto;
  }
}
</style>
