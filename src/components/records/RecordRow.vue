<template>
  <!-- One ledger entry: when, who, what, its code, the amount and its stamp.
       The columns match the heading row above the list. -->
  <button
    type="button"
    class="row ledger w-full px-5 py-3 text-left sm:px-8"
    :class="{ 'row-selected': selected, 'ledger-money': money }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span class="hidden text-[0.8125rem] text-ink-soft sm:block">{{ formatTime(record.created_at) }}</span>
    <span
      class="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      {{ initials(record.customer_name) }}
    </span>
    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold">{{ record.customer_name || t('records.customer') }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ summary }}</span>
    </span>
    <span class="serial hidden truncate text-ink-soft sm:block">{{ record.code }}</span>
    <span v-if="money" class="hidden text-right text-sm font-semibold sm:block">{{ formatMoney(record.total) }}</span>
    <span class="hidden sm:block"><StatusChip :status="record.status"></StatusChip></span>

    <!-- Phones: the amount (or time) and the stamp, stacked at the end. -->
    <span class="flex flex-col items-end gap-1 sm:hidden">
      <span v-if="money" class="text-sm font-semibold">{{ formatMoney(record.total) }}</span>
      <span v-else class="text-xs text-ink-soft">{{ formatTime(record.created_at) }}</span>
      <StatusChip :status="record.status"></StatusChip>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusChip from '../ui/StatusChip.vue';
import { formatMoney, formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';
import { summarize } from '../../lib/records.js';

const props = defineProps({
  record: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});
// Orders carry money, so their rows get the amount column.
const money = computed(() => props.record.kind === 'order');
defineEmits(['select']);
const { t } = useI18n();

const summary = computed(() => summarize(props.record));
const tint = computed(() => avatarTint(props.record.customer_name));
</script>
