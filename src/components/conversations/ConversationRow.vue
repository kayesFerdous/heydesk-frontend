<template>
  <button
    type="button"
    class="row grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 text-left"
    :class="{ 'row-selected': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span
      class="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      {{ initials(row.name) }}
    </span>

    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold">{{ row.name }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ row.preview || t('conversations.noMessagesYet') }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">{{ formatTime(row.updated_at) }}</span>
      <StatusChip v-if="row.status === 'needs_human'" status="needs_human"></StatusChip>
      <span v-else class="chip bg-hover !font-medium text-ink-soft">
        <component :is="channel.icon" :size="14"></component>
        {{ channel.label }}
      </span>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusChip from '../ui/StatusChip.vue';
import { channelOf } from '../../lib/channels.js';
import { formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

const props = defineProps({
  row: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});
defineEmits(['select']);
const { t } = useI18n();

const tint = computed(() => avatarTint(props.row.name));
const channel = computed(() => channelOf(props.row.channel));
</script>
