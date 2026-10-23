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
            <p class="text-sm text-ink-soft">{{ t('landing.fiveMinutes') }}</p>
          </div>
        </div>

        <!-- Every channel into one agent, and on into the inbox. -->
        <div class="enter mt-14 sm:mt-16" style="--i: 3">
          <ChannelFlow></ChannelFlow>
        </div>
      </div>
      </section>

      <section class="rounded-[var(--radius-panel)] bg-lime py-8 sm:py-10" :aria-label="t('landing.seeItWork')">
        <div class="wrap">
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

          <!-- The split, shown: the reply's words arrive with blanks, and each
               number is stamped in from the sum worked out from the menu. -->
          <PriceStamp></PriceStamp>
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

      <!-- When it needs a person: the customer's chat and the owner's phone,
           played on one clock (v-reveal on the grid) in the order it happens. -->
      <section class="rounded-[var(--radius-panel)] bg-night text-white">
        <div v-reveal class="handoff wrap grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 class="section-heading">{{ t('landing.handoffTitle') }}</h2>
            <p class="mt-5 max-w-md leading-relaxed text-night-soft">{{ t('landing.handoffText') }}</p>

            <!-- The owner's phone: the alert buzzes in, the reply goes back. -->
            <div class="phone mt-10" role="group" :aria-label="t('landing.handoffPhone')">
              <div class="phone-screen">
                <span class="notch" aria-hidden="true"></span>
                <div class="handoff-beat drop rounded-[var(--radius-thumb)] bg-surface p-3 shadow-[var(--shadow-lift)]" style="--b: 2">
                  <p class="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-ink-soft">
                    <PhTelegramLogo :size="14" weight="fill" class="shrink-0 text-telegram"></PhTelegramLogo>
                    {{ t('landing.handoffAlertApp') }}
                    <span class="ml-auto font-normal">{{ t('landing.handoffNow') }}</span>
                  </p>
                  <p class="mt-1 text-[0.8125rem] leading-snug text-ink">
                    {{ t('landing.handoffAlert', { name: 'Nusrat Jahan', phone: '01712 345678' }) }}
                  </p>
                </div>
                <p class="handoff-beat mt-auto max-w-[88%] self-end rounded-[var(--radius-card)] rounded-br-md bg-telegram px-3 py-2 text-[0.8125rem] leading-snug text-white" style="--b: 3">
                  {{ t('landing.handoffTeam') }}
                </p>
                <p class="handoff-beat flex items-center gap-1 self-end text-[0.6875rem] text-ink-soft" style="--b: 3.6">
                  <PhChecks :size="13" weight="bold" class="shrink-0 text-telegram"></PhChecks>
                  {{ t('landing.handoffSent') }}
                </p>
              </div>
            </div>
          </div>

          <figure class="rounded-[var(--radius-card)] bg-surface text-ink" :aria-label="t('landing.handoffExample')">
            <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <div>
                <p class="text-sm font-semibold">Nusrat Jahan</p>
                <p class="text-xs text-ink-soft">{{ t('landing.handoffWhen') }}</p>
              </div>
              <StatusChip status="needs_human"></StatusChip>
            </div>
            <!-- The ask, the agent's promise, the alert to the owner, and the
                 owner's reply arriving from the phone. -->
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
              <div class="handoff-beat from-phone max-w-[85%] self-end" style="--b: 4.2">
                <p class="mb-1 flex items-center justify-end gap-1.5 text-xs text-ink-soft">
                  <PhTelegramLogo :size="14" weight="fill" class="text-telegram"></PhTelegramLogo>
                  {{ t('chat.fromTeam') }}
                </p>
                <p class="rounded-[var(--radius-card)] rounded-tr-md bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-hairline">
                  {{ t('landing.handoffTeam') }}
                </p>
              </div>
            </div>
            <figcaption class="border-t border-hairline px-5 py-3">
              <ExampleTag></ExampleTag>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- Setup -->
      <section id="setup" class="island scroll-mt-20">
        <div class="wrap py-20 sm:py-28">
          <div class="max-w-2xl">
            <h2 class="section-heading">{{ t('landing.setupTitle') }}</h2>
            <p class="mt-5 leading-relaxed text-ink-soft">{{ t('landing.setupText') }}</p>
          </div>

          <!-- The steps played out: each one builds the agent beside it. -->
          <div class="mt-12">
            <SetupLive></SetupLive>
          </div>
        </div>
      </section>

      <!-- Close: the promise, the action, and the night it covers. -->
      <section class="rounded-[var(--radius-panel)] bg-night py-24 text-white sm:py-32">
        <div class="wrap grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
          <div v-reveal class="flex flex-col items-start gap-8">
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
          <NightShift></NightShift>
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
import { PhArrowRight, PhChecks, PhTelegramLogo, PhUserSound } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import LandingDemo from '../../components/landing/LandingDemo.vue';
import CapabilityTour from '../../components/landing/CapabilityTour.vue';
import ChannelFlow from '../../components/landing/ChannelFlow.vue';
import SetupLive from '../../components/landing/SetupLive.vue';
import ExampleTag from '../../components/landing/ExampleTag.vue';
import NightShift from '../../components/landing/NightShift.vue';
import PriceStamp from '../../components/landing/PriceStamp.vue';
import vReveal from '../../directives/reveal.js';
import { formatNumber } from '../../lib/format.js';


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

/* The alert drops in from the top of the phone; the owner's reply arrives in
   the chat from the phone's side. */
.handoff.reveal:not(.is-shown) .drop {
  transform: translateY(-14px);
}

.handoff.reveal:not(.is-shown) .from-phone {
  transform: translate(-20px, -6px);
}

/* The owner's phone, drawn plainly: a black frame round a light screen. */
.phone {
  width: 100%;
  max-width: 17rem;
  border-radius: 2.25rem;
  background-color: #000;
  padding: 0.5rem;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.14);
}

.phone-screen {
  display: flex;
  min-height: 16rem;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 1.75rem;
  background-color: var(--color-wash);
  padding: 2.25rem 0.75rem 1rem;
  position: relative;
}

.notch {
  position: absolute;
  top: 0.625rem;
  left: 50%;
  width: 4.5rem;
  height: 1.125rem;
  border-radius: 9999px;
  background-color: #000;
  transform: translateX(-50%);
}

/* It buzzes as the alert arrives, the same beat as the orange pulse. */
.handoff.reveal.is-shown .phone {
  animation: buzz 0.6s linear both;
  animation-delay: calc(0.5s + 2 * 0.7s);
}

@keyframes buzz {
  0%,
  100% {
    transform: none;
  }
  10%,
  50%,
  90% {
    transform: translateX(-2px) rotate(-1.2deg);
  }
  30%,
  70% {
    transform: translateX(2px) rotate(1.2deg);
  }
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
</style>
