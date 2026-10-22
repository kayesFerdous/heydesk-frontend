<template>
  <!-- The record as a receipt: what was taken, the total, and the proof.
       Who it is and the next step sit beside it, in RecordNextStep. -->
  <div class="p-5 sm:p-7">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          {{ t(`records.name.${record.job}`) }}
          <span class="serial rounded-full bg-hover px-2.5 py-0.5 text-ink">{{ record.code }}</span>
        </p>
        <h2 class="mt-2 truncate text-2xl font-extrabold tracking-[-0.025em]">
          {{ record.customer_name || t('records.customer') }}
        </h2>
        <p class="mt-0.5 text-sm text-ink-soft">{{ formatDay(record.created_at) }}, {{ formatTime(record.created_at) }}</p>
      </div>
      <!-- A new status lands like a stamp pressed on the slip. -->
      <transition name="stamp" mode="out-in">
        <StatusChip :key="record.status" :status="record.status"></StatusChip>
      </transition>
    </div>

    <p class="mt-5 flex items-center gap-2.5 rounded-[var(--radius-card)] bg-success-tint px-4 py-3 text-sm font-medium text-ink">
      <PhSealCheck :size="18" weight="fill" class="shrink-0 text-success"></PhSealCheck>
      {{ t('records.confirmedInChat', { day: formatDay(record.created_at), time: formatTime(record.created_at) }) }}
    </p>

    <template v-if="record.kind === 'order'">
      <ul class="mt-6 flex flex-col gap-3 text-[0.9375rem]">
        <li
          v-for="(line, index) in record.lines"
          :key="index"
          class="flex items-baseline gap-2"
        >
          <span>
            <span class="text-ink-soft">{{ formatNumber(line.quantity) }} x</span> {{ line.name }}
            <span v-if="choices(line)" class="text-ink-soft">({{ choices(line) }})</span>
          </span>
          <span class="leader" aria-hidden="true"></span>
          <span class="font-medium">{{ formatMoney(line.price * line.quantity) }}</span>
        </li>
      </ul>
      <p v-if="record.address" class="mt-2.5 flex items-baseline gap-2 text-sm">
        <span>{{ t('records.delivery') }}</span>
        <span class="leader" aria-hidden="true"></span>
        <span class="font-medium">{{ record.delivery_charge ? formatMoney(record.delivery_charge) : t('records.free') }}</span>
      </p>
      <div class="mt-5 flex items-baseline justify-between border-t border-line-strong pt-4">
        <span class="text-sm font-semibold text-ink-soft">{{ t('records.total') }}</span>
        <span class="text-[2rem] leading-none font-extrabold tracking-[-0.03em]">{{ formatMoney(record.total) }}</span>
      </div>
      <template v-if="record.paid">
        <p class="mt-2 flex justify-between gap-4 text-sm text-ink-soft">
          <span>{{ t('records.paidOnline') }}</span><span>{{ formatMoney(record.paid) }}</span>
        </p>
        <p class="mt-1 flex justify-between gap-4 text-sm">
          <span>{{ t('records.toCollect') }}</span><span class="font-semibold">{{ formatMoney(record.total - record.paid) }}</span>
        </p>
      </template>
      <p v-if="record.status === 'unpaid'" class="mt-4 text-sm text-ink-soft">
        {{ t('records.waitingForPayment') }}
      </p>
      <p v-if="record.due_at" class="mt-4 flex items-center gap-2 text-sm">
        <PhClock :size="16" class="text-ink-soft"></PhClock>
        {{ record.address ? t('records.deliverAt') : t('records.pickupAt') }} <span class="font-semibold">{{ formatTime(record.due_at) }}</span>
      </p>
      <p v-if="record.address" class="mt-2 flex items-start gap-2 text-sm">
        <PhMapPin :size="16" class="mt-0.5 shrink-0 text-ink-soft"></PhMapPin>
        {{ record.address }}
      </p>
      <p v-if="record.note" class="mt-2 text-sm text-ink-soft">{{ t('records.noteLine', { note: record.note }) }}</p>

      <!-- The shop's call to the buyer to confirm it (backend D89). -->
      <OrderCall v-if="record.flow === 'shop_order'" :order="record"></OrderCall>
    </template>

    <template v-else>
      <dl class="mt-6 flex flex-col gap-4 text-[0.9375rem]">
        <div v-for="(value, key) in record.details" :key="key">
          <dt class="text-xs font-medium text-ink-soft">{{ t(`records.details.${key}`) }}</dt>
          <dd class="mt-0.5 leading-relaxed whitespace-pre-wrap">{{ value }}</dd>
        </div>
        <div v-if="record.note">
          <dt class="text-xs font-medium text-ink-soft">{{ t('records.note') }}</dt>
          <dd class="mt-0.5 leading-relaxed">{{ record.note }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhClock, PhMapPin, PhSealCheck } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import OrderCall from '../calls/OrderCall.vue';
import { formatMoney, formatNumber, formatTime, formatDay } from '../../lib/format.js';

defineProps({
  record: { type: Object, required: true },
});
const { t } = useI18n();

// A shop line's size and colour: "M, Black".
function choices(line) {
  return [line.size, line.colour].filter(Boolean).join(', ');
}
</script>

<style scoped>
/* The dotted line that joins an item to its price, as on a printed bill. */
.leader {
  flex: 1;
  min-width: 1rem;
  border-bottom: 1px dotted var(--color-line-strong);
  transform: translateY(-0.25rem);
}

/* The new status stamp lands: pressed down a touch, then settles. */
.stamp-enter-active {
  transition: transform 0.22s var(--ease-settle), opacity 0.22s var(--ease-settle);
}

.stamp-enter-from {
  opacity: 0;
  transform: scale(1.25) rotate(-4deg);
}

@media (prefers-reduced-motion: reduce) {
  .stamp-enter-active {
    transition: none;
  }
}
</style>
