<template>
  <!-- One conversation in the list: who, the last thing said, when, whether they
       wait for a person, and who on the team has it. The selected one sits on pale lime. -->
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-[var(--radius-card)] p-2.5 text-left transition-colors"
    :class="selected ? 'bg-brand-tint' : 'hover:bg-wash'"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold" :class="tint" aria-hidden="true">
      <!-- A visitor with no name yet shows where they wrote from, not a row of "V"s. -->
      <template v-if="row.named">{{ initials(row.name) }}</template>
      <component :is="channel.icon" v-else :size="22" :weight="channel.weight"></component>
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-[0.9375rem] font-bold">{{ row.name }}</span>
      <span class="block truncate text-sm text-ink-soft">{{ row.preview || t('conversations.noMessagesYet') }}</span>
    </span>

    <span class="flex shrink-0 flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">{{ formatTime(row.updated_at) }}</span>
      <span class="flex items-center gap-1">
        <StatusChip v-if="row.status === 'needs_human'" status="needs_human"></StatusChip>
        <!-- Web chat is the usual case: only another channel is worth a word. -->
        <span v-else-if="row.channel !== 'web'" class="chip bg-hover text-ink-soft">
          <component :is="channel.icon" :size="14" :weight="channel.brand ? 'fill' : 'bold'" :class="channel.color"></component>
          {{ channel.label }}
        </span>
        <!-- Who has it (backend I1): "You", or a colleague's first letter. No one: nothing. -->
        <span v-if="row.assigned_to === meId" class="chip bg-lime text-ink">{{ t('conversations.assign.you') }}</span>
        <span
          v-else-if="row.assigned_to"
          class="grid h-6 w-6 place-items-center rounded-full bg-hover text-[0.6875rem] font-bold text-ink-soft"
          :title="t('conversations.assign.with', { email: row.assigned_email || '' })"
          :aria-label="t('conversations.assign.with', { email: row.assigned_email || '' })"
        >
          {{ (row.assigned_email || '?').charAt(0).toUpperCase() }}
        </span>
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
  meId: { type: String, default: '' }, // to say "You" on the signed-in person's chats
});
defineEmits(['select']);
const { t } = useI18n();

const channel = computed(() => channelOf(props.row.channel));
const tint = computed(() => (props.row.named ? avatarTint(props.row.name) : channel.value.avatar));
</script>
