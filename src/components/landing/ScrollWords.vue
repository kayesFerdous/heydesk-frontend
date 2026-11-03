<template>
  <!-- A paragraph read at the pace of the scroll: each word turns from faint
       to ink as the paragraph moves up the screen, and the words between
       *stars* in the sentence get a lime marker once they are lit. Screen
       readers get the sentence whole. -->
  <p ref="root" class="scroll-words">
    <span class="sr-only">{{ plain }}</span>
    <template v-for="(part, p) in parts" :key="p">{{ part.space ? ' ' : '' }}<span :class="{ mark: part.mark, 'is-lit': part.mark && lit > part.from }" aria-hidden="true">
        <span v-for="(word, w) in part.words" :key="w" class="sw" :class="{ 'is-lit': lit > part.from + w }">{{ w ? ' ' : '' }}{{ word }}</span>
      </span></template>
  </p>
</template>

<script setup>
import { ref, computed } from 'vue';

import { useScrollProgress } from '../../composables/useScrollProgress.js';

const props = defineProps({
  text: { type: String, required: true },
});

const root = ref(null);
// From the paragraph's top at 85% of the screen to its top at 25%.
const { progress } = useScrollProgress(root, { start: 0.85, end: 0.25 });

// "a *b c*, d" becomes [{ words: ['a'] }, { words: ['b', 'c'], mark: true }, { words: [',', 'd'] }],
// each part knowing where its first word sits in the whole sentence, and
// whether a space comes before it (none before the comma here).
const parts = computed(() => {
  let count = 0;
  const chunks = props.text.split('*');
  return chunks.map((chunk, index) => {
    const words = chunk.trim().split(/\s+/).filter(Boolean);
    const space = index > 0 && (/^\s/.test(chunk) || /\s$/.test(chunks[index - 1]));
    const part = { words, mark: index % 2 === 1, from: count, space };
    count += words.length;
    return part;
  });
});

const total = computed(() => parts.value.reduce((sum, part) => sum + part.words.length, 0));
const lit = computed(() => progress.value * total.value);
const plain = computed(() => props.text.replaceAll('*', ''));
</script>

<style scoped>
.scroll-words {
  font-size: clamp(1.75rem, 1rem + 3vw, 3.75rem);
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-wrap: pretty;
}

.scroll-words:lang(bn) {
  line-height: 1.4;
  letter-spacing: normal;
}

.sw {
  color: var(--color-ink);
  opacity: 0.16;
  transition: opacity 0.35s var(--ease-settle);
}

.sw.is-lit {
  opacity: 1;
}

/* The marker sweeps in from the left behind the words once they light. */
.mark {
  border-radius: 0.25em;
  background-image: linear-gradient(var(--color-lime), var(--color-lime));
  background-repeat: no-repeat;
  background-size: 0% 100%;
  padding-inline: 0.12em;
  margin-inline: -0.06em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: background-size 0.7s var(--ease-settle);
}

.mark.is-lit {
  background-size: 100% 100%;
}

@media (prefers-reduced-motion: reduce) {
  .sw,
  .mark {
    transition: none;
  }
}
</style>
