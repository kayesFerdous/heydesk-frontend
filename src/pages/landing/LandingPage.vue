<template>
  <!-- The front door for visitors who are not signed in, told as one story in
       colour: the promise (day), the problem (one night, in black), the answer
       (back to light, on the real screens), the morning after, then what it
       takes to start. Every picture is a real screen on an example shop, and
       says so: no invented customers, logos or figures. -->
  <div class="landing min-h-dvh bg-canvas">
    <header class="site-header" :class="{ 'is-away': away, 'is-scrolled': scrolled }">
      <nav class="wrap flex h-16 items-center gap-6" :aria-label="t('shell.mainNav')">
        <router-link to="/" class="shrink-0" :aria-label="t('landing.home')"><BrandMark></BrandMark></router-link>
        <div class="hidden items-center gap-1 text-sm md:flex">
          <a v-for="link in LINKS" :key="link" :href="`#${link}`" class="nav-link" :class="{ 'is-here': here === link }">
            {{ t(`landing.nav.${link}`) }}
          </a>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <router-link to="/sign-in" class="btn btn-quiet btn-sm">{{ t('common.signIn') }}</router-link>
          <router-link :to="signUp" class="btn btn-secondary btn-sm">{{ t('landing.getStarted') }}</router-link>
        </div>
      </nav>
    </header>

    <main>
      <!-- The promise. -->
      <section ref="opening" class="hero" :class="{ 'is-shown': ready }">
        <div class="wrap">
          <SplitWords tag="h1" :text="t('landing.heroTitle')" class="hero-title"></SplitWords>
          <div class="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
            <p class="rise text-lg leading-relaxed text-pretty" style="--i: 1">{{ t('landing.heroText') }}</p>
            <div class="rise flex flex-col items-start gap-2.5" style="--i: 2">
              <router-link :to="signUp" class="btn btn-primary btn-lg">
                {{ t('landing.startFree') }}
                <PhArrowRight :size="18" weight="bold"></PhArrowRight>
              </router-link>
              <p class="text-sm text-ink-soft">{{ t('landing.heroNote') }}</p>
            </div>
          </div>
        </div>

        <div class="hero-stage wrap-wide rise" style="--i: 3">
          <div class="hero-shot" :style="heroShotStyle">
            <ProductShot name="inbox" :alt="t('landing.shots.inbox')" eager></ProductShot>
            <!-- An order lands while the visitor reads. -->
            <div class="arrival" aria-hidden="true">
              <InboxRow :row="arrival" :time="formatTimeOfArrival"></InboxRow>
              <p class="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                <PhSealCheck :size="14" weight="fill"></PhSealCheck>
                {{ t('demo.confirmed') }}
              </p>
            </div>
          </div>
          <div class="hero-phone" :style="heroPhoneStyle">
            <ProductShot name="home-phone" :alt="t('landing.shots.homePhone')" eager></ProductShot>
          </div>
          <!-- A phone sees the phone's own screen. -->
          <div class="hero-phone-only">
            <ProductShot name="inbox-phone" :alt="t('landing.shots.inbox')" eager></ProductShot>
          </div>
        </div>

        <div class="wrap mt-6 flex flex-col gap-x-8 gap-y-3 md:flex-row md:items-center md:justify-between">
          <p class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span>{{ t('landing.answersOn') }}</span>
            <span v-for="channel in CHANNELS" :key="channel.id" class="inline-flex items-center gap-1.5 font-medium text-ink">
              <component :is="channel.icon" :size="16" weight="fill"></component>
              {{ t(`landing.channels.${channel.id}`) }}
            </span>
          </p>
          <ExampleTag :text="t('landing.shotsNote')"></ExampleTag>
        </div>
      </section>

      <!-- The problem: one night, then what it costs. -->
      <div id="problem" class="pt-24 sm:pt-32">
        <NightStory></NightStory>
        <section class="costs">
          <div class="wrap">
            <h2 v-reveal class="section-title max-w-3xl">{{ t('landing.costs.title') }}</h2>
            <ul class="mt-14 flex flex-col gap-12 sm:mt-20 sm:gap-16">
              <li v-for="(cost, index) in COSTS" :key="cost" v-reveal="{ delay: index * 70 }" class="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                <h3 class="cost-title">{{ t(`landing.costs.${cost}.title`) }}</h3>
                <p class="text-lg leading-relaxed text-night-soft">{{ t(`landing.costs.${cost}.text`) }}</p>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- The turn, and the answer: back to light. -->
      <div id="how" class="chapter bg-surface">
        <div class="wrap pt-28 sm:pt-40">
          <ScrollWords :text="t('landing.turn')" class="max-w-[62rem]"></ScrollWords>
        </div>
        <div class="wrap-wide pt-28 pb-16 sm:pt-40 lg:pb-8">
          <div v-reveal class="max-w-2xl">
            <h2 class="section-title">{{ t('landing.tourTitle') }}</h2>
            <p class="mt-5 text-lg leading-relaxed text-ink-soft">{{ t('landing.tourText') }}</p>
          </div>
          <ScreenTour class="mt-8 lg:mt-0"></ScreenTour>
        </div>
      </div>

      <!-- The morning after: the same clock as the night, the other ending. -->
      <section ref="morning" class="bg-brand-tint pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div class="wrap">
          <div v-reveal class="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-14">
            <h2 class="section-title">{{ t('landing.morningTitle') }}</h2>
            <p class="text-lg leading-relaxed">{{ t('landing.morningText') }}</p>
          </div>
        </div>
        <div class="wrap-wide mt-12 sm:mt-16">
          <div class="morning-shot" :style="morningStyle">
            <ProductShot name="home" :alt="t('landing.shots.home')" phone></ProductShot>
          </div>
        </div>
        <div class="wrap mt-5">
          <ExampleTag :text="t('landing.shotsNote')"></ExampleTag>
        </div>
      </section>

      <!-- The one thing to do on the page. -->
      <section id="try" class="scroll-mt-20 py-24 sm:py-32">
        <div class="wrap">
          <AskTry></AskTry>
        </div>
      </section>

      <!-- What it takes to start. -->
      <section class="band mx-3 bg-surface py-20 sm:py-28">
        <div class="wrap grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <h2 v-reveal class="section-title">{{ t('landing.setupTitle') }}</h2>
            <p class="mt-5 text-lg leading-relaxed text-ink-soft">{{ t('landing.setupText') }}</p>
            <ol class="mt-10 flex flex-col gap-7">
              <li v-for="(step, index) in SETUP" :key="step" v-reveal="{ delay: index * 70 }">
                <h3 class="text-xl font-semibold">{{ t(`landing.setup.${step}.title`) }}</h3>
                <p class="mt-1 leading-relaxed text-ink-soft">{{ t(`landing.setup.${step}.text`) }}</p>
              </li>
            </ol>
          </div>
          <div ref="setupShots" class="setup-shots">
            <div class="setup-back" :style="setupBackStyle">
              <ProductShot name="products" class="setup-crop-back" :alt="t('landing.shots.products')"></ProductShot>
            </div>
            <div class="setup-front" :style="setupFrontStyle">
              <ProductShot name="channels" class="setup-crop" :alt="t('landing.shots.channels')"></ProductShot>
            </div>
          </div>
        </div>
      </section>

      <!-- What it costs. The figures are the backend's PLANS (services/billing.py). -->
      <section id="price" class="scroll-mt-20 py-24 sm:py-32">
        <div class="wrap">
          <div v-reveal class="max-w-3xl">
            <h2 class="section-title">{{ t('landing.priceTitle') }}</h2>
            <p class="mt-5 text-lg leading-relaxed text-ink-soft">{{ t('landing.priceText') }}</p>
          </div>
          <ul class="plans mt-12">
            <li v-for="(plan, index) in PLANS" :key="plan.key" v-reveal="{ delay: index * 60 }" class="plan" :class="{ 'plan-free': !plan.price }">
              <div class="min-w-0 sm:flex-1">
                <h3 class="text-xl font-semibold">{{ t(`billing.plans.${plan.key}`) }}</h3>
                <p class="mt-0.5 text-ink-soft">{{ t(`billing.planFor.${plan.key}`) }}</p>
              </div>
              <p class="text-ink-soft sm:w-56">
                {{ t('landing.planReplies', { n: formatNumber(plan.replies) }) }}<br />
                {{ t('billing.moderators', { n: formatNumber(plan.moderators) }, plan.moderators) }}
              </p>
              <p class="plan-price sm:w-44 sm:text-right">
                {{ plan.price ? formatMoney(plan.price) : t('landing.planFree') }}
                <span class="block text-sm font-normal" :class="plan.price ? 'text-ink-soft' : ''">
                  {{ plan.price ? t('landing.perMonth') : t('landing.planFreeFor') }}
                </span>
              </p>
            </li>
          </ul>
          <p class="mt-5 max-w-3xl text-sm leading-relaxed text-ink-soft">{{ t('landing.priceNote') }}</p>
        </div>
      </section>

      <!-- The questions an owner asks before trusting it. -->
      <section id="faq" class="band mx-3 bg-surface py-20 sm:py-28">
        <div class="wrap grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <h2 v-reveal class="section-title">{{ t('landing.faqTitle') }}</h2>
          <div>
            <details v-for="id in FAQ" :key="id" class="faq">
              <summary>
                <span>{{ t(`landing.faq.${id}.q`) }}</span>
                <PhPlus :size="18" class="faq-mark" aria-hidden="true"></PhPlus>
              </summary>
              <p class="pb-5 leading-relaxed text-ink-soft">{{ t(`landing.faq.${id}.a`) }}</p>
            </details>
          </div>
        </div>
      </section>

      <!-- The close, back on the night it started from. -->
      <section class="close">
        <div v-reveal class="wrap flex flex-col items-start gap-8">
          <SplitWords :text="t('landing.closeTitle')" class="close-title"></SplitWords>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <router-link :to="signUp" class="btn btn-primary btn-lg">
              {{ t('landing.startFree') }}
              <PhArrowRight :size="18" weight="bold"></PhArrowRight>
            </router-link>
            <p class="text-sm">{{ t('landing.heroNote') }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- The name, rising letter by letter as the page reaches its end. -->
    <footer ref="footer" class="overflow-hidden bg-night pt-14 text-white">
      <div class="wrap flex flex-col gap-6 text-sm text-night-soft sm:flex-row sm:items-center sm:justify-between">
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
import { ref, computed, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowRight, PhChatCircle, PhMessengerLogo, PhPlus, PhSealCheck, PhTelegramLogo, PhWhatsappLogo } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import AskTry from '../../components/landing/AskTry.vue';
import ExampleTag from '../../components/landing/ExampleTag.vue';
import InboxRow from '../../components/landing/InboxRow.vue';
import NightStory from '../../components/landing/NightStory.vue';
import ProductShot from '../../components/landing/ProductShot.vue';
import ScreenTour from '../../components/landing/ScreenTour.vue';
import ScrollWords from '../../components/landing/ScrollWords.vue';
import SplitWords from '../../components/landing/SplitWords.vue';
import vReveal from '../../directives/reveal.js';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import { formatMoney, formatNumber, formatTime } from '../../lib/format.js';

const LINKS = ['problem', 'how', 'try', 'price'];
const CHANNELS = [
  { id: 'web', icon: PhChatCircle },
  { id: 'messenger', icon: PhMessengerLogo },
  { id: 'whatsapp', icon: PhWhatsappLogo },
  { id: 'telegram', icon: PhTelegramLogo },
];
const COSTS = ['first', 'same', 'wrong'];
const SETUP = ['add', 'test', 'share'];
const FAQ = ['prices', 'unsure', 'stepIn', 'technical', 'money', 'after', 'kinds'];
// ponytail: copied from backend PLANS (the public page has no API for them); change both together.
const PLANS = [
  { key: 'trial', price: 0, replies: 200, moderators: 1 },
  { key: 'starter', price: 249000, replies: 3000, moderators: 1 },
  { key: 'growth', price: 599000, replies: 12000, moderators: 3 },
  { key: 'pro', price: 1299000, replies: 30000, moderators: 10 },
];

const { t } = useI18n();

const signUp = { path: '/sign-in', query: { mode: 'signup' } };
const year = new Date().getFullYear();

// The opening's words rise in once the page has drawn.
const ready = ref(false);

// The order that lands over the hero's screen, the top row of that screenshot.
const arrival = computed(() => ({
  initials: 'LC',
  name: t('landing.night.people.lamia'),
  code: 'O-118',
  summary: t('landing.arrival'),
  amount: formatMoney(330000),
  status: 'new',
}));
const formatTimeOfArrival = computed(() => formatTime('2026-01-01T07:36:00Z', 'UTC'));

// The hero's screen lies back a little and stands up as the page scrolls.
const opening = ref(null);
const { progress: leaving, reduce } = useScrollProgress(opening, { start: 0, end: -0.6 });
const heroShotStyle = computed(() =>
  reduce ? null : { transform: `perspective(1800px) rotateX(${(1 - leaving.value) * 7}deg)` }
);
const heroPhoneStyle = computed(() =>
  reduce ? null : { transform: `translateY(${-leaving.value * 4}rem)` }
);

// The morning's screen opens to its full width as it comes up the page.
const morning = ref(null);
const { progress: rising } = useScrollProgress(morning, { start: 0.7, end: 0 });
const morningStyle = computed(() => (reduce ? null : { transform: `scale(${0.9 + rising.value * 0.1})` }));

// The two setup screens slide across each other as they pass.
const setupShots = ref(null);
const { progress: passing } = useScrollProgress(setupShots, { start: 1, end: 0.2 });
const setupBackStyle = computed(() => (reduce ? null : { transform: `translateY(${(1 - passing.value) * 2}rem)` }));
const setupFrontStyle = computed(() => (reduce ? null : { transform: `translateY(${(1 - passing.value) * 6}rem)` }));

// The header steps aside while you read down, and comes back as you scroll up.
const scrolled = ref(false);
const away = ref(false);
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
  if (Math.abs(y - lastY) > 6) away.value = y > lastY && y > window.innerHeight * 0.8;
  lastY = y;
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
.wrap,
.wrap-wide {
  width: 100%;
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

.wrap-wide {
  max-width: 90rem;
}

@media (min-width: 640px) {
  .wrap,
  .wrap-wide {
    padding-inline: 2rem;
  }
}

/* Bands that do not reach the edges are rounder than the console's islands. */
.band {
  border-radius: 2rem;
}

/* A plain bar. It steps aside on the way down and comes back on the way up. */
.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  background-color: var(--color-canvas);
  transition:
    transform 0.4s var(--ease-settle),
    background-color 0.2s var(--ease-settle);
}

.site-header.is-scrolled {
  background-color: var(--color-surface);
}

.site-header.is-away {
  transform: translateY(-100%);
}

.nav-link {
  border-radius: var(--radius-control);
  padding: 0.375rem 0.75rem;
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
  color: #fff;
}

.btn-lg {
  height: 3.25rem;
  padding-inline: 1.5rem;
  border-radius: var(--radius-control);
  font-size: 1rem;
}

.btn-lg:active {
  transform: scale(0.97);
}

/* The promise. */
.hero {
  padding-top: 7rem;
}

@media (min-width: 1024px) {
  .hero {
    padding-top: 8rem;
  }
}

.hero-title {
  font-size: clamp(2.75rem, 1.4rem + 5.4vw, 6rem);
  line-height: 0.98;
  font-weight: 600;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.hero-title:lang(bn) {
  line-height: 1.25;
  letter-spacing: normal;
}

.hero-stage {
  position: relative;
  margin-top: 3rem;
}

@media (min-width: 1024px) {
  .hero-stage {
    margin-top: 4rem;
  }
}

/* Screens lie flat, ruled. Only what sits over another screen floats. */
.hero-shot,
.morning-shot,
.setup-back,
.setup-front {
  overflow: hidden;
  border-radius: 1.25rem;
  background-color: var(--color-canvas);
  outline: 1px solid var(--color-line-strong);
}

/* The screen itself shows from a tablet up; a phone gets its own screen. */
.hero-shot {
  display: none;
  position: relative;
  overflow: visible;
  transform-origin: 50% 100%;
  will-change: transform;
}

.hero-shot :deep(img) {
  border-radius: 1.25rem;
}

.hero-phone {
  display: none;
  position: absolute;
  right: 4rem;
  bottom: -2.5rem;
  width: 13rem;
  overflow: hidden;
  border-radius: 1.75rem;
  box-shadow: 0 0 0 6px var(--color-night), var(--shadow-float);
  will-change: transform;
}

.hero-phone-only {
  margin-inline: auto;
  max-width: 19rem;
  overflow: hidden;
  border-radius: 1.75rem;
  outline: 1px solid var(--color-line-strong);
}

@media (min-width: 768px) {
  .hero-shot {
    display: block;
  }

  .hero-phone-only {
    display: none;
  }
}

@media (min-width: 1024px) {
  .hero-phone {
    display: block;
  }
}

/* The order that lands: comes in once, over the top of the screen. */
.arrival {
  position: absolute;
  top: -1.75rem;
  right: 6%;
  width: 25rem;
  border-radius: var(--radius-card);
  background-color: var(--color-surface);
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  box-shadow: var(--shadow-float);
}

@media (max-width: 1023px) {
  .arrival {
    display: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .rise {
    animation: rise 0.9s var(--ease-settle) both;
    animation-delay: calc(0.35s + var(--i, 0) * 0.1s);
  }

  .arrival {
    animation: land 0.6s var(--ease-settle) 1.8s both;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

@keyframes land {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.97);
  }
}

.section-title {
  font-size: clamp(2rem, 1.2rem + 2.6vw, 3.5rem);
  line-height: 1.04;
  font-weight: 600;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.section-title:lang(bn),
.close-title:lang(bn),
.cost-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

/* What the night costs, still in the dark. */
.costs {
  background-color: var(--color-night);
  padding-block: 2rem 9rem;
  color: #fff;
}

.costs .section-title {
  color: #fff;
}

.cost-title {
  font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

/* The light coming back: it slides up over the black, round at the top. */
.chapter {
  position: relative;
  margin-top: -2rem;
  border-radius: 2rem 2rem 0 0;
}

.morning-shot {
  transform-origin: 50% 0;
  will-change: transform;
}

@media (max-width: 767px) {
  .morning-shot {
    margin-inline: auto;
    max-width: 19rem;
    border-radius: 1.75rem;
  }
}

.setup-shots {
  position: relative;
  padding-bottom: 22%;
}

.setup-front {
  position: absolute;
  right: -0.75rem;
  bottom: 0;
  width: 68%;
  aspect-ratio: 3.3;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-float);
}

/* Only the connected rows of the channels screen: its picture is 175% as wide
   as this box, moved so those rows sit in it. The box is cut to their height. */

/* The products screen without the sidebar. */
.setup-back {
  aspect-ratio: 1.96;
}

.setup-crop-back {
  width: 120%;
  margin-top: -1.5%;
  margin-left: -20.6%;
}

.setup-crop {
  width: 175%;
  margin-top: -9.6%;
  margin-left: -51%;
}

.setup-back,
.setup-front {
  will-change: transform;
}

.plans {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 1.25rem;
  background-color: var(--color-surface);
  padding: 1.25rem 1.5rem;
}

@media (min-width: 640px) {
  .plan {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  }
}

/* Where to start: the one plan that costs nothing to try. */
.plan-free {
  background-color: var(--color-night);
  color: #fff;
}

.plan-free p {
  color: var(--color-night-soft);
}

.plan-free .plan-price {
  color: var(--color-lime);
}

.plan-price {
  font-size: 1.75rem;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Native <details>; it eases open where the browser can animate to auto. */
.faq {
  border-bottom: 1px solid var(--color-hairline);
  interpolate-size: allow-keywords;
}

.faq summary {
  display: flex;
  min-height: 3.75rem;
  cursor: pointer;
  list-style: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.faq summary::-webkit-details-marker {
  display: none;
}

.faq-mark {
  flex-shrink: 0;
  transition: transform 0.25s var(--ease-settle);
}

.faq[open] .faq-mark {
  transform: rotate(45deg);
}

.faq::details-content {
  height: 0;
  overflow: clip;
  opacity: 0;
  transition:
    height 0.3s var(--ease-settle),
    opacity 0.3s var(--ease-settle),
    content-visibility 0.3s allow-discrete;
}

.faq[open]::details-content {
  height: auto;
  opacity: 1;
}

/* The close. */
.close {
  margin-top: 0.75rem;
  background-color: var(--color-lime);
  padding-block: 7rem;
}

@media (min-width: 640px) {
  .close {
    padding-block: 10rem;
  }
}

.close-title {
  max-width: 56rem;
  font-size: clamp(2.5rem, 1.2rem + 5vw, 6rem);
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.wordmark {
  display: flex;
  justify-content: center;
  overflow: hidden;
  margin-top: 2.5rem;
  font-size: 23vw;
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: var(--color-lime);
  user-select: none;
}

.wordmark span {
  display: inline-block;
  padding-bottom: 0.06em;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .faq-mark,
  .faq::details-content {
    transition: none;
  }
}
</style>
