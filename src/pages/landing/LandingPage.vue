<template>
  <!-- The front door for visitors who are not signed in. Same world as the
       app: white islands on the grey canvas, black only where you can act. The proof
       is the product itself (LandingDemo), never invented customers. -->
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-30 bg-canvas/90 backdrop-blur-sm transition-shadow duration-300" :class="{ 'shadow-[var(--shadow-lift)]': scrolled }">
      <nav class="wrap flex h-16 items-center gap-6" :aria-label="t('shell.mainNav')">
        <router-link to="/" :aria-label="t('landing.home')"><BrandMark></BrandMark></router-link>
        <div class="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <a href="#how" class="nav-link">{{ t('landing.nav.how') }}</a>
          <a href="#features" class="nav-link">{{ t('landing.nav.features') }}</a>
          <a href="#channels" class="nav-link">{{ t('nav.channels') }}</a>
          <a href="#setup" class="nav-link">{{ t('landing.nav.setup') }}</a>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <router-link to="/sign-in" class="btn btn-quiet btn-sm">{{ t('common.signIn') }}</router-link>
          <router-link :to="signUp" class="btn btn-secondary btn-sm">{{ t('landing.getStarted') }}</router-link>
        </div>
      </nav>
    </header>

    <!-- Every band is an island on the grey canvas, like the console: white
         for reading, lime for the demo, black for the hand-off and the close. -->
    <main class="flex flex-col gap-3 px-3">
      <!-- Opening: the offer in one line, one action, then the mechanism at work. -->
      <section class="island pt-12 pb-12 sm:pt-16">
        <div class="wrap">
        <div class="max-w-[58rem]">
          <h1 class="enter text-[2.125rem] leading-[1.04] font-extrabold tracking-[-0.04em] text-balance sm:text-[3.25rem] xl:text-[3.5rem]">
            {{ t('landing.hero') }}
          </h1>
          <p class="enter mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft" style="--i: 1">
            {{ t('landing.heroText') }}
          </p>
          <div class="enter mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" style="--i: 2">
            <router-link :to="signUp" class="btn btn-primary btn-lg">
              {{ t('signIn.signupTitle') }}
              <PhArrowRight :size="18" weight="bold"></PhArrowRight>
            </router-link>
            <p class="text-sm text-ink-soft">
              {{ t('landing.fiveMinutes') }}
              <a href="#how" class="link ml-1">{{ t('landing.seeHow') }}</a>
            </p>
          </div>
        </div>
      </div>
      </section>

      <section class="rounded-[var(--radius-panel)] bg-lime py-8 sm:py-10" :aria-label="t('landing.seeItWork')">
        <div class="enter wrap" style="--i: 3">
          <LandingDemo></LandingDemo>
        </div>
      </section>

      <!-- The one idea a competitor cannot copy: the model talks, the system decides. -->
      <section id="how" class="island scroll-mt-20 py-20 sm:py-28">
        <div class="wrap">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div class="lg:sticky lg:top-28 lg:self-start">
            <h2 class="section-heading">{{ t('landing.howTitle') }}</h2>
            <p class="mt-5 max-w-md leading-relaxed text-ink-soft">{{ t('landing.howText') }}</p>
          </div>

          <!-- As the steps scroll in, each number fills in turn and a line joins
               them: the order an order goes through. -->
          <ol v-reveal class="sequence relative border-t border-hairline">
            <li
              v-for="(key, index) in MECHANISM"
              :key="key"
              class="sequence-step relative flex gap-5 border-b border-hairline py-7"
              :style="{ '--i': index }"
            >
              <span class="step-mark" aria-hidden="true">{{ formatNumber(index + 1) }}</span>
              <div>
                <h3 class="flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
                  {{ t(`landing.mechanism.${key}.title`) }}
                </h3>
                <p class="mt-1.5 max-w-xl leading-relaxed text-ink-soft">{{ t(`landing.mechanism.${key}.text`) }}</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
      </section>

      <!-- Beyond the demo: what else the same agent does, each with its own example. -->
      <section id="features" class="island scroll-mt-20 py-20 sm:py-28">
        <div class="wrap">
          <div class="max-w-2xl">
            <h2 class="section-heading">{{ t('landing.tourTitle') }}</h2>
            <p class="mt-5 leading-relaxed text-ink-soft">{{ t('landing.tourText') }}</p>
          </div>
          <div class="mt-12 lg:mt-4">
            <CapabilityTour></CapabilityTour>
          </div>
        </div>
      </section>

      <!-- When it needs a person -->
      <section class="rounded-[var(--radius-panel)] bg-night text-white">
        <div class="wrap grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div v-reveal>
            <h2 class="section-heading">{{ t('landing.handoffTitle') }}</h2>
            <p class="mt-5 max-w-md leading-relaxed text-night-soft">{{ t('landing.handoffText') }}</p>
            <ul class="mt-8 flex flex-col gap-3 text-sm">
              <li v-for="point in HANDOFF_POINTS" :key="point" class="flex items-start gap-2.5">
                <PhCheck :size="18" weight="bold" class="mt-px shrink-0 text-lime"></PhCheck>
                {{ t(`landing.handoffPoints.${point}`) }}
              </li>
            </ul>
          </div>

          <figure v-reveal="{ delay: 150 }" class="handoff rounded-[var(--radius-card)] bg-surface text-ink" :aria-label="t('landing.handoffExample')">
            <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <div>
                <p class="text-sm font-semibold">Nusrat Jahan</p>
                <p class="text-xs text-ink-soft">{{ t('landing.handoffWhen') }}</p>
              </div>
              <StatusChip status="needs_human"></StatusChip>
            </div>
            <!-- Plays in the order it happens: the ask, the agent's promise, the
                 alert to the owner, and the owner's own reply from Telegram. -->
            <div class="flex flex-col gap-3 bg-wash px-5 py-5">
              <div class="handoff-beat notice items-center" style="--b: 2">
                <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-ink">{{ t('conversations.askedForPerson', { name: 'Nusrat Jahan' }) }}</p>
                  <p class="mt-0.5 text-ink-soft">{{ t('conversations.callToPickUp', { phone: '01712 345678' }) }}</p>
                </div>
              </div>
              <p class="handoff-beat max-w-[85%] self-start rounded-[var(--radius-card)] rounded-tl-md bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-hairline" style="--b: 0">
                {{ t('landing.handoffAsk') }}
              </p>
              <p class="handoff-beat max-w-[85%] self-end rounded-[var(--radius-card)] rounded-tr-md bg-brand-tint px-4 py-2.5 text-sm text-ink" style="--b: 1">
                {{ t('landing.handoffReply', { phone: '01712 345678' }) }}
              </p>
              <div class="handoff-beat max-w-[85%] self-end" style="--b: 3">
                <p class="mb-1 flex items-center justify-end gap-1.5 text-xs text-ink-soft">
                  <PhTelegramLogo :size="14" weight="fill" class="text-telegram"></PhTelegramLogo>
                  {{ t('chat.fromTeam') }}
                </p>
                <p class="rounded-[var(--radius-card)] rounded-tr-md bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-hairline">
                  {{ t('landing.handoffTeam') }}
                </p>
              </div>
            </div>
            <figcaption class="border-t border-hairline px-5 py-3 text-xs text-ink-soft">
              {{ t('landing.handoffCaption') }}
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- Channels -->
      <section id="channels" class="island scroll-mt-20 py-20 sm:py-28">
        <div class="wrap">
          <div class="max-w-2xl">
            <h2 class="section-heading">{{ t('landing.channelsTitle') }}</h2>
            <p class="mt-5 leading-relaxed text-ink-soft">{{ t('landing.channelsText') }}</p>
          </div>
          <div class="mt-12">
            <ChannelFeed></ChannelFeed>
          </div>
        </div>
      </section>

      <!-- Setup -->
      <section id="setup" class="island scroll-mt-20">
        <div class="wrap py-20 sm:py-28">
          <div class="max-w-2xl">
            <h2 class="section-heading">{{ t('landing.setupTitle') }}</h2>
            <p class="mt-5 leading-relaxed text-ink-soft">{{ t('landing.setupText') }}</p>
          </div>

          <!-- The five steps tick to done one after another, like the setup
               guide on Home finishing. -->
          <ol
            v-reveal
            class="setup mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5"
          >
            <li v-for="(key, index) in SETUP" :key="key" class="bg-surface p-6" :style="{ '--i': index }">
              <span class="setup-mark" aria-hidden="true">
                <span class="setup-number">{{ formatNumber(index + 1) }}</span>
                <PhCheck :size="15" weight="bold" class="setup-check"></PhCheck>
              </span>
              <h3 class="mt-5 font-semibold tracking-[-0.01em]">{{ t(`landing.setup.${key}.title`) }}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ t(`landing.setup.${key}.text`) }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Close -->
      <section class="rounded-[var(--radius-panel)] bg-night py-24 text-white sm:py-32">
        <div class="wrap">
        <div v-reveal class="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 class="max-w-2xl text-[2rem] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
            {{ t('landing.closeTitle') }}
          </h2>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
            <router-link :to="signUp" class="btn btn-lime btn-lg">
              {{ t('signIn.signupTitle') }}
              <PhArrowRight :size="18" weight="bold"></PhArrowRight>
            </router-link>
            <router-link to="/sign-in" class="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">{{ t('common.signIn') }}</router-link>
          </div>
        </div>
      </div>
      </section>
    </main>

    <footer>
      <div class="wrap flex flex-col gap-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <BrandMark></BrandMark>
        <p>{{ t('landing.footer', { year: formatNumber(year, { useGrouping: false }) }) }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowRight, PhCheck, PhTelegramLogo, PhUserSound } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import LandingDemo from '../../components/landing/LandingDemo.vue';
import CapabilityTour from '../../components/landing/CapabilityTour.vue';
import ChannelFeed from '../../components/landing/ChannelFeed.vue';
import vReveal from '../../directives/reveal.js';
import { formatNumber } from '../../lib/format.js';

// The words are `landing.<section>.<key>` in the language files.
const MECHANISM = ['ask', 'work', 'readBack', 'yes'];
const HANDOFF_POINTS = ['first', 'number', 'kept'];
// The same five steps the owner's Home walks them through (lib/setup.js).
const SETUP = ['create', 'details', 'list', 'try', 'share'];

const { t } = useI18n();

const signUp = { path: '/sign-in', query: { mode: 'signup' } };
const year = new Date().getFullYear();
// The header gets its hairline once the page moves under it.
const scrolled = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

watchEffect(() => (document.title = t('landing.pageTitle')));
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
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

.section-heading {
  font-size: clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

/* Bengali's joined letters and vowel signs need normal spacing and taller lines. */
.section-heading:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

.nav-link {
  transition: color 150ms;
}

.nav-link:hover {
  color: var(--color-ink);
}

.btn-lg {
  height: 3rem;
  padding-inline: 1.25rem;
  font-size: 0.9375rem;
}

/* A sequence marker: the order carries meaning here (what happens first). */
.step-mark {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink);
  transition:
    background-color 0.4s var(--ease-settle),
    border-color 0.4s var(--ease-settle),
    color 0.4s var(--ease-settle);
  transition-delay: calc(0.3s + var(--i, 0) * 0.35s);
}

/* How it decides: a short line joins each number to the next, drawn in turn. */
.sequence-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 2.625rem;
  left: calc(0.875rem - 0.5px);
  width: 1px;
  height: 100%;
  background-color: var(--color-brand);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.45s var(--ease-settle);
  transition-delay: calc(0.5s + var(--i, 0) * 0.35s);
}

.sequence.is-shown .sequence-step::after {
  transform: none;
}

.sequence.is-shown .step-mark {
  border-color: var(--color-brand);
  background-color: var(--color-brand);
  color: #fff;
}

/* Lists that arrive as a list: each row a beat after the one before. */
.sequence.reveal,
.setup.reveal {
  opacity: 1;
  transform: none;
}

.sequence-step,
.setup > li {
  transition:
    opacity 0.6s var(--ease-settle),
    transform 0.6s var(--ease-settle);
  transition-delay: calc(var(--i, 0) * 0.12s);
}

.reveal:not(.is-shown) .sequence-step,
.reveal:not(.is-shown) > li {
  opacity: 0;
  transform: translateY(12px);
}

/* The hand-off plays in order once its panel arrives, 0.7s a beat. */
.handoff.reveal .handoff-beat {
  transition:
    opacity 0.5s var(--ease-settle),
    transform 0.5s var(--ease-settle);
  transition-delay: calc(0.5s + var(--b) * 0.7s);
}

.handoff.reveal:not(.is-shown) .handoff-beat {
  opacity: 0;
  transform: translateY(6px);
}

/* The owner's alert lands with a pulse of orange: someone is waiting. */
.handoff.reveal.is-shown .notice.handoff-beat {
  animation: alert 1.2s ease-out both;
  animation-delay: calc(0.5s + var(--b) * 0.7s);
}

@keyframes alert {
  0% {
    box-shadow: 0 0 0 0 var(--color-attention-bright);
  }
  100% {
    box-shadow: 0 0 0 10px rgb(255 138 61 / 0);
  }
}

/* Setup: a number becomes a green check, one step after another. */
.setup-mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-line-strong);
  background-color: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 600;
  transition:
    background-color 0.35s var(--ease-settle),
    border-color 0.35s var(--ease-settle);
  transition-delay: calc(0.5s + var(--i) * 0.3s);
}

.setup-number,
.setup-check {
  grid-area: 1 / 1;
  transition:
    opacity 0.25s ease-out,
    transform 0.35s var(--ease-settle);
  transition-delay: calc(0.5s + var(--i) * 0.3s);
}

.setup-check {
  color: #fff;
  opacity: 0;
  transform: scale(0.6);
}

/* The number leaves only once the circle has turned green, never a blank beat. */
.setup-number {
  transition-delay: calc(0.65s + var(--i) * 0.3s);
}

.setup.is-shown .setup-mark {
  border-color: var(--color-success);
  background-color: var(--color-success);
}

.setup.is-shown .setup-number {
  opacity: 0;
}

.setup.is-shown .setup-check {
  opacity: 1;
  transform: none;
}

/* The opening settles in once, a beat apart: headline, line, action, demo. */
@media (prefers-reduced-motion: no-preference) {
  .enter {
    animation: enter 0.8s var(--ease-settle) both;
    animation-delay: calc(0.08s + var(--i, 0) * 0.1s);
  }
}

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-mark,
  .sequence-step::after,
  .setup-mark,
  .setup-number,
  .setup-check {
    transition: none;
  }
}
</style>
