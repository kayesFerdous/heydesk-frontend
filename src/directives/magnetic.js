// v-magnetic: a button that leans a little towards the pointer while it is
// over it, and settles back when it leaves. Only with a mouse, and never under
// reduced motion. The landing page's main actions use it.
const PULL = 0.22;

export default {
  mounted(el) {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    el.style.transition = 'transform 0.5s var(--ease-settle)';

    el.magneticMove = (event) => {
      const box = el.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      el.style.transition = 'transform 0.15s ease-out';
      el.style.transform = `translate(${x * PULL}px, ${y * PULL * 1.4}px)`;
    };
    el.magneticLeave = () => {
      el.style.transition = 'transform 0.5s var(--ease-settle)';
      el.style.transform = '';
    };
    el.addEventListener('pointermove', el.magneticMove);
    el.addEventListener('pointerleave', el.magneticLeave);
  },
  unmounted(el) {
    if (!el.magneticMove) return;
    el.removeEventListener('pointermove', el.magneticMove);
    el.removeEventListener('pointerleave', el.magneticLeave);
  },
};
