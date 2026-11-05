<template>
  <!-- The Inbox from 1024px: one line per record with the same columns down
       the page (code, customer, what was taken, status, time, total), grouped
       under its day. It reads its own width (a container query), so as the open
       record takes room beside it the items go first, then the time; the code,
       the customer and the total always stay. The status column is there only
       when rows can differ (All). Orders add each day's total to its heading. -->
  <div class="record-table" :class="{ money, 'no-status': !showStatus }">
    <div class="line sticky top-0 z-[2] h-9 border-b border-hairline bg-surface px-4 text-xs font-medium text-ink-soft" role="presentation">
      <span>{{ t(`records.name.${job}`) }}</span>
      <span>{{ t('inbox.columns.customer') }}</span>
      <span class="what">{{ t(`inbox.columns.what.${job}`) }}</span>
      <span>{{ showStatus ? t('inbox.columns.status') : '' }}</span>
      <span class="time">{{ t('inbox.columns.time') }}</span>
      <span v-if="money" class="text-right">{{ t('records.total') }}</span>
    </div>

    <section v-for="day in days" :key="day.label">
      <h2 class="sticky top-9 z-[1] flex h-8 items-end justify-between bg-surface px-4 pb-1 text-xs font-semibold text-ink-soft">
        {{ day.label }}
        <span v-if="money" class="font-medium">{{ formatMoney(day.items.reduce((sum, r) => sum + (r.total || 0), 0)) }}</span>
      </h2>
      <button
        v-for="record in day.items"
        :key="record.id"
        type="button"
        class="line h-11 w-full border-b border-hairline px-4 text-left text-[0.8125rem] transition-colors hover:bg-wash"
        :class="{ selected: record.id === selectedId }"
        :aria-current="record.id === selectedId"
        @click="$emit('select', record.id)"
      >
        <span class="serial truncate">{{ record.code }}</span>
        <span class="flex min-w-0 items-center gap-2">
          <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold" :class="avatarTint(record.customer_name)" aria-hidden="true">
            {{ initials(record.customer_name) }}
          </span>
          <span class="truncate font-semibold">{{ record.customer_name || t('records.customer') }}</span>
        </span>
        <span class="what truncate text-ink-soft">{{ summarize(record) }}</span>
        <span class="min-w-0"><StatusChip v-if="showStatus" :status="record.status"></StatusChip></span>
        <span class="time text-ink-soft">{{ formatTime(record.created_at) }}</span>
        <span v-if="money" class="text-right font-semibold">{{ formatMoney(record.total ?? 0) }}</span>
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';
import { summarize } from '../../lib/records.js';

const props = defineProps({
  job: { type: String, required: true },
  days: { type: Array, required: true }, // [{ label, items }] from groupByDay
  selectedId: { type: String, default: null },
  showStatus: { type: Boolean, default: true },
});
defineEmits(['select']);
const { t } = useI18n();

const money = computed(() => props.job === 'order');
</script>

<style scoped>
.record-table {
  container-type: inline-size;
  --status-column: 9.5rem;
}

.no-status {
  --status-column: 0rem;
}

.line {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr) var(--status-column);
  column-gap: 0.75rem;
  align-items: center;
}

.money .line {
  grid-template-columns: 4.5rem minmax(0, 1fr) var(--status-column) 5.5rem;
}

.what,
.time {
  display: none;
}

@container (min-width: 34rem) {
  .line {
    grid-template-columns: 4.5rem minmax(0, 1fr) var(--status-column) 4.5rem;
  }

  .money .line {
    grid-template-columns: 4.5rem minmax(0, 1fr) var(--status-column) 4.5rem 5.5rem;
  }

  .time {
    display: block;
  }
}

@container (min-width: 44rem) {
  .line {
    grid-template-columns: 4.5rem minmax(0, 0.8fr) minmax(0, 1.2fr) var(--status-column) 4.5rem;
  }

  .money .line {
    grid-template-columns: 4.5rem minmax(0, 0.8fr) minmax(0, 1.2fr) var(--status-column) 4.5rem 5.5rem;
  }

  .what {
    display: block;
  }
}

/* The open record: pale lime with an ink edge, like a selected chat. */
.selected,
.selected:hover {
  background-color: var(--color-brand-tint);
  box-shadow: inset 2px 0 0 var(--color-ink);
}
</style>
