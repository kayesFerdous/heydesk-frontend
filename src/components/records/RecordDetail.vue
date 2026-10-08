<template>
  <div class="flex h-full flex-col p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-medium text-ink-soft">{{ record.title }} {{ record.code }}</p>
        <h2 class="mt-1 truncate text-xl font-semibold tracking-[-0.01em]">
          {{ record.customer_name || 'Customer' }}
        </h2>
        <a
          v-if="record.customer_phone"
          :href="`tel:${record.customer_phone}`"
          class="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand"
        >
          <ph-phone :size="14"></ph-phone>
          {{ record.customer_phone }}
        </a>
      </div>
      <status-chip :status="record.status"></status-chip>
    </div>

    <template v-if="record.kind === 'order'">
      <ul class="mt-6 flex flex-col gap-2.5 border-t border-hairline pt-5 text-sm">
        <li
          v-for="line in record.lines"
          :key="line.code"
          class="flex justify-between gap-4"
        >
          <span><span class="text-ink-soft">{{ line.quantity }} x</span> {{ line.name }}</span>
          <span class="font-medium">{{ money(line.price * line.quantity) }}</span>
        </li>
      </ul>
      <div class="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
        <span class="text-sm text-ink-soft">Total</span>
        <span class="text-2xl font-semibold tracking-[-0.02em]">{{ money(record.total) }}</span>
      </div>
      <p v-if="record.due_at" class="mt-4 flex items-center gap-2 text-sm">
        <ph-clock :size="16" class="text-ink-soft"></ph-clock>
        Pickup at <span class="font-semibold">{{ time(record.due_at) }}</span>
      </p>
    </template>

    <template v-else>
      <dl class="mt-6 flex flex-col gap-4 border-t border-hairline pt-5 text-sm">
        <div v-for="(value, label) in record.details" :key="label">
          <dt class="text-xs font-medium text-ink-soft">{{ capitalize(label) }}</dt>
          <dd class="mt-0.5 leading-relaxed whitespace-pre-wrap">{{ value }}</dd>
        </div>
        <div v-if="record.note">
          <dt class="text-xs font-medium text-ink-soft">Note</dt>
          <dd class="mt-0.5 leading-relaxed">{{ record.note }}</dd>
        </div>
      </dl>
    </template>

    <p class="mt-5 flex items-center gap-1.5 text-xs text-ink-soft">
      <ph-seal-check :size="14" class="text-success"></ph-seal-check>
      Read back to the customer and confirmed in chat, {{ day(record.created_at) }} at {{ time(record.created_at) }}
    </p>

    <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

    <div class="mt-auto flex flex-col gap-2 pt-8">
      <button
        v-if="steps.primary"
        type="button"
        class="btn btn-primary w-full"
        :disabled="busy"
        @click="$emit('move', steps.primary.to)"
      >
        {{ steps.primary.label }}
      </button>
      <router-link
        :to="`/conversations?open=${record.conversation_id}`"
        class="btn btn-secondary w-full"
      >
        Read the conversation
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

<script>
import { PhClock, PhPhone, PhSealCheck } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime, formatDay } from '../../lib/format.js';
import { nextSteps } from '../../lib/flows.js';

export default {
  components: { StatusChip, PhClock, PhPhone, PhSealCheck },
  props: {
    record: { type: Object, required: true },
    busy: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
  emits: ['move'],
  computed: {
    steps() {
      return nextSteps(this.record);
    },
  },
  methods: {
    money: formatMoney,
    time: formatTime,
    day: formatDay,
    capitalize(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
  },
};
</script>
