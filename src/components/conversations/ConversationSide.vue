<template>
  <!-- Beside the transcript: who the customer is, how to reach them, what the
       conversation produced, and when it happened. -->
  <div class="flex flex-col gap-6 p-5 sm:p-6">
    <div class="flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <p class="truncate text-lg font-bold">{{ name }}</p>
        <p class="truncate text-sm text-ink-soft">{{ phone || channel.long }}</p>
      </div>
      <a
        v-if="phone"
        :href="`tel:${phone}`"
        class="btn btn-secondary btn-icon shrink-0"
        :aria-label="t('records.call', { name })"
        :title="t('records.call', { name })"
      >
        <PhPhone :size="18" weight="fill"></PhPhone>
      </a>
    </div>

    <div v-if="conversation.records.length">
      <h3 class="text-sm font-semibold text-ink-soft">{{ t('conversations.takenHere') }}</h3>
      <div class="mt-2 flex flex-col gap-1.5">
        <router-link
          v-for="record in conversation.records"
          :key="record.id"
          :to="`/inbox?job=${record.job}&open=${record.id}`"
          class="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-wash px-4 py-3 text-sm transition-colors hover:bg-hover"
        >
          <span class="min-w-0">
            <span class="block font-bold">{{ t(`records.name.${record.job}`) }}</span>
            <span class="serial text-ink-soft">{{ record.code }}</span>
            <span v-if="record.kind === 'order'" class="font-semibold">, {{ formatMoney(record.total) }}</span>
          </span>
          <StatusChip :status="record.status"></StatusChip>
        </router-link>
      </div>
    </div>

    <dl class="flex flex-col gap-3 text-sm">
      <div class="flex justify-between gap-3">
        <dt class="text-ink-soft">{{ t('conversations.channel') }}</dt>
        <dd class="flex items-center gap-1.5 font-semibold"><component :is="channel.icon" :size="16"></component>{{ channel.label }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-soft">{{ t('conversations.started') }}</dt>
        <dd class="font-semibold">{{ formatDay(conversation.created_at) }}, {{ formatTime(conversation.created_at) }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-soft">{{ t('conversations.messages') }}</dt>
        <dd class="font-semibold">{{ formatNumber(conversation.messages.length) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPhone } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { channelOf } from '../../lib/channels.js';
import { formatMoney, formatNumber, formatTime, formatDay } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true }, // with its `records`
});
const { t } = useI18n();

const channel = computed(() => channelOf(props.conversation.channel));
const name = computed(() => props.conversation.records[0]?.customer_name || t('conversations.visitor'));
const phone = computed(() => props.conversation.records.find((r) => r.customer_phone)?.customer_phone ?? '');
</script>
