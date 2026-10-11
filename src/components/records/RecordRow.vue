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
      {{ initials(record.customer_name) }}
    </span>

    <span class="min-w-0">
      <span class="flex items-baseline gap-2">
        <span class="truncate text-sm font-semibold">
          {{ record.customer_name || t('records.customer') }}
        </span>
        <span class="shrink-0 text-xs text-ink-soft">{{ record.code }}</span>
      </span>
      <span class="block truncate text-sm text-ink-soft">{{ summary }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="flex items-center gap-2">
        <span v-if="record.kind === 'order'" class="text-sm font-semibold">{{ formatMoney(record.total) }}</span>
        <span v-else class="text-xs text-ink-soft">{{ formatTime(record.created_at) }}</span>
      </span>
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
defineEmits(['select']);
const { t } = useI18n();

const summary = computed(() => summarize(props.record));
const tint = computed(() => avatarTint(props.record.customer_name));
</script>
