<template>
  <button
    type="button"
    class="row grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 text-left"
    :class="{ 'row-selected': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span
      class="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold"
      :class="tint"
      aria-hidden="true"
    >
      {{ initialsOf(row.name) }}
    </span>

    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold text-navy">{{ row.name }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ row.preview || 'No messages yet' }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">{{ time(row.updated_at) }}</span>
      <status-chip v-if="row.status === 'needs_human'" status="needs_human"></status-chip>
      <span v-else class="chip bg-wash !font-medium text-ink-soft">
        <component :is="row.channel === 'voice' ? 'ph-microphone' : 'ph-chat-circle'" :size="14"></component>
        {{ row.channel === 'voice' ? 'Voice' : 'Chat' }}
      </span>
    </span>
  </button>
</template>

<script>
import { PhMicrophone, PhChatCircle } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

export default {
  components: { StatusChip, PhMicrophone, PhChatCircle },
  props: {
    row: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['select'],
  computed: {
    tint() {
      return avatarTint(this.row.name);
    },
  },
  methods: {
    time: formatTime,
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
