import { computed, onBeforeUnmount, ref, watch } from 'vue';

// Keeps something on screen for `ms` after it is closed, so it can play its way out
// (a sheet sliding off) instead of vanishing. `leaving` is true for that moment: put a
// class on it that runs the exit animation.
//
//   const sheet = usePresence(() => editKey.value !== null, 250);
//   <div v-if="sheet.mounted.value" :class="{ 'is-leaving': sheet.leaving.value }">
export function usePresence(isOpen, ms = 200) {
  const mounted = ref(isOpen());
  let timer = null;

  watch(
    isOpen,
    (open) => {
      clearTimeout(timer);
      if (open) {
        mounted.value = true;
        return;
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      timer = setTimeout(() => (mounted.value = false), reduce ? 0 : ms);
    },
    { flush: 'sync' },
  );
  onBeforeUnmount(() => clearTimeout(timer));

  return { mounted, leaving: computed(() => mounted.value && !isOpen()) };
}
