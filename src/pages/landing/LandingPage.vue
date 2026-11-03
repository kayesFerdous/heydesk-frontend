<template>
  <!-- The front door for visitors who are not signed in, told as a story the
       scroll runs: the desk at night, what customers ask, how an order is
       made, what else it does, when it needs a person, setup, the close.
       Same world as the app: black for the action, lime for "you are here".
       The proof is the product itself, labelled as an example, never
       invented customers. -->
  <div class="landing min-h-dvh bg-canvas">
    <!-- How far down the page you are. -->
    <span class="page-progress" :style="{ transform: `scaleX(${pageProgress})` }" aria-hidden="true"></span>

    <!-- A floating pill: it steps aside while you read down, and comes back
         as soon as you scroll up. The section you are in is marked lime. -->
    <header class="site-header" :class="{ 'is-away': away, 'is-scrolled': scrolled }">
      <nav class="flex h-14 items-center gap-2 rounded-full bg-surface/95 pr-2 pl-5 backdrop-blur-md sm:gap-6" :aria-label="t('shell.mainNav')">
        <router-link to="/" class="shrink-0" :aria-label="t('landing.home')"><BrandMark></BrandMark></router-link>
        <div class="hidden items-center gap-1 text-sm md:flex">
          <a v-for="link in LINKS" :key="link" :href="`#${link}`" class="nav-link" :class="{ 'is-here': here === link }">
            {{ t(`landing.nav.${link}`) }}
          </a>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <router-link to="/sign-in" class="btn btn-quiet btn-sm">{{ t('common.signIn') }}</router-link>
          <router-link :to="signUp" class="btn btn-primary btn-sm rounded-full">{{ t('landing.getStarted') }}</router-link>
        </div>
      </nav>
    </header>

    <main>
      <!-- The opening. From 1024px it pins and recedes as the next band
           slides up over it. -->
      <div ref="opening" class="relative">
        <div class="hero-pin">
          <section class="hero" :class="{ 'is-shown': ready }" :style="heroStyle" @pointermove="spot">
            <span class="dots" aria-hidden="true"></span>
            <span class="dots dots-lit" :style="{ '--x': `${light.x}px`, '--y': `${light.y}px` }" aria-hidden="true"></span>

            <div class="hero-inner wrap" :style="innerStyle">
              <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
                <div>
                  <h1 class="hero-title">
                    <SplitWords tag="span" :text="t('landing.heroLead')" class="block"></SplitWords>
                    <SplitWords tag="span" :text="t('landing.heroMark')" :from="leadWords" class="block text-lime"></SplitWords>
                  </h1>
                  <p class="rise mt-7 max-w-xl text-lg leading-relaxed text-night-soft" style="--i: 1">{{ t('landing.heroText') }}</p>
                  <div class="rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style="--i: 2">
                    <router-link v-magnetic :to="signUp" class="btn btn-lime btn-lg">
                      {{ t('signIn.signupTitle') }}
                      <PhArrowRight :size="18" weight="bold"></PhArrowRight>
                    </router-link>
                    <p class="text-sm text-night-soft">{{ t('landing.fiveMinutes') }}</p>
                  </div>
                </div>
                <HeroDesk class="rise" style="--i: 3"></HeroDesk>
              </div>

              <!-- Where it answers. -->
              <p class="rise mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-night-soft lg:mt-14" style="--i: 4">
                <span>{{ t('landing.answersOn') }}</span>
                <span v-for="channel in CHANNELS" :key="channel.id" class="inline-flex items-center gap-1.5 text-white">
                  <component :is="channel.icon" :size="16" weight="fill"></component>
                  {{ t(`landing.channels.${channel.id}.name`) }}
                </span>
              </p>
            </div>
          </section>
        </div>

        <!-- The band that slides over the opening: what customers ask, then
             what HeyDesk does about it, read at the pace of the scroll. -->
        <section class="cover">
          <AskMarquee></AskMarquee>
          <div class="wrap mt-24 sm:mt-32">
            <ScrollWords :text="t('landing.manifesto')" class="max-w-[64rem]"></ScrollWords>
          </div>
        </section>
      </div>

      <div id="how" class="scroll-mt-0">
        <OrderStory></OrderStory>
      </div>

      <div id="features">
        <CapabilityRail></CapabilityRail>
      </div>

      <section class="band mx-3 bg-night py-24 text-white sm:py-32">
        <div class="wrap">
          <HandoffScene></HandoffScene>
        </div>
      </section>

      <section id="setup" class="scroll-mt-16 py-24 sm:py-32">
        <div class="wrap">
          <div v-reveal class="max-w-2xl">
            <SplitWords :text="t('landing.setupTitle')" class="section-title"></SplitWords>
            <p class="mt-5 leading-relaxed text-ink-soft">{{ t('landing.setupText') }}</p>
          </div>
          <div v-reveal="{ delay: 150 }" class="band mt-12 bg-surface p-5 ring-1 ring-hairline sm:p-8">
            <SetupLive></SetupLive>
          </div>
        </div>
      </section>

      <!-- The close: the promise, the action, and the night it covers. -->
      <section class="band mx-3 bg-night py-24 text-white sm:py-32">
        <div class="wrap grid items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
          <div v-reveal class="flex flex-col items-start gap-9">
            <SplitWords :text="t('landing.closeTitle')" class="close-title"></SplitWords>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
              <router-link v-magnetic :to="signUp" class="btn btn-lime btn-lg">
                {{ t('signIn.signupTitle') }}
                <PhArrowRight :size="18" weight="bold"></PhArrowRight>
              </router-link>
              <router-link to="/sign-in" class="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">{{ t('common.signIn') }}</router-link>
            </div>
          </div>
          <NightShift></NightShift>
        </div>
      </section>
    </main>

    <!-- The name, rising letter by letter as the page reaches its end. -->
    <footer ref="footer" class="overflow-hidden pt-16">
      <div class="wrap flex flex-col gap-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>{{ t('landing.footer', { year: formatNumber(year, { useGrouping: false }) }) }}</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2">
          <a v-for="link in LINKS" :key="link" :href="`#${link}`" class="nav-foot">{{ t(`landing.nav.${link}`) }}</a>
          <router-link to="/sign-in" class="nav-foot">{{ t('common.signIn') }}</router-link>
        </div>
      </div>
      <p class="wordmark" aria-hidden="true">
        <span v-for="(letter, index) in wordmark" :key="index" :style="{ transform: `translateY(${letterRise(index)}%)` }">{{ letter }}</span>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowRight, PhChatCircle, PhMessengerLogo, PhMicrophone, PhTelegramLogo, PhWhatsappLogo } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import AskMarquee from '../../components/landing/AskMarquee.vue';
import CapabilityRail from '../../components/landing/CapabilityRail.vue';
import HandoffScene from '../../components/landing/HandoffScene.vue';
import HeroDesk from '../../components/landing/HeroDesk.vue';
import NightShift from '../../components/landing/NightShift.vue';
import OrderStory from '../../components/landing/OrderStory.vue';
import ScrollWords from '../../components/landing/ScrollWords.vue';
import SetupLive from '../../components/landing/SetupLive.vue';
import SplitWords from '../../components/landing/SplitWords.vue';
import vMagnetic from '../../directives/magnetic.js';
import vReveal from '../../directives/reveal.js';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatNumber } from '../../lib/format.js';

const LINKS = ['how', 'features', 'setup'];
const CHANNELS = [
  { id: 'web', icon: PhChatCircle },
  { id: 'whatsapp', icon: PhWhatsappLogo },
  { id: 'messenger', icon: PhMessengerLogo },
  { id: 'telegram', icon: PhTelegramLogo },
  { id: 'voice', icon: PhMicrophone },
];

const { t } = useI18n();

const signUp = { path: '/sign-in', query: { mode: 'signup' } };
const year = new Date().getFullYear();

// The opening's words rise in once the page has drawn.
const ready = ref(false);
const leadWords = computed(() => t('landing.heroLead').split(' ').length);

// As the opening scrolls away (one screen), it shrinks back and dims.
const opening = ref(null);
// Under reduced motion it stays as it is.
const { progress: leaving, reduce } = useScrollProgress(opening, { start: 0, end: -1 });
const heroStyle = computed(() =>
  reduce ? null : { transform: `scale(${1 - 0.07 * leaving.value})`, borderRadius: `${2 + leaving.value * 1.5}rem` }
);
const innerStyle = computed(() =>
  reduce ? null : { transform: `translateY(${-leaving.value * 6}rem)`, opacity: 1 - leaving.value * 0.9 }
);

// A soft light over the dot grid follows the pointer.
const light = reactive({ x: 900, y: 260 });
function spot(event) {
  const box = event.currentTarget.getBoundingClientRect();
  light.x = event.clientX - box.left;
  light.y = event.clientY - box.top;
}

// The header and the progress line follow the page.
const scrolled = ref(false);
const away = ref(false);
const pageProgress = ref(0);
const here = ref('');
let lastY = 0;
let frame = null;

// The footer's letters rise as the last stretch of the page goes by.
const footer = ref(null);
const footerIn = ref(0);
const wordmark = computed(() => [...t('landing.wordmark')]);
const letterRise = (index) => {
  if (reduce) return 0;
  const own = Math.min(1, Math.max(0, footerIn.value * 1.5 - index * 0.07));
  return (1 - own) * 100;
};

function measure() {
  frame = null;
  const y = window.scrollY;
  const end = document.documentElement.scrollHeight - window.innerHeight;
  scrolled.value = y > 8;
  // It steps aside on the way down, past the first screen, and comes back on the way up.
  if (Math.abs(y - lastY) > 6) away.value = y > lastY && y > window.innerHeight * 0.8;
  lastY = y;
  pageProgress.value = end > 0 ? y / end : 0;
  if (footer.value) {
    footerIn.value = Math.min(1, Math.max(0, 1 - (end - y) / footer.value.offsetHeight));
  }
}

function onScroll() {
  if (frame === null) frame = requestAnimationFrame(measure);
}

// The section crossing the middle of the screen is marked in the header.
let observer = null;
function onCross(entries) {
  for (const entry of entries) {
    if (entry.isIntersecting) here.value = entry.target.id;
    else if (here.value === entry.target.id) here.value = '';
  }
}

watchEffect(() => (document.title = t('landing.pageTitle')));

onMounted(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => (ready.value = true)));
  window.addEventListener('scroll', onScroll, { passive: true });
  measure();
  observer = new IntersectionObserver(onCross, { rootMargin: '-50% 0px -50% 0px' });
  LINKS.forEach((id) => observer.observe(document.getElementById(id)));
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  if (frame !== null) cancelAnimationFrame(frame);
  observer.disconnect();
  document.title = 'HeyDesk';
});
</script>

<style scoped>
.wrap {
  width: 100%;
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

@media (min-width: 640px) {
  .wrap {
    padding-inline: 2rem;
  }
}

/* The landing page's bands are rounder than the console's islands: they
   are as wide as the screen. */
.band {
  border-radius: 2rem;
}

.page-progress {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  height: 3px;
  background-color: var(--color-lime);
  transform-origin: left;
}

/* The header: a white pill floating over the page. */
.site-header {
  position: fixed;
  inset: 0.75rem 0.75rem auto;
  z-index: 40;
  max-width: 64rem;
  margin-inline: auto;
  border-radius: 9999px;
  box-shadow: 0 0 0 1px rgb(17 17 17 / 0.06);
  transition:
    transform 0.5s var(--ease-settle),
    box-shadow 0.3s var(--ease-settle);
}

.site-header.is-scrolled {
  box-shadow: var(--shadow-float);
}

.site-header.is-away {
  transform: translateY(calc(-100% - 1.5rem));
}

@media (min-width: 1024px) {
  .site-header {
    inset-inline: 1.5rem;
  }
}

.nav-link {
  position: relative;
  border-radius: 9999px;
  padding: 0.375rem 0.875rem;
  color: var(--color-ink-soft);
  transition:
    color 0.15s,
    background-color 0.15s;
}

.nav-link:hover {
  color: var(--color-ink);
}

/* Lime is "you are here": the section the page is in. */
.nav-link.is-here {
  background-color: var(--color-lime);
  color: var(--color-ink);
}

.nav-foot:hover {
  color: var(--color-ink);
}

.btn-lg {
  height: 3.25rem;
  padding-inline: 1.5rem;
  border-radius: 9999px;
  font-size: 1rem;
}

/* The opening: a black band the height of the screen. */
.hero-pin {
  padding: 0.75rem;
}

.hero {
  position: relative;
  display: flex;
  min-height: calc(100dvh - 1.5rem);
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  border-radius: 2rem;
  background-color: var(--color-night);
  padding-top: 7rem;
  padding-bottom: 3rem;
  color: #fff;
  transform-origin: 50% 0;
  will-change: transform;
}

@media (min-width: 1024px) {
  .hero-pin {
    position: sticky;
    top: 0;
    height: 100dvh;
  }

  .hero {
    height: 100%;
    min-height: 0;
    padding-top: 5rem;
    padding-bottom: 1.5rem;
  }
}

.hero-inner {
  position: relative;
}

.hero-title {
  font-size: clamp(2.5rem, min(6.6vw, 9.4vh), 5.5rem);
  line-height: 0.98;
  font-weight: 600;
  letter-spacing: -0.045em;
}

.hero-title:lang(bn) {
  line-height: 1.3;
  letter-spacing: normal;
}

/* A dot grid over the black, brighter in a circle round the pointer. */
.dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1.5px);
  background-size: 26px 26px;
  pointer-events: none;
}

.dots-lit {
  background-image: radial-gradient(rgb(212 243 107 / 0.55) 1px, transparent 1.5px);
  mask-image: radial-gradient(22rem circle at var(--x) var(--y), #000, transparent 70%);
}

/* The band that slides up over the opening. */
.cover {
  position: relative;
  z-index: 10;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--color-canvas);
  padding-top: 5rem;
  padding-bottom: 4rem;
}

@media (min-width: 1024px) {
  .cover {
    box-shadow: 0 -40px 80px -40px rgb(0 0 0 / 0.45);
  }
}

.section-title {
  font-size: clamp(1.75rem, 1.2rem + 1.8vw, 3rem);
  line-height: 1.05;
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.close-title {
  max-width: 40rem;
  font-size: clamp(2.25rem, 1.4rem + 3vw, 4.25rem);
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.section-title:lang(bn),
.close-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

.wordmark {
  display: flex;
  justify-content: center;
  overflow: hidden;
  margin-top: 2rem;
  font-size: 23vw;
  line-height: 0.78;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: var(--color-ink);
  user-select: none;
}

.wordmark span {
  display: inline-block;
  padding-bottom: 0.08em;
  will-change: transform;
}

/* The rest of the opening settles in once, a beat after the headline. */
@media (prefers-reduced-motion: no-preference) {
  .rise {
    animation: rise 1s var(--ease-settle) both;
    animation-delay: calc(0.45s + var(--i, 0) * 0.12s);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .hero {
    transition: none;
  }
}
</style>
