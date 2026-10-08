<template>
  <button
    type="button"
    class="row grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 text-left sm:px-8"
    :class="{ 'row-selected': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span
      class="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      {{ initialsOf(record.customer_name) }}
    </span>

    <span class="min-w-0">
      <span class="flex items-baseline gap-2">
        <span class="truncate text-sm font-semibold">
          {{ record.customer_name || 'Customer' }}
        </span>
        <span class="shrink-0 text-xs text-ink-soft">{{ record.code }}</span>
      </span>
      <span class="block truncate text-sm text-ink-soft">{{ summary }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="flex items-center gap-2">
        <span v-if="record.kind === 'order'" class="text-sm font-semibold">{{ money(record.total) }}</span>
        <span v-else class="text-xs text-ink-soft">{{ time(record.created_at) }}</span>
      </span>
      <status-chip :status="record.status"></status-chip>
    </span>
  </button>
</template>

<script>
import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';
import { summarize } from '../../lib/records.js';

export default {
  components: { StatusChip },
  props: {
    record: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['select'],
  computed: {
    summary() {
      return summarize(this.record);
    },
    tint() {
      return avatarTint(this.record.customer_name);
    },
  },
  methods: {
    money: formatMoney,
    time: formatTime,
    initialsOf: initials,
  },
};
</script>
