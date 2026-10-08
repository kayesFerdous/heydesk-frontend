<template>
  <!-- Whether customers get answers right now. The dot is real state, so it is
       always paired with a word. -->
  <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="paused ? 'text-attention' : 'text-success'">
    <span class="relative grid h-2 w-2 place-items-center" aria-hidden="true">
      <span v-if="!paused && breathe" class="pulse absolute inset-0 rounded-full bg-success"></span>
      <span class="relative h-2 w-2 rounded-full" :class="paused ? 'bg-attention' : 'bg-success'"></span>
    </span>
    {{ paused ? pausedLabel : label }}
  </span>
</template>

<script>
export default {
  props: {
    paused: { type: Boolean, default: false },
    label: { type: String, default: 'Live' },
    pausedLabel: { type: String, default: 'Paused by HeyDesk' },
    // One breathing dot per screen at most; lists of many keep theirs still.
    breathe: { type: Boolean, default: true },
  },
};
</script>

<style scoped>
/* The live dot breathes once every 2.4 seconds: the agent is on. */
.pulse {
  animation: breathe 2.4s var(--ease-settle) infinite;
}

@keyframes breathe {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  70%,
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse {
    animation: none;
    opacity: 0;
  }
}
</style>
