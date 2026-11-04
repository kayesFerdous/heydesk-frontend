import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

// The clock behind one landing page console scene. `times` is how long to wait
// before each next step, in ms, so `step` runs from 0 to times.length.
//
// `play()` says when to run; if it gives undefined the scene runs while `root`
// is on screen. With `loop`, it rests, adds one to `round` and starts again.
// Under reduced motion it sits on the last step, so every scene shows its end.
export function useSceneClock({ root, play = () => undefined, times, loop = false, rest = 2500 }) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = ref(reduce ? times.length : 0);
  const round = ref(0);
  const seen = ref(false);
  const running = computed(() => play() ?? seen.value);
  let timer = null;
  let observer = null;

  function next() {
    if (step.value < times.length) {
      timer = setTimeout(() => {
        step.value += 1;
        next();
      }, times[step.value]);
    } else if (loop) {
      timer = setTimeout(() => {
        round.value += 1;
        step.value = 0;
        next();
      }, rest);
    }
  }

  watch(running, (on) => {
    clearTimeout(timer);
    if (reduce || !on) return;
    step.value = 0;
    next();
  }, { immediate: true });

  onMounted(() => {
    if (reduce || !root?.value) return;
    const el = root.value.$el || root.value;
    observer = new IntersectionObserver(([entry]) => (seen.value = entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
  });

  onBeforeUnmount(() => {
    clearTimeout(timer);
    if (observer) observer.disconnect();
  });

  return { step, round, reduce };
}
