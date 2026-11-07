<template>
  <!-- The promise, shown working: customers' messages come in around the console,
       get an answer, and fly in as orders. The takings roll up, and the owner's
       phone hears about each one. Plain HTML at its real size, never scaled, so
       the words stay sharp. It runs while it is on screen. -->
  <div ref="root" class="hero-console">
    <div class="console" role="img" :aria-label="t('landing.shots.inbox')">
      <div class="shell" inert>
        <aside class="rail">
          <BrandMark mark-only class="mb-4 ml-2"></BrandMark>
          <p v-for="item in NAV" :key="item.id" class="rail-item" :class="{ 'is-open': item.id === 'inbox' }">
            <component :is="item.icon" :size="20" :weight="item.id === 'inbox' ? 'fill' : 'regular'"></component>
            <span class="flex-1">{{ t(item.label) }}</span>
            <span v-if="item.id === 'inbox'" :key="waiting" class="badge pop">{{ formatNumber(waiting) }}</span>
            <span v-if="item.id === 'chats'" class="badge badge-orange">{{ formatNumber(1) }}</span>
          </p>
        </aside>
        <div class="min-w-0 p-4 sm:p-6">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{{ t('nav.inbox') }}</p>
              <p class="mt-1 text-sm text-ink-soft">{{ t('records.tabs.order') }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-ink-soft">{{ t('home.figures.taken') }}</p>
              <p class="takings"><RollingNumber :value="taken" money></RollingNumber></p>
            </div>
          </div>
          <TransitionGroup tag="ul" name="order" class="island list">
            <li v-for="order in rows" :key="order.code" class="order-row">
              <span class="avatar" :class="order.tint">{{ order.initials }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ t(`landing.night.people.${order.person}`) }} <span class="serial ml-1 text-ink-soft">O-{{ order.code }}</span></span>
                <span class="block truncate text-sm text-ink-soft">{{ t(`landing.products.${order.product}`) }}</span>
              </span>
              <component :is="order.icon" :size="20" weight="fill" class="wide-only text-ink-faint"></component>
              <StatusChip status="new" class="wide-only"></StatusChip>
              <span class="shrink-0 text-right font-semibold">{{ formatMoney(order.amount) }}</span>
            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- The message on its way in. -->
    <Transition name="bubble">
      <div v-if="!reduce && step < 3" :key="round" class="bubble" :class="[side, { 'is-flying': step === 2 }]" aria-hidden="true">
        <p class="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <component :is="incoming.icon" :size="15" weight="fill"></component>
          {{ t(`landing.night.people.${incoming.person}`) }}
        </p>
        <p class="mt-1 font-medium">{{ t(`landing.night.says.${incoming.person}`) }}</p>
        <p v-if="step >= 1" class="answered">
          <PhSealCheck :size="15" weight="fill"></PhSealCheck>
          {{ t('records.confirmedShort') }}
        </p>
      </div>
    </Transition>

    <!-- The owner's phone. -->
    <div class="phone" aria-hidden="true">
      <p class="flex items-center justify-between font-semibold">
        {{ t('home.needsYou') }}
        <span :key="waiting" class="count count-attention pop">{{ formatNumber(waiting) }}</span>
      </p>
      <TransitionGroup tag="ul" name="order" class="relative mt-3 flex flex-col gap-1.5">
        <li v-for="order in rows.slice(0, 3)" :key="order.code" class="phone-row">
          <span class="truncate">{{ t(`landing.night.people.${order.person}`) }}</span>
          <span class="shrink-0 font-semibold">{{ formatMoney(order.amount) }}</span>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatCircle, PhChatsCircle, PhHouse, PhMessengerLogo, PhSealCheck, PhTelegramLogo, PhTray, PhTShirt, PhWhatsappLogo } from '@phosphor-icons/vue';

import RollingNumber from './RollingNumber.vue';
import BrandMark from '../ui/BrandMark.vue';
import StatusChip from '../ui/StatusChip.vue';
import { useSceneClock } from '../../composables/useSceneClock.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

const NAV = [
  { id: 'home', label: 'nav.home', icon: PhHouse },
  { id: 'inbox', label: 'nav.inbox', icon: PhTray },
  { id: 'chats', label: 'nav.chats', icon: PhChatsCircle },
  { id: 'products', label: 'presets.items.shop', icon: PhTShirt },
];

// The night's customers, this time answered.
const CUSTOMERS = [
  { person: 'ritu', initials: 'RP', tint: 'bg-tint-sand', product: 'lawn', amount: 251000, icon: PhChatCircle },
  { person: 'imran', initials: 'IK', tint: 'bg-tint-sky', product: 'kurti', amount: 107000, icon: PhTelegramLogo },
  { person: 'tania', initials: 'TF', tint: 'bg-tint-lilac', product: 'kids', amount: 188000, icon: PhMessengerLogo },
  { person: 'sabbir', initials: 'SH', tint: 'bg-tint-sky', product: 'cotton', amount: 191000, icon: PhMessengerLogo },
  { person: 'mim', initials: 'MA', tint: 'bg-tint-sand', product: 'kurti', amount: 196000, icon: PhChatCircle },
  { person: 'nusrat', initials: 'NJ', tint: 'bg-tint-lilac', product: 'lawn', amount: 257000, icon: PhWhatsappLogo },
];
const SHOWN = 4;
const FIRST = 3;
const orderOf = (nth) => ({ ...CUSTOMERS[nth % CUSTOMERS.length], code: 111 + nth });

const { t } = useI18n();

const root = ref(null);
// Message in, answered, flying, arrived.
const { step, round, reduce } = useSceneClock({ root, times: [1300, 1300, 450], loop: true, rest: 600 });

const rows = ref(Array.from({ length: FIRST }, (_, nth) => orderOf(FIRST - 1 - nth)));
const taken = ref(rows.value.reduce((sum, order) => sum + order.amount, 0));
const waiting = ref(FIRST + 2);
const incoming = computed(() => orderOf(FIRST + round.value));
const side = computed(() => (round.value % 2 ? 'is-right' : 'is-left'));

watch(step, (now) => {
  if (now !== 3 || reduce) return;
  rows.value = [incoming.value, ...rows.value].slice(0, SHOWN);
  taken.value += incoming.value.amount;
  waiting.value += 1;
});
</script>

<style scoped>
.hero-console {
  position: relative;
  margin-inline: auto;
  max-width: 62rem;
}

.console {
  container-type: inline-size;
  overflow: hidden;
  border-radius: 1.25rem;
  background-color: var(--color-canvas);
  outline: 1px solid var(--color-line-strong);
}

.shell {
  display: grid;
  grid-template-columns: 11rem minmax(0, 1fr);
  user-select: none;
}

.rail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background-color: var(--color-night);
  padding: 1.25rem 0.75rem;
  color: var(--color-night-soft);
}

.rail-item {
  display: flex;
  height: 2.5rem;
  align-items: center;
  gap: 0.625rem;
  border-radius: var(--radius-control);
  padding-inline: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.rail-item.is-open {
  background-color: var(--color-night-tile);
  color: #fff;
}

.rail-item.is-open :deep(svg) {
  color: var(--color-lime);
}

.badge {
  display: grid;
  height: 1.375rem;
  min-width: 1.375rem;
  place-items: center;
  border-radius: 999px;
  background-color: var(--color-night-tile);
  padding-inline: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

.badge-orange {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}

.takings {
  font-size: 1.75rem;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Tall enough for its four rows from the start, so nothing below it jumps. */
.list {
  position: relative;
  margin-top: 1.25rem;
  height: 18rem;
  overflow: hidden;
}

.order-row {
  display: flex;
  height: 4.5rem;
  width: 100%;
  align-items: center;
  gap: 0.875rem;
  border-bottom: 1px solid var(--color-hairline);
  background-color: var(--color-surface);
  padding-inline: 1.25rem;
}

.order-row:last-child {
  border-bottom: 0;
}

.avatar {
  display: grid;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* A narrow box is a phone's screen: no sidebar, only what a row can't lose. */
@container (max-width: 44rem) {
  .shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .rail,
  .wide-only {
    display: none;
  }

  .order-row {
    padding-inline: 0.875rem;
  }
}

.bubble,
.phone {
  display: none;
}

@media (min-width: 1024px) {
  .bubble {
    position: absolute;
    z-index: 2;
    display: block;
    width: 16rem;
    border-radius: var(--radius-card);
    background-color: var(--color-surface);
    padding: 0.875rem 1rem;
    box-shadow: var(--shadow-float);
    transition:
      transform 0.45s cubic-bezier(0.55, 0, 0.8, 0.3),
      opacity 0.45s ease-in;
  }

  .bubble.is-left {
    top: 14%;
    left: -6rem;
    --fly-x: 26rem;
    --fly-y: 9rem;
  }

  .bubble.is-right {
    top: -3.5rem;
    right: -6rem;
    --fly-x: -26rem;
    --fly-y: 14rem;
  }

  /* Down into the top of the list. */
  .bubble.is-flying {
    opacity: 0;
    transform: translate(var(--fly-x), var(--fly-y)) scale(0.55);
  }
}

/* Only where it can stand beside the list without covering its figures. */
@media (min-width: 1280px) {
  .phone {
    position: absolute;
    right: -5rem;
    bottom: -2.5rem;
    z-index: 1;
    display: block;
    width: 14rem;
    border-radius: 1.75rem;
    background-color: var(--color-surface);
    padding: 1.125rem 0.875rem;
    font-size: 0.875rem;
    box-shadow: 0 0 0 6px var(--color-night), var(--shadow-float);
  }
}

.answered {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-success);
  animation: answered 0.4s var(--ease-settle);
}

.phone-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: var(--radius-thumb);
  background-color: var(--color-wash);
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
}

@media (prefers-reduced-motion: no-preference) {
  /* A new order drops in lit lime and settles to white, pushing the rest down. */
  .order-enter-active {
    animation: order-in 1.1s var(--ease-settle);
  }

  .order-move {
    transition: transform 0.6s var(--ease-settle);
  }

  .order-leave-active {
    position: absolute;
    transition: opacity 0.25s;
  }

  .order-leave-to {
    opacity: 0;
  }

  .bubble-enter-active {
    animation: bubble-in 0.55s var(--ease-settle);
  }

  .pop {
    animation: pop 0.5s var(--ease-settle);
  }
}

@keyframes order-in {
  0% {
    opacity: 0;
    transform: translateY(-30%);
    background-color: var(--color-lime);
  }
  35% {
    opacity: 1;
    transform: none;
    background-color: var(--color-lime);
  }
}

@keyframes bubble-in {
  from {
    opacity: 0;
    transform: translateY(1.5rem) scale(0.85);
  }
}

@keyframes answered {
  from {
    opacity: 0;
    transform: translateY(0.375rem);
  }
}

@keyframes pop {
  from {
    transform: scale(1.7);
  }
}
</style>
