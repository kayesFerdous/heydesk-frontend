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
      {{ initialsOf(row.name) }}
    </span>

    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold">{{ row.name }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ row.preview || 'No messages yet' }}</span>
    </span>

    <span class="flex flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">{{ time(row.updated_at) }}</span>
      <status-chip v-if="row.status === 'needs_human'" status="needs_human"></status-chip>
      <span v-else class="chip bg-hover !font-medium text-ink-soft">
        <component :is="channel.icon" :size="14"></component>
        {{ channel.label }}
      </span>
    </span>
  </button>
</template>

<script>
import StatusChip from '../ui/StatusChip.vue';
import { channelOf } from '../../lib/channels.js';
import { formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

export default {
  components: { StatusChip },
  props: {
    row: { type: Object, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['select'],
  computed: {
    tint() {
      return avatarTint(this.row.name);
    },
    channel() {
      return channelOf(this.row.channel);
    },
  },
  methods: {
    time: formatTime,
    initialsOf: initials,
  },
};
</script>
