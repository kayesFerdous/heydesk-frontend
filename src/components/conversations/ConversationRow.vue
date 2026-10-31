<template>
  <!-- One conversation in the list, ruled like a ledger so a screen holds a dozen:
       who and where, when (how long they have waited, in orange, if they want a
       person), the last thing said, then what it made and who on the team has it.
       The selected one sits on pale lime with an ink edge. -->
  <button
    type="button"
    class="row flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
    :class="{ 'row-selected shadow-[inset_2px_0_0_var(--color-ink)]': selected }"
    :aria-current="selected"
    @click="$emit('select')"
  >
    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" :class="tint" aria-hidden="true">
      <!-- A visitor with no name yet shows where they wrote from, not a row of "V"s. -->
      <template v-if="row.named">{{ initials(row.name) }}</template>
      <component :is="channel.icon" v-else :size="16" :weight="channel.weight"></component>
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-1.5">
        <span class="truncate text-sm font-semibold">{{ row.name }}</span>
        <component :is="channel.icon" :size="14" :weight="channel.weight" :class="['shrink-0', channel.color || 'text-ink-faint']" :aria-label="channel.label"></component>
        <span class="ml-auto shrink-0 text-xs" :class="waiting ? 'font-semibold text-attention' : 'text-ink-soft'">
          {{ waiting ? formatAgo(row.updated_at) : formatTime(row.updated_at) }}
        </span>
      </span>
      <span class="mt-0.5 block truncate text-[0.8125rem] text-ink-soft">{{ row.preview || t('conversations.noMessagesYet') }}</span>

      <span v-if="waiting || record || row.assigned_to" class="mt-1.5 flex items-center gap-1">
        <StatusChip v-if="waiting" status="needs_human" class="!px-2 !py-0.5"></StatusChip>
        <StatusChip v-else-if="record" :status="record.status" class="!px-2 !py-0.5"></StatusChip>
        <span v-if="record" class="chip min-w-0 border border-hairline !px-2 !py-0.5 text-ink-soft">
          <span class="serial text-ink">{{ record.code }}</span>
          <span v-if="record.total" class="truncate">{{ formatMoney(record.total) }}</span>
        </span>
        <!-- Who has it (backend I1): "You", or a colleague's first letter. No one: nothing. -->
        <span v-if="mine" class="chip ml-auto bg-lime !px-2 !py-0.5 text-ink">{{ t('conversations.assign.you') }}</span>
        <span
          v-else-if="row.assigned_to"
          class="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hover text-[0.6875rem] font-bold text-ink-soft"
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
import { formatAgo, formatMoney, formatTime } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

const props = defineProps({
  row: { type: Object, required: true }, // with `name`, `named`, `preview` and the newest `record` it made
  selected: { type: Boolean, default: false },
  meId: { type: String, default: '' }, // to say "You" on the signed-in person's chats
});
defineEmits(['select']);
const { t } = useI18n();

const channel = computed(() => channelOf(props.row.channel));
const tint = computed(() => (props.row.named ? avatarTint(props.row.name) : channel.value.avatar));
const waiting = computed(() => props.row.status === 'needs_human');
const record = computed(() => props.row.record);
const mine = computed(() => Boolean(props.row.assigned_to) && props.row.assigned_to === props.meId);
</script>
