// v-reveal: marks an element `is-shown` the first time it scrolls into view,
// so CSS can play a one-time entrance (see `.reveal` in main.css).
//
// Content is visible by default. Only an element that is still below the fold,
// in a browser that allows motion, is hidden first; everything else is marked
// shown at once. `v-reveal="{ delay: 120 }"` waits that many ms after arriving.
const SHOWN = 'is-shown';

export default {
  mounted(el, binding) {
    const delay = (binding.value && binding.value.delay) || 0;
    el.style.setProperty('--reveal-delay', `${delay}ms`);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onScreen = el.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (reduce || onScreen || !('IntersectionObserver' in window)) {
      el.classList.add(SHOWN);
      return;
    }

    el.classList.add('reveal');
    el.revealObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add(SHOWN);
        el.revealObserver.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    el.revealObserver.observe(el);
  },
  unmounted(el) {
    if (el.revealObserver) el.revealObserver.disconnect();
  },
};
