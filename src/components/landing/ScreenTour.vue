<template>
  <!-- The answer to each problem, on the real screens. From 1024px the screen
       stays put while the words scroll past it, and it moves to the part each
       one is talking about. Narrower, each step carries its own screen. -->
  <div class="tour">
    <div>
      <article v-for="(step, index) in STEPS" :key="step.id" ref="steps" class="step" :class="{ 'is-open': active === index }">
        <h3 class="step-title">{{ t(`landing.tour.${step.id}.title`) }}</h3>
        <p class="mt-3 text-lg leading-relaxed text-ink-soft">{{ t(`landing.tour.${step.id}.text`) }}</p>
        <div class="step-shot lg:hidden">
          <ProductShot :name="step.shot" :alt="t(`landing.tour.${step.id}.alt`)" phone></ProductShot>
        </div>
      </article>
    </div>

    <div class="stage" aria-hidden="true">
      <div class="frame">
        <div v-for="(step, index) in STEPS" :key="step.id" class="layer" :class="{ 'is-on': active === index }" :style="zoomOf(step)">
          <ProductShot :name="step.shot" alt=""></ProductShot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import ProductShot from './ProductShot.vue';

// `zoom` is how far the screen moves in; `left` and `top` say where its corner
// lands, as shares of the screenshot.
const STEPS = [
  { id: 'answer', shot: 'chats', zoom: 1.62, left: 0.172, top: 0.17 },
  { id: 'list', shot: 'products', zoom: 1.3, left: 0.172, top: 0.02 },
  { id: 'yes', shot: 'inbox', zoom: 1.6, left: 0.375, top: 0.14 },
  { id: 'person', shot: 'person', zoom: 1.55, left: 0.17, top: 0 },
];

const { t } = useI18n();

const active = ref(0);
const steps = ref([]);

// Scaling about point o puts point a at the edge when o = zoom * a / (zoom - 1).
function zoomOf({ zoom, left, top }) {
  const origin = (share) => `${(zoom * share * 100) / (zoom - 1)}%`;
  return { transformOrigin: `${origin(left)} ${origin(top)}`, '--zoom': zoom };
}

// The step crossing the middle of the screen is the open one.
let observer = null;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.value = steps.value.indexOf(entry.target);
      }
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );
  steps.value.forEach((step) => observer.observe(step));
});
onBeforeUnmount(() => observer.disconnect());
</script>

<style scoped>
.tour {
  display: grid;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .tour {
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: 4rem;
  }
}

.step {
  padding-block: 2rem;
}

@media (min-width: 1024px) {
  .step {
    display: flex;
    min-height: 78svh;
    flex-direction: column;
    justify-content: center;
    padding-block: 0;
    opacity: 0.28;
    transition: opacity 0.4s var(--ease-settle);
  }

  .step.is-open {
    opacity: 1;
  }
}

.step-title {
  font-size: clamp(1.625rem, 1.2rem + 1.2vw, 2.25rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.step-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

/* On a phone the screen sits in a device's corners; on a tablet it is wide. */
.step-shot {
  margin: 1.5rem auto 0;
  max-width: 19rem;
  overflow: hidden;
  border-radius: 1.75rem;
  outline: 1px solid var(--color-line-strong);
}

@media (min-width: 768px) {
  .step-shot {
    max-width: none;
    border-radius: 1.25rem;
  }
}

.stage {
  display: none;
}

@media (min-width: 1024px) {
  .stage {
    position: sticky;
    top: calc(50svh - 16rem);
    display: block;
    align-self: start;
    margin-top: calc(39svh - 16rem);
  }
}

.frame {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 1.25rem;
  background-color: var(--color-canvas);
  outline: 1px solid var(--color-line-strong);
}

.layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(calc(var(--zoom) * 0.97));
  transition:
    opacity 0.45s var(--ease-settle),
    transform 1.1s var(--ease-settle);
}

.layer.is-on {
  opacity: 1;
  transform: scale(var(--zoom));
}

@media (prefers-reduced-motion: reduce) {
  .step,
  .layer {
    transition: none;
  }
}
</style>
