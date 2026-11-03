<template>
  <!-- A heading whose words rise out of their own line, one after another,
       once an ancestor is marked `is-shown` (v-reveal, or the hero on load).
       Screen readers get the sentence whole. -->
  <component :is="tag" class="split">
    <span class="sr-only">{{ text }}</span>
    <template v-for="(word, index) in words" :key="index">{{ index ? ' ' : '' }}<span class="word" aria-hidden="true"><span class="word-in" :style="{ '--w': index + from }">{{ word }}</span></span></template>
  </component>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'h2' },
  // Words already played before this one, so a second line waits its turn.
  from: { type: Number, default: 0 },
});

const words = computed(() => props.text.split(' '));
</script>

<style scoped>
/* Each word is its own window; the word slides up into it. The padding keeps
   descenders and Bangla vowel signs inside the window. */
.word {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
  vertical-align: top;
}

.word-in {
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  .word-in {
    transform: translateY(105%) rotate(4deg);
    transform-origin: left bottom;
    transition: transform 0.9s var(--ease-settle);
    transition-delay: calc(var(--w) * 45ms);
  }

  .is-shown .word-in {
    transform: none;
  }
}
</style>
