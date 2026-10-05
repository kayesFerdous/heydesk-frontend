<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button type="button" class="btn btn-quiet !h-10 !w-10 !px-0 lg:hidden" aria-label="Back to conversations" @click="$emit('back')">
          <ph-arrow-left :size="20"></ph-arrow-left>
        </button>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-tight">{{ name }}</h2>
          <p class="text-sm text-ink-soft">
            {{ conversation.channel === 'voice' ? 'Voice call' : 'Chat' }}, {{ when }}
          </p>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div
        v-if="conversation.status === 'needs_human'"
        class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] bg-attention-tint px-4 py-3 text-sm text-attention"
        role="status"
      >
        <span class="flex items-center gap-2 font-medium">
          <ph-user-sound :size="18" weight="bold" class="shrink-0"></ph-user-sound>
          {{ name }} asked for a person.<template v-if="phone"> Their number is {{ phone }}.</template>
        </span>
        <a v-if="phone" :href="`tel:${phone}`" class="btn btn-primary !h-10">Call back</a>
      </div>

      <div class="mx-auto flex max-w-2xl flex-col gap-3">
        <div
          v-for="(line, index) in conversation.messages"
          :key="index"
          class="flex"
          :class="line.role === 'user' ? 'justify-start' : 'justify-end'"
        >
          <div
            class="max-w-[85%] rounded-[var(--radius-panel)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            :class="line.role === 'user' ? 'bg-wash text-ink ring-1 ring-hairline' : 'bg-brand-tint text-ink'"
          >
            {{ line.text }}
          </div>
        </div>
        <p v-if="!conversation.messages.length" class="text-sm text-ink-soft">Nothing was said in this conversation.</p>
      </div>

      <div v-if="conversation.records.length" class="mx-auto mt-8 max-w-2xl">
        <h3 class="mb-2 text-sm font-semibold text-ink-soft">Made from this conversation</h3>
        <router-link
          v-for="record in conversation.records"
          :key="record.id"
          to="/inbox"
          class="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-hairline px-4 py-3 text-sm transition-colors hover:bg-wash"
        >
          <span class="font-semibold">
            {{ record.kind === 'order' ? 'Order' : 'Message for the team' }} #{{ record.number }}
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
import { PhArrowLeft, PhUserSound } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime, formatDay } from '../../lib/format.js';

export default {
  components: { StatusChip, PhArrowLeft, PhUserSound },
  props: {
    conversation: { type: Object, required: true },
  },
  emits: ['back'],
  computed: {
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
