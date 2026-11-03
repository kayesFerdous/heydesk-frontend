import { ref, onMounted, onBeforeUnmount } from 'vue';

// How far an element has travelled through the screen, from 0 to 1, updated
// once a frame while the page scrolls. The landing page uses it to run a
// story by the scroll instead of a timer.
//
// `start` and `end` say where on the screen the element's top is when the
// count starts and ends, as a share of the screen's height: the default,
// { start: 1, end: 0 }, runs from the top entering at the bottom to the top
// reaching the top. A tall section that pins its contents (sticky) passes
// { pinned: true } instead: 0 as it pins, 1 as it lets go.
//
// Under reduced motion the progress is 1 at once, so every story shows its end.
export function useScrollProgress(target, { start = 1, end = 0, pinned = false } = {}) {
  const progress = ref(0);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = null;

  function measure() {
    frame = null;
    const el = target.value;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const screen = window.innerHeight;
    let raw;
    if (pinned) {
      // The distance it stays pinned is its height less one screen.
      raw = -box.top / Math.max(1, box.height - screen);
    } else {
      raw = (screen * start - box.top) / (screen * (start - end));
    }
    progress.value = Math.min(1, Math.max(0, raw));
  }

  function onScroll() {
    if (frame === null) frame = requestAnimationFrame(measure);
  }

  onMounted(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (frame !== null) cancelAnimationFrame(frame);
  });

  return { progress, reduce };
}
