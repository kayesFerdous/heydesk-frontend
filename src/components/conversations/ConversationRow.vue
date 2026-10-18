<template>
  <button
    type="button"
    class="row grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 text-left sm:px-8 lg:px-5"
    :class="{ 'row-selected': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span
      class="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      <!-- A visitor with no name yet shows where they wrote from, not a row of "V"s. -->
      <template v-if="row.named">{{ initials(row.name) }}</template>
      <component :is="channel.icon" v-else :size="18"></component>
    </span>

    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold">{{ row.name }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ row.preview || t('conversations.noMessagesYet') }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">{{ formatTime(row.updated_at) }}</span>
      <StatusChip v-if="row.status === 'needs_human'" status="needs_human"></StatusChip>
      <!-- Web chat is the usual case: only another channel is worth a word. -->
      <span v-else-if="row.channel !== 'web'" class="flex items-center gap-1 text-xs text-ink-soft">
        <component :is="channel.icon" :size="14" class="text-ink-faint"></component>
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

const tint = computed(() => (props.row.named ? avatarTint(props.row.name) : 'bg-hover text-ink-soft'));
const channel = computed(() => channelOf(props.row.channel));
</script>
