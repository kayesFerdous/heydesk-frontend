<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button type="button" class="btn btn-quiet btn-icon lg:hidden" aria-label="Back to conversations" @click="$emit('back')">
          <ph-arrow-left :size="20"></ph-arrow-left>
        </button>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-[-0.01em]">{{ name }}</h2>
          <p class="text-sm text-ink-soft">
            {{ channel.long }}, {{ when }}
          </p>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div
        v-if="conversation.status === 'needs_human'"
        class="notice mx-auto mb-6 max-w-2xl flex-wrap items-center"
        role="status"
      >
        <ph-user-sound :size="20" weight="bold" class="shrink-0 text-attention"></ph-user-sound>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-ink">{{ name }} asked for a person</p>
          <p class="mt-0.5 text-ink-soft">
            <template v-if="phone">Call {{ phone }} to pick up where your agent left off.</template>
            <template v-else>Read the chat below, then reach out to them.</template>
          </p>
        </div>
        <a v-if="phone" :href="`tel:${phone}`" class="btn btn-primary">
          <ph-phone :size="16"></ph-phone>
          Call back
        </a>
      </div>

      <div class="mx-auto flex max-w-2xl flex-col gap-3">
        <div
          v-for="(line, index) in conversation.messages"
          :key="index"
          class="flex"
          :class="line.role === 'user' ? 'justify-start' : 'justify-end'"
        >
          <div class="max-w-[85%]">
            <p class="mb-1 px-1 text-xs text-ink-soft" :class="{ 'text-right': line.role !== 'user' }">
              {{ line.role === 'user' ? name : 'Your agent' }}
            </p>
            <div
              class="rounded-[var(--radius-panel)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              :class="line.role === 'user' ? 'rounded-tl-sm bg-hover text-ink' : 'rounded-tr-sm bg-brand-tint text-ink'"
            >
              {{ line.text }}
            </div>
          </div>
        </div>
        <p v-if="!conversation.messages.length" class="text-sm text-ink-soft">Nothing was said in this conversation.</p>
      </div>

      <div v-if="conversation.records.length" class="mx-auto mt-8 max-w-2xl">
        <h3 class="mb-2 text-sm font-semibold">Taken in this conversation</h3>
        <router-link
          v-for="record in conversation.records"
          :key="record.id"
          :to="`/inbox?job=${record.job}&open=${record.id}`"
          class="mb-2 flex items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-hairline px-4 py-3 text-sm transition-colors hover:bg-wash"
        >
          <span class="font-semibold">
            {{ record.title }} {{ record.code }}
          </span>
          <span class="flex items-center gap-3">
            <span v-if="record.kind === 'order'" class="font-semibold">{{ money(record.total) }}</span>
            <status-chip :status="record.status"></status-chip>
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { PhArrowLeft, PhPhone, PhUserSound } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { channelOf } from '../../lib/channels.js';
import { formatMoney, formatTime, formatDay } from '../../lib/format.js';

export default {
  components: { StatusChip, PhArrowLeft, PhPhone, PhUserSound },
  props: {
    conversation: { type: Object, required: true },
  },
  emits: ['back'],
  computed: {
    channel() {
      return channelOf(this.conversation.channel);
    },
    name() {
      const record = this.conversation.records[0];
      return (record && record.customer_name) || 'Visitor';
    },
    phone() {
      const record = this.conversation.records.find((r) => r.customer_phone);
      return record ? record.customer_phone : '';
    },
    when() {
      return `${formatDay(this.conversation.created_at)}, ${formatTime(this.conversation.created_at)}`;
    },
  },
  methods: {
    money: formatMoney,
  },
};
</script>
