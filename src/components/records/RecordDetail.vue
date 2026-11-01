<template>
  <!-- The open record in one panel. At the top, who and when, and one row of
       actions (the next step, call, the conversation, the rarer moves); under
       it, the proof in one line. Then sections of one shape: the order and its
       total, the delivery, the courier, the call to confirm, details. -->
  <div class="flex flex-col pb-2">
    <div class="px-4 pt-4 pb-4 sm:px-5">
      <div class="flex items-center gap-2 text-[0.8125rem]">
        <span class="serial text-ink-soft">{{ record.code }}</span>
        <span class="text-ink-soft">{{ t(`records.name.${record.job}`) }}</span>
        <span class="ml-auto text-ink-soft">{{ formatDay(record.created_at) }}, {{ formatTime(record.created_at) }}</span>
        <!-- A new status lands like a stamp pressed on the slip. -->
        <transition name="stamp" mode="out-in">
          <StatusChip :key="record.status" :status="record.status"></StatusChip>
        </transition>
      </div>
      <h2 class="mt-3 truncate text-lg leading-tight font-semibold tracking-[-0.015em]">{{ name }}</h2>
      <p v-if="record.customer_phone" class="mt-0.5 text-[0.8125rem] text-ink-soft">{{ record.customer_phone }}</p>

      <div class="mt-4">
        <RecordNextStep :record="record" :busy="busy" :error="error" @move="$emit('move', $event)">
          <a
            v-if="record.customer_phone"
            :href="`tel:${record.customer_phone}`"
            class="btn btn-secondary btn-icon"
            :aria-label="t('records.call', { name })"
            :title="t('records.call', { name })"
          >
            <PhPhone :size="18"></PhPhone>
          </a>
          <router-link
            :to="`/conversations?open=${record.conversation_id}`"
            class="btn btn-secondary btn-icon"
            :aria-label="t('records.readConversation')"
            :title="t('records.readConversation')"
          >
            <PhChatsCircle :size="18"></PhChatsCircle>
          </router-link>
        </RecordNextStep>
      </div>

      <p class="mt-3 flex items-center gap-1.5 text-[0.8125rem] font-medium text-success">
        <PhSealCheck :size="16" weight="fill" class="shrink-0"></PhSealCheck>
        {{ t('records.confirmedShort') }}
      </p>
    </div>

    <template v-if="record.kind === 'order'">
      <RecordSection :label="t('records.sections.order')">
        <div v-for="(line, index) in record.lines" :key="index" class="flex items-baseline justify-between gap-4 py-0.5">
          <span class="min-w-0">
            {{ line.name }}
            <span class="text-ink-soft">&times; {{ formatNumber(line.quantity) }}<template v-if="choices(line)"> · {{ choices(line) }}</template></span>
          </span>
          <span class="shrink-0 text-right">{{ formatMoney(line.price * line.quantity) }}</span>
        </div>
        <div v-if="record.address" class="flex items-baseline justify-between gap-4 py-0.5 text-ink-soft">
          <span>{{ t('records.delivery') }}</span>
          <span>{{ record.delivery_charge ? formatMoney(record.delivery_charge) : t('records.free') }}</span>
        </div>
        <div class="mt-2 border-t border-hairline pt-2">
          <div class="flex items-baseline justify-between gap-4 py-0.5 font-semibold">
            <span>{{ t('records.total') }}</span>
            <span class="text-base">{{ formatMoney(record.total) }}</span>
          </div>
          <template v-if="record.paid">
            <div class="flex items-baseline justify-between gap-4 py-0.5 text-ink-soft">
              <span>{{ t('records.paidOnline') }}</span>
              <span>{{ formatMoney(record.paid) }}</span>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-0.5 font-semibold">
              <span>{{ t('records.toCollect') }}</span>
              <span>{{ formatMoney(record.total - record.paid) }}</span>
            </div>
          </template>
        </div>
        <p v-if="record.status === 'unpaid'" class="mt-2 text-ink-soft">{{ t('records.waitingForPayment') }}</p>
      </RecordSection>

      <RecordSection v-if="record.address || record.note" :label="t('records.sections.delivery')">
        <p v-if="record.address" class="leading-relaxed">{{ record.address }}</p>
        <p v-if="record.note" class="mt-1 text-ink-soft">{{ t('records.noteLine', { note: record.note }) }}</p>
      </RecordSection>

      <!-- Booked with the courier by the agent (backend D113). -->
      <RecordSection v-if="hasDetails" :label="t('records.sections.courier')">
        <div v-for="(value, key) in record.details" :key="key" class="flex items-baseline justify-between gap-4 py-0.5">
          <span class="text-ink-soft">{{ t(`records.details.${key}`) }}</span>
          <span class="text-right">{{ value }}</span>
        </div>
      </RecordSection>

      <!-- The shop's call to the buyer to confirm it (backend D89). -->
      <OrderCall v-if="record.flow === 'shop_order'" :order="record"></OrderCall>
    </template>

    <RecordSection v-else-if="hasDetails || record.note" :label="t('records.sections.details')">
      <dl>
        <template v-for="(value, key) in record.details" :key="key">
          <div v-if="key === 'message'" class="py-0.5">
            <dt class="sr-only">{{ t(`records.details.${key}`) }}</dt>
            <dd class="leading-relaxed whitespace-pre-wrap">{{ value }}</dd>
          </div>
          <div v-else class="flex items-baseline justify-between gap-4 py-0.5">
            <dt class="text-ink-soft">{{ t(`records.details.${key}`) }}</dt>
            <dd class="text-right">{{ value }}</dd>
          </div>
        </template>
        <div v-if="record.note" class="pt-2">
          <dt class="text-xs text-ink-soft">{{ t('records.note') }}</dt>
          <dd class="mt-0.5 leading-relaxed">{{ record.note }}</dd>
        </div>
      </dl>
    </RecordSection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatsCircle, PhPhone, PhSealCheck } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import OrderCall from '../calls/OrderCall.vue';
import RecordNextStep from './RecordNextStep.vue';
import RecordSection from './RecordSection.vue';
import { formatMoney, formatNumber, formatTime, formatDay } from '../../lib/format.js';

const props = defineProps({
  record: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
defineEmits(['move']);
const { t } = useI18n();

const name = computed(() => props.record.customer_name || t('records.customer'));
const hasDetails = computed(() => Object.keys(props.record.details || {}).length > 0);

// A shop line's size and colour: "M, Black".
function choices(line) {
  return [line.size, line.colour].filter(Boolean).join(', ');
}
</script>

<style scoped>
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
