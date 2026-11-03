<template>
  <!-- When it needs a person: the customer's chat and the owner's phone,
       played on one clock (v-reveal on the grid) in the order it happens:
       the ask, the assistant's promise, the alert as the phone buzzes, and
       the owner's reply from Telegram arriving in the customer's chat. -->
  <div v-reveal class="handoff grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
    <div>
      <SplitWords :text="t('landing.handoffTitle')" class="handoff-title"></SplitWords>
      <p class="mt-5 max-w-md leading-relaxed text-night-soft">{{ t('landing.handoffText') }}</p>

      <!-- The owner's phone: the alert buzzes in, the reply goes back. -->
      <div class="phone mt-10" role="group" :aria-label="t('landing.handoffPhone')">
        <div class="phone-screen">
          <span class="notch" aria-hidden="true"></span>
          <div class="beat drop rounded-[var(--radius-thumb)] bg-surface p-3 shadow-[var(--shadow-lift)]" style="--b: 2">
            <p class="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-ink-soft">
              <PhTelegramLogo :size="14" weight="fill" class="shrink-0 text-telegram"></PhTelegramLogo>
              {{ t('landing.handoffAlertApp') }}
              <span class="ml-auto font-normal">{{ t('landing.handoffNow') }}</span>
            </p>
            <p class="mt-1 text-[0.8125rem] leading-snug text-ink">
              {{ t('landing.handoffAlert', { name: 'Nusrat Jahan', phone: '01712 345678' }) }}
            </p>
          </div>
          <p class="beat mt-auto max-w-[88%] self-end rounded-[var(--radius-card)] rounded-br-md bg-telegram px-3 py-2 text-[0.8125rem] leading-snug text-white" style="--b: 3">
            {{ t('landing.handoffTeam') }}
          </p>
          <p class="beat flex items-center gap-1 self-end text-[0.6875rem] text-ink-soft" style="--b: 3.6">
            <PhChecks :size="13" weight="bold" class="shrink-0 text-telegram"></PhChecks>
            {{ t('landing.handoffSent') }}
          </p>
        </div>
      </div>
    </div>

    <figure class="overflow-hidden rounded-[1.5rem] bg-surface text-ink" :aria-label="t('landing.handoffExample')">
      <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <div>
          <p class="text-sm font-semibold">Nusrat Jahan</p>
          <p class="text-xs text-ink-soft">{{ t('landing.handoffWhen') }}</p>
        </div>
        <StatusChip status="needs_human"></StatusChip>
      </div>
      <div class="flex flex-col gap-3 bg-wash px-5 py-6">
        <p class="beat max-w-[85%] self-start rounded-[var(--radius-card)] rounded-tl-md bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-hairline" style="--b: 0">
          {{ t('landing.handoffAsk') }}
        </p>
        <p class="beat max-w-[85%] self-end rounded-[var(--radius-card)] rounded-tr-md bg-brand-tint px-4 py-2.5 text-sm text-ink" style="--b: 1">
          {{ t('landing.handoffReply', { phone: '01712 345678' }) }}
        </p>
        <div class="beat notice items-center" style="--b: 2">
          <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-ink">{{ t('conversations.askedForPerson', { name: 'Nusrat Jahan' }) }}</p>
            <p class="mt-0.5 text-ink-soft">{{ t('conversations.callToPickUp', { phone: '01712 345678' }) }}</p>
          </div>
        </div>
        <div class="beat from-phone max-w-[85%] self-end" style="--b: 4.2">
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
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhChecks, PhTelegramLogo, PhUserSound } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import ExampleTag from './ExampleTag.vue';
import SplitWords from './SplitWords.vue';
import vReveal from '../../directives/reveal.js';

const { t } = useI18n();
</script>

<style scoped>
.handoff-title {
  font-size: clamp(1.75rem, 1.2rem + 1.8vw, 3rem);
  line-height: 1.05;
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.handoff-title:lang(bn) {
  line-height: 1.35;
  letter-spacing: normal;
}

/* The beats play in order once the grid arrives, 0.7s apart. */
.handoff.reveal .beat {
  transition:
    opacity 0.5s var(--ease-settle),
    transform 0.5s var(--ease-settle);
  transition-delay: calc(0.6s + var(--b) * 0.7s);
}

.handoff.reveal:not(.is-shown) .beat {
  opacity: 0;
  transform: translateY(6px);
}

/* The alert drops in from the top of the phone; the owner's reply arrives in
   the chat from the phone's side. */
.handoff.reveal:not(.is-shown) .drop {
  transform: translateY(-14px);
}

.handoff.reveal:not(.is-shown) .from-phone {
  transform: translate(-24px, -6px);
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
  position: relative;
  display: flex;
  min-height: 16rem;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 1.75rem;
  background-color: var(--color-wash);
  padding: 2.25rem 0.75rem 1rem;
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
  animation-delay: calc(0.6s + 2 * 0.7s);
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

/* The alert lands with a pulse of orange: someone is waiting. */
.handoff.reveal.is-shown .notice.beat {
  animation: alert 1.2s ease-out both;
  animation-delay: calc(0.6s + 2 * 0.7s);
}

@keyframes alert {
  0% {
    box-shadow: 0 0 0 0 var(--color-attention-bright);
  }
  100% {
    box-shadow: 0 0 0 12px rgb(255 138 61 / 0);
  }
}
</style>
