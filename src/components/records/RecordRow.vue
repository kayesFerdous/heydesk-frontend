<template>
  <button
    type="button"
    class="row grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3 text-left"
    :class="{ 'row-selected': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span
      class="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      {{ initialsOf(record.customer_name) }}
    </span>

    <span class="min-w-0">
      <span class="flex items-baseline gap-2">
        <span class="truncate text-sm font-semibold text-navy">
          {{ record.customer_name || 'Customer' }}
        </span>
        <span class="text-xs text-ink-soft">#{{ record.number }}</span>
      </span>
      <span class="block truncate text-sm text-ink-soft">{{ summary }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span v-if="record.kind === 'order'" class="text-sm font-semibold">
        {{ money(record.total) }}
      </span>
      <status-chip :status="record.status"></status-chip>
    </span>
  </button>
</template>

<script>
import StatusChip from '../ui/StatusChip.vue';
import { formatMoney } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

export default {
  components: { StatusChip },
  props: {
    record: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['select'],
  computed: {
    summary() {
      if (this.record.kind === 'order' && this.record.lines) {
        return this.record.lines
          .map((line) =>
            line.quantity > 1 ? `${line.quantity} ${line.name}` : line.name
          )
          .join(', ');
      }
      return this.record.note || 'Message for the team';
    },
    tint() {
      return avatarTint(this.record.customer_name);
    },
  },
  methods: {
    money: formatMoney,
    initialsOf: initials,
  },
};
</script>

<style scoped>
.row {
  border-bottom: 1px solid var(--color-hairline);
  transition: background-color 0.2s var(--ease-settle);
}

.row:hover {
  background-color: var(--color-wash);
}

.row-selected,
.row-selected:hover {
  background-color: var(--color-brand-tint);
}
</style>
