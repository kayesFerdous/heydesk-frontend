<template>
  <!-- One entry in the Inbox list: who, what, its code, the amount (orders)
       or the time, and its status. The selected one sits on pale lime. -->
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-[var(--radius-card)] p-2.5 text-left transition-colors"
    :class="selected ? 'bg-brand-tint' : 'hover:bg-wash'"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold" :class="tint" aria-hidden="true">
      {{ initials(record.customer_name) }}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[0.9375rem] font-bold">{{ record.customer_name || t('records.customer') }}</span>
      <span class="block truncate text-sm text-ink-soft">
        <span class="serial">{{ record.code }}</span>, {{ summary }}
      </span>
    </span>
    <span class="flex shrink-0 flex-col items-end gap-1">
      <span v-if="money" class="text-sm font-bold">{{ formatMoney(record.total) }}</span>
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
// Orders carry money, so their rows show the amount instead of the time.
const money = computed(() => props.record.kind === 'order');
defineEmits(['select']);
const { t } = useI18n();

const summary = computed(() => summarize(props.record));
const tint = computed(() => avatarTint(props.record.customer_name));
</script>
