<template>
  <!-- The record as a receipt slip: who, what, the total, the proof, and the
       one next step. -->
  <div class="flex h-full flex-col p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-xs font-medium text-ink-soft">
          {{ t(`records.name.${record.job}`) }}
          <span class="serial !text-xs text-ink">{{ record.code }}</span>
        </p>
        <h2 class="mt-1.5 truncate text-xl font-semibold tracking-[-0.015em]">
          {{ record.customer_name || t('records.customer') }}
        </h2>
        <a
          v-if="record.customer_phone"
          :href="`tel:${record.customer_phone}`"
          class="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand"
        >
          <PhPhone :size="14"></PhPhone>
          {{ record.customer_phone }}
        </a>
      </div>
      <!-- A new status lands like a stamp pressed on the slip. -->
      <transition name="stamp" mode="out-in">
        <StatusChip :key="record.status" :status="record.status"></StatusChip>
      </transition>
    </div>

    <template v-if="record.kind === 'order'">
      <ul class="mt-6 flex flex-col gap-2.5 border-t border-hairline pt-5 text-sm">
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
      <div class="mt-4 flex items-baseline justify-between border-t border-line-strong pt-4">
        <span class="text-sm text-ink-soft">{{ t('records.total') }}</span>
        <span class="text-2xl font-semibold tracking-[-0.02em]">{{ formatMoney(record.total) }}</span>
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
      <p v-if="record.tracking" class="mt-2 flex items-start gap-2 text-sm">
        <PhTruck :size="16" class="mt-0.5 shrink-0 text-ink-soft"></PhTruck>
        {{ record.tracking }}
      </p>
      <p v-if="record.note" class="mt-2 text-sm text-ink-soft">{{ t('records.noteLine', { note: record.note }) }}</p>

      <!-- A shop order goes to a courier: its name and parcel id, for the buyer's tracking. -->
      <div v-if="record.flow === 'shop_order' && record.status === 'confirmed'" class="mt-5">
        <label class="label" for="tracking">{{ t('records.tracking') }}</label>
        <input id="tracking" v-model.trim="tracking" class="field" type="text" placeholder="Steadfast 12345678" />
        <p class="hint">{{ t('records.trackingHint') }}</p>
      </div>

      <!-- The shop's call to the buyer to confirm it (backend D89). -->
      <OrderCall v-if="record.flow === 'shop_order'" :order="record"></OrderCall>
    </template>

    <template v-else>
      <dl class="mt-6 flex flex-col gap-4 border-t border-hairline pt-5 text-sm">
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

    <p class="mt-6 flex items-center gap-2 border-t border-dashed border-line-strong pt-4 text-xs text-ink-soft">
      <PhSealCheck :size="16" weight="fill" class="shrink-0 text-success"></PhSealCheck>
      {{ t('records.confirmedInChat', { day: formatDay(record.created_at), time: formatTime(record.created_at) }) }}
    </p>

    <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

    <div class="mt-auto flex flex-col gap-2 pt-8">
      <button
        v-if="steps.primary"
        type="button"
        class="btn btn-primary w-full"
        :disabled="busy"
        @click="moveOn(steps.primary.to)"
      >
        {{ steps.primary.label }}
      </button>
      <router-link
        :to="`/conversations?open=${record.conversation_id}`"
        class="btn btn-secondary w-full"
      >
        {{ t('records.readConversation') }}
      </router-link>
      <button
        v-for="step in steps.others"
        :key="step.to"
        type="button"
        class="btn btn-quiet w-full"
        :disabled="busy"
        @click="$emit('move', step.to)"
      >
        {{ step.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhClock, PhMapPin, PhPhone, PhSealCheck, PhTruck } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import OrderCall from '../calls/OrderCall.vue';
import { formatMoney, formatNumber, formatTime, formatDay } from '../../lib/format.js';
import { nextSteps } from '../../lib/flows.js';

const props = defineProps({
  record: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
const emit = defineEmits(['move']);
const { t } = useI18n();

const tracking = ref('');
const steps = computed(() => nextSteps(props.record));

// A shop line's size and colour: "M, Black".
function choices(line) {
  return [line.size, line.colour].filter(Boolean).join(', ');
}

// Shipping a shop order sends its courier along with the status.
function moveOn(status) {
  const extra = status === 'shipped' && tracking.value ? { tracking: tracking.value } : {};
  emit('move', status, extra);
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
