<template>
  <div class="flex h-full flex-col p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold tracking-tight">
          {{ record.title }} {{ record.code }}
        </h2>
        <p class="mt-2 font-semibold text-navy">
          {{ record.customer_name || 'Customer' }}
        </p>
        <p v-if="record.customer_phone" class="text-sm text-ink-soft">
          {{ record.customer_phone }}
        </p>
      </div>
      <status-chip :status="record.status"></status-chip>
    </div>

    <template v-if="record.kind === 'order'">
      <ul class="mt-6 flex flex-col gap-2.5 text-sm">
        <li
          v-for="line in record.lines"
          :key="line.code"
          class="flex justify-between gap-4"
        >
          <span>{{ line.quantity }} x {{ line.name }}</span>
          <span class="font-medium">{{ money(line.price * line.quantity) }}</span>
        </li>
      </ul>
      <div class="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
        <span class="text-sm text-ink-soft">Total</span>
        <span class="text-2xl font-semibold tracking-tight">{{ money(record.total) }}</span>
      </div>
      <p v-if="record.due_at" class="mt-4 text-sm">
        Pickup today at <span class="font-semibold">{{ time(record.due_at) }}</span>
      </p>
      <p class="mt-1 text-xs text-ink-soft">Confirmed by the customer in chat</p>
    </template>

    <template v-else>
      <dl class="mt-6 flex flex-col gap-4 text-sm">
        <div v-for="(value, label) in record.details" :key="label">
          <dt class="text-ink-soft">{{ label }}</dt>
          <dd class="mt-0.5">{{ value }}</dd>
        </div>
      </dl>
      <p v-if="record.note" class="mt-4 text-sm">{{ record.note }}</p>
    </template>

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
        View chat
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
import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime } from '../../lib/format.js';
import { nextSteps } from '../../lib/flows.js';

export default {
  components: { StatusChip },
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
  },
};
</script>
