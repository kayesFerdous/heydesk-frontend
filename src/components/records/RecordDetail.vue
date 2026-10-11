<template>
  <div class="flex h-full flex-col p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-medium text-ink-soft">{{ t(`records.name.${record.job}`) }} {{ record.code }}</p>
        <h2 class="mt-1 truncate text-xl font-semibold tracking-[-0.01em]">
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
      <StatusChip :status="record.status"></StatusChip>
    </div>

    <template v-if="record.kind === 'order'">
      <ul class="mt-6 flex flex-col gap-2.5 border-t border-hairline pt-5 text-sm">
        <li
          v-for="(line, index) in record.lines"
          :key="index"
          class="flex justify-between gap-4"
        >
          <span>
            <span class="text-ink-soft">{{ formatNumber(line.quantity) }} x</span> {{ line.name }}
            <span v-if="choices(line)" class="text-ink-soft">({{ choices(line) }})</span>
          </span>
          <span class="font-medium">{{ formatMoney(line.price * line.quantity) }}</span>
        </li>
      </ul>
      <p v-if="record.address" class="mt-2.5 flex justify-between gap-4 text-sm">
        <span>{{ t('records.delivery') }}</span>
        <span class="font-medium">{{ record.delivery_charge ? formatMoney(record.delivery_charge) : t('records.free') }}</span>
      </p>
      <div class="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
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

    <p class="mt-5 flex items-center gap-1.5 text-xs text-ink-soft">
      <PhSealCheck :size="14" class="text-success"></PhSealCheck>
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
