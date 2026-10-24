<template>
  <!-- What a tool showed beside the agent's words (backend D110). The backend
       writes every word and amount on it; this only lays it out. -->

  <!-- summary (the read-back before the yes) and receipt (what was just saved): a small bill. -->
  <div v-if="card.kind === 'summary' || card.kind === 'receipt'" class="panel max-w-sm p-4 whitespace-normal">
    <div class="flex items-start justify-between gap-3">
      <p class="font-semibold">{{ data.title }}</p>
      <span v-if="data.number" class="serial shrink-0 rounded-full bg-hover px-2.5 py-0.5 text-ink">{{ data.number }}</span>
    </div>
    <p v-if="data.status" class="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
      <PhHourglassMedium v-if="data.pay_url" :size="16" class="mt-0.5 shrink-0 text-attention"></PhHourglassMedium>
      <PhCheckCircle v-else :size="16" weight="fill" class="mt-0.5 shrink-0 text-success"></PhCheckCircle>
      {{ data.status }}
    </p>

    <ul v-if="data.lines?.length" class="mt-3 flex flex-col gap-2 text-sm">
      <li v-for="(line, index) in data.lines" :key="index" class="flex items-baseline gap-2">
        <span>
          <span v-if="line.qty" class="text-ink-soft">{{ formatNumber(line.qty) }} x</span>
          {{ line.label }}
        </span>
        <template v-if="line.amount">
          <span class="leader" aria-hidden="true"></span>
          <span class="shrink-0 font-medium">{{ line.amount.text }}</span>
        </template>
      </li>
    </ul>

    <dl v-if="data.rows?.length" class="mt-3 flex flex-col gap-1.5 text-sm">
      <div v-for="(row, index) in data.rows" :key="index" class="flex justify-between gap-4">
        <dt class="text-ink-soft">{{ row.label }}</dt>
        <dd class="text-right font-medium">
          <time v-if="row.at" :datetime="row.at">{{ row.value }}</time>
          <template v-else>{{ row.value }}</template>
        </dd>
      </div>
    </dl>

    <div v-if="data.total" class="mt-3 flex items-baseline justify-between border-t border-line-strong pt-3">
      <span class="text-sm font-semibold text-ink-soft">{{ t('chat.card.total') }}</span>
      <span class="text-xl font-semibold tracking-[-0.02em]">{{ data.total.text }}</span>
    </div>

    <!-- Saved but waiting for a payment: the backend's pay page, in a new tab. -->
    <a v-if="data.pay_url" :href="data.pay_url" target="_blank" rel="noopener" class="btn btn-primary mt-4 w-full">
      <PhCreditCard :size="18" weight="bold"></PhCreditCard>
      {{ t('chat.card.pay') }}
    </a>
  </div>

  <!-- tracking: where an order is, as a bar of steps (done black, now lime, to come grey). -->
  <div v-else-if="card.kind === 'tracking'" class="panel max-w-sm p-4 whitespace-normal">
    <div class="flex items-center gap-2">
      <span class="serial rounded-full bg-hover px-2.5 py-0.5 text-ink">{{ data.number }}</span>
      <span class="font-semibold">{{ current?.label }}</span>
    </div>
    <ol class="mt-3 grid gap-1.5" :style="{ gridTemplateColumns: `repeat(${data.steps.length}, minmax(0, 1fr))` }">
      <li v-for="(step, index) in data.steps" :key="index" class="min-w-0">
        <span class="block h-1.5 rounded-full" :class="step.current ? 'bg-lime' : step.done ? 'bg-ink' : 'bg-hover'"></span>
        <span class="mt-1.5 block text-xs leading-snug" :class="step.current ? 'font-semibold text-ink' : step.done ? 'text-ink' : 'text-ink-soft'">
          {{ step.label }}
          <span class="sr-only">({{ step.current ? t('chat.card.now') : step.done ? t('chat.card.done') : t('chat.card.toCome') }})</span>
        </span>
      </li>
    </ol>
    <p v-if="data.note" class="mt-3 text-sm text-ink-soft">{{ data.note }}</p>
  </div>

  <!-- doctors: who fits, a row to swipe along like the products, each with a Book button. -->
  <div v-else-if="card.kind === 'doctors'" class="-mr-4 flex snap-x gap-3 overflow-x-auto pr-4 pb-1 whitespace-normal sm:mr-0 sm:pr-0">
    <div v-for="doctor in data.doctors" :key="doctor.name" class="panel flex w-56 shrink-0 snap-start flex-col p-4">
      <p class="font-semibold leading-snug">{{ doctor.name }}</p>
      <p class="text-sm text-ink-soft">{{ doctor.speciality }}</p>
      <p class="mt-3 flex items-start gap-2 text-sm">
        <PhCalendarBlank :size="16" class="mt-0.5 shrink-0 text-ink-faint"></PhCalendarBlank>
        {{ doctor.days }}
      </p>
      <p class="mt-1 flex items-start gap-2 text-sm">
        <PhClock :size="16" class="mt-0.5 shrink-0 text-ink-faint"></PhClock>
        {{ doctor.hours }}
      </p>
      <p class="mt-1 flex items-start gap-2 text-sm">
        <PhCoins :size="16" class="mt-0.5 shrink-0 text-ink-faint"></PhCoins>
        {{ t('chat.card.fee', { money: doctor.fee.text }) }}
      </p>
      <button type="button" class="btn btn-secondary btn-sm mt-4" :disabled="busy" @click="emit('ask', doctor.book)">
        {{ t('chat.card.book') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalendarBlank, PhCheckCircle, PhClock, PhCoins, PhCreditCard, PhHourglassMedium } from '@phosphor-icons/vue';

import { formatNumber } from '../../lib/format.js';

const props = defineProps({
  // `{kind, data}` as the chat stream sent it: summary, receipt, tracking or doctors.
  card: { type: Object, required: true },
  // A reply is being written: a Book tap waits for it.
  busy: { type: Boolean, default: false },
});
// `ask`: words to send as the visitor's next message (a doctor's Book button).
const emit = defineEmits(['ask']);
const { t } = useI18n();

const data = computed(() => props.card.data);
// The step the order is at now.
const current = computed(() => data.value.steps?.find((step) => step.current));
</script>

<style scoped>
/* The dotted line that joins an item to its price, as on a printed bill. */
.leader {
  flex: 1;
  min-width: 1rem;
  border-bottom: 1px dotted var(--color-line-strong);
  transform: translateY(-0.25rem);
}
</style>
