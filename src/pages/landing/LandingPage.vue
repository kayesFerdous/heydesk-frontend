<template>
  <!-- The front door for visitors who are not signed in. Same world as the
       app: white desk, paper bands, cobalt only where you can act. The proof
       is the product itself (LandingDemo), never invented customers. -->
  <div class="min-h-dvh bg-surface">
    <header class="sticky top-0 z-30 border-b bg-surface/95 backdrop-blur-sm transition-colors duration-300" :class="scrolled ? 'border-hairline' : 'border-transparent'">
      <nav class="wrap flex h-16 items-center gap-6" aria-label="Main">
        <router-link to="/" aria-label="HeyDesk home"><brand-mark></brand-mark></router-link>
        <div class="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <a href="#how" class="nav-link">How it works</a>
          <a href="#channels" class="nav-link">Channels</a>
          <a href="#setup" class="nav-link">Setup</a>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <router-link to="/sign-in" class="btn btn-quiet btn-sm">Sign in</router-link>
          <router-link :to="signUp" class="btn btn-secondary btn-sm">Get started</router-link>
        </div>
      </nav>
    </header>

    <main>
      <!-- Opening: the offer in one line, one action, then the mechanism at work. -->
      <section class="wrap pt-12 pb-10 sm:pt-16">
        <div class="max-w-[58rem]">
          <h1 class="enter text-[2.125rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-[3.25rem] xl:text-[3.5rem]">
            The front desk that answers every customer, and never guesses an order.
          </h1>
          <p class="enter mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft" style="--i: 1">
            HeyDesk answers your website chat, voice calls and Telegram. It takes orders,
            appointments and messages, and reads every one back to the customer before it
            reaches your inbox.
          </p>
          <div class="enter mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" style="--i: 2">
            <router-link :to="signUp" class="btn btn-primary btn-lg">
              Create your business account
              <ph-arrow-right :size="18" weight="bold"></ph-arrow-right>
            </router-link>
            <p class="text-sm text-ink-soft">
              Setting up takes about five minutes.
              <a href="#how" class="link ml-1">See how it decides</a>
            </p>
          </div>
        </div>
      </section>

      <section class="border-y border-hairline bg-sidebar py-8 sm:py-10" aria-label="See it work">
        <div class="enter wrap" style="--i: 3">
          <landing-demo></landing-demo>
        </div>
      </section>

      <!-- The one idea a competitor cannot copy: the model talks, the system decides. -->
      <section id="how" class="wrap scroll-mt-20 py-20 sm:py-28">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div class="lg:sticky lg:top-28 lg:self-start">
            <h2 class="section-heading">The AI talks. Your prices decide.</h2>
            <p class="mt-5 max-w-md leading-relaxed text-ink-soft">
              A language model is good at conversation and bad at arithmetic. So HeyDesk
              splits the job: the agent talks to your customer, and every price, total and
              time is worked out from your own menu and hours.
            </p>
          </div>

          <!-- As the steps scroll in, each number fills in turn and a line joins
               them: the order an order goes through. -->
          <ol v-reveal class="sequence relative border-t border-hairline">
            <li
              v-for="(item, index) in mechanism"
              :key="item.title"
              class="sequence-step relative flex gap-5 border-b border-hairline py-7"
              :style="{ '--i': index }"
            >
              <span class="step-mark" aria-hidden="true">{{ index + 1 }}</span>
              <div>
                <h3 class="flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
                  {{ item.title }}
                </h3>
                <p class="mt-1.5 max-w-xl leading-relaxed text-ink-soft">{{ item.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- When it needs a person -->
      <section class="border-y border-hairline bg-sidebar">
        <div class="wrap grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div v-reveal>
            <h2 class="section-heading">When it needs a person, it says so.</h2>
            <p class="mt-5 max-w-md leading-relaxed text-ink-soft">
              Some questions are yours to answer. HeyDesk tells the customer someone will
              follow up, puts them at the top of your day with their number, and lets you
              reply from Telegram. Your words appear in their chat.
            </p>
            <ul class="mt-8 flex flex-col gap-3 text-sm">
              <li v-for="point in handoffPoints" :key="point" class="flex items-start gap-2.5">
                <ph-check :size="18" weight="bold" class="mt-px shrink-0 text-brand"></ph-check>
                {{ point }}
              </li>
            </ul>
          </div>

          <figure v-reveal="{ delay: 150 }" class="handoff rounded-[var(--radius-panel)] border border-line-strong bg-surface" aria-label="Example of a conversation that needs a person">
            <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <div>
                <p class="text-sm font-semibold">Nusrat Jahan</p>
                <p class="text-xs text-ink-soft">Chat, today 11:31 AM</p>
              </div>
              <status-chip status="needs_human"></status-chip>
            </div>
            <div class="flex flex-col gap-3 bg-wash px-5 py-5">
              <div class="handoff-notice notice items-center">
                <ph-user-sound :size="20" weight="bold" class="shrink-0 text-attention"></ph-user-sound>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-ink">Nusrat Jahan asked for a person</p>
                  <p class="mt-0.5 text-ink-soft">Call 01712 345678 to pick up where your agent left off.</p>
                </div>
              </div>
              <p class="max-w-[85%] self-start rounded-[var(--radius-panel)] rounded-tl-sm bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-hairline">
                Also, can I talk to a person about my test results?
              </p>
              <p class="max-w-[85%] self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-brand-tint px-4 py-2.5 text-sm text-ink">
                Of course. I have let the clinic know, and someone will call you on 01712 345678.
              </p>
            </div>
            <figcaption class="border-t border-hairline px-5 py-3 text-xs text-ink-soft">
              An example, as it appears in your Conversations.
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- Channels -->
      <section id="channels" class="wrap scroll-mt-20 py-20 sm:py-28">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div>
            <h2 class="section-heading">One agent, wherever your customers write.</h2>
            <p class="mt-5 max-w-md leading-relaxed text-ink-soft">
              The same rules, menu and hours behind every channel, and every conversation
              in one place.
            </p>
          </div>
          <ul v-reveal class="list border-t border-hairline">
            <li
              v-for="(channel, index) in channels"
              :key="channel.name"
              class="flex items-start gap-4 border-b border-hairline py-6"
              :style="{ '--i': index }"
            >
              <component :is="channel.icon" :size="24" class="mt-0.5 shrink-0 text-ink" aria-hidden="true"></component>
              <div>
                <h3 class="font-semibold tracking-[-0.01em]">{{ channel.name }}</h3>
                <p class="mt-1 max-w-lg leading-relaxed text-ink-soft">{{ channel.text }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Setup -->
      <section id="setup" class="scroll-mt-20 border-t border-hairline bg-sidebar">
        <div class="wrap py-20 sm:py-28">
          <div class="max-w-2xl">
            <h2 class="section-heading">Live in about five minutes.</h2>
            <p class="mt-5 leading-relaxed text-ink-soft">
              Start from a restaurant host, a receptionist or a clinic front desk. Change
              anything later: your agent uses it from the next message, with nothing to publish.
            </p>
          </div>

          <!-- The five steps tick to done one after another, like the setup
               guide on Home finishing. -->
          <ol
            v-reveal
            class="setup mt-12 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5"
          >
            <li v-for="(item, index) in setup" :key="item.title" class="bg-surface p-6" :style="{ '--i': index }">
              <span class="setup-mark" aria-hidden="true">
                <span class="setup-number">{{ index + 1 }}</span>
                <ph-check :size="15" weight="bold" class="setup-check"></ph-check>
              </span>
              <h3 class="mt-5 font-semibold tracking-[-0.01em]">{{ item.title }}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ item.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Close -->
      <section class="wrap py-24 sm:py-32">
        <div v-reveal class="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 class="max-w-2xl text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
            Give your customers a front desk that is always there.
          </h2>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
            <router-link :to="signUp" class="btn btn-primary btn-lg">
              Create your business account
              <ph-arrow-right :size="18" weight="bold"></ph-arrow-right>
            </router-link>
            <router-link to="/sign-in" class="link text-sm">Sign in</router-link>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-hairline">
      <div class="wrap flex flex-col gap-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <brand-mark></brand-mark>
        <p>An AI front desk for restaurants, clinics and front offices. © {{ year }} HeyDesk</p>
      </div>
    </footer>
  </div>
</template>

<script>
import {
  PhArrowRight,
  PhCheck,
  PhGlobe,
  PhPhoneCall,
  PhTelegramLogo,
  PhUserSound,
} from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import LandingDemo from '../../components/landing/LandingDemo.vue';
import reveal from '../../directives/reveal.js';

const MECHANISM = [
  {
    title: 'A customer asks',
    text: 'On your website, by voice or on Telegram, at any hour, even when the shop is full.',
  },
  {
    title: 'HeyDesk works out the details',
    text: 'Prices, totals and times come from your menu and your hours, calculated by HeyDesk. The model never makes up a number.',
  },
  {
    title: 'It reads everything back',
    text: 'The customer hears the whole order, with the total, before anything is saved.',
  },
  {
    title: 'Only a clear yes reaches you',
    text: 'Your inbox holds orders the customer already confirmed, each with the conversation it came from.',
  },
];

const HANDOFF_POINTS = [
  'Waiting customers come first on your Home and in Conversations',
  'Their number is one tap away, ready to call back',
  'Every conversation is kept word for word',
];

const CHANNELS = [
  {
    name: 'Website chat',
    icon: PhGlobe,
    text: 'A chat link of your own to share anywhere, or to put on your website.',
  },
  {
    name: 'Voice calls',
    icon: PhPhoneCall,
    text: 'Customers tap Call and talk to the same agent, with the same rules and prices.',
  },
  {
    name: 'Telegram',
    icon: PhTelegramLogo,
    text: 'Connect your bot by pasting its token. Customers chat there, and you can reply from there too.',
  },
];

// The same five steps the owner's Home walks them through (lib/setup.js).
const SETUP = [
  { title: 'Create your agent', text: 'Pick what kind of business you are.' },
  { title: 'Add your details', text: 'Address, opening hours and a number for when someone needs a person.' },
  { title: 'Add your menu', text: 'Or your doctors or services. It only offers what is on the list, at your prices.' },
  { title: 'Try it', text: 'Chat with it the way a customer would.' },
  { title: 'Share it', text: 'Send your chat link, or connect Telegram.' },
];

export default {
  directives: { reveal },
  components: {
    BrandMark,
    LandingDemo,
    StatusChip,
    PhArrowRight,
    PhCheck,
    PhUserSound,
  },
  data() {
    return {
      // The header gets its hairline once the page moves under it.
      scrolled: false,
    };
  },
  computed: {
    signUp() {
      return { path: '/sign-in', query: { mode: 'signup' } };
    },
    mechanism() {
      return MECHANISM;
    },
    handoffPoints() {
      return HANDOFF_POINTS;
    },
    channels() {
      return CHANNELS;
    },
    setup() {
      return SETUP;
    },
    year() {
      return new Date().getFullYear();
    },
  },
  created() {
    document.title = 'HeyDesk: an AI front desk for your business';
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll);
    document.title = 'HeyDesk';
  },
  methods: {
    onScroll() {
      this.scrolled = window.scrollY > 8;
    },
  },
};
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
  font-weight: 600;
  letter-spacing: -0.03em;
  text-wrap: balance;
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
.list.reveal,
.setup.reveal {
  opacity: 1;
  transform: none;
}

.sequence-step,
.list > li,
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

/* The handoff notice drops in after its panel arrives. */
.handoff.reveal .handoff-notice {
  transition:
    opacity 0.5s var(--ease-settle) 0.6s,
    transform 0.5s var(--ease-settle) 0.6s;
}

.handoff.reveal:not(.is-shown) .handoff-notice {
  opacity: 0;
  transform: translateY(-8px);
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
