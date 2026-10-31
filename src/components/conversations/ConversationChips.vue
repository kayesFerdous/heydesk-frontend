<template>
  <!-- What is on for the chat now, under its header: who has it, a snooze, and a
       block or the AI off, so the chat says so without opening the menu. Nothing
       on, no line. -->
  <div v-if="holder || snoozedText || visitor?.blocked || visitor?.ai_off" class="flex flex-wrap items-center gap-1.5 border-b border-hairline px-4 py-2 sm:px-5">
    <span v-if="holder" class="chip max-w-64 bg-hover text-ink-soft" :title="t('conversations.assign.assignedTo')">
      <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[0.6875rem] font-bold text-ink">
        {{ (isMine ? t('conversations.assign.you') : holder).charAt(0).toUpperCase() }}
      </span>
      <span class="truncate">{{ isMine ? t('conversations.assign.withYou') : t('conversations.assign.with', { email: holder }) }}</span>
    </span>
    <span v-if="snoozedText" class="chip bg-hover text-ink-soft">
      <PhAlarm :size="14"></PhAlarm>
      {{ snoozedText }}
    </span>
    <span v-if="visitor?.blocked" class="chip bg-danger-tint text-danger">
      <PhProhibit :size="14" weight="bold"></PhProhibit>
      {{ blockedLine(visitor, t) }}
    </span>
    <span v-else-if="visitor?.ai_off" class="chip bg-attention-tint text-attention">
      <PhRobot :size="14"></PhRobot>
      {{ t('conversations.them.aiIsOff') }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhAlarm, PhProhibit, PhRobot } from '@phosphor-icons/vue';

import { blockedLine } from '../../lib/blocked.js';
import { formatDay, formatTime } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  meId: { type: String, default: '' },
});
const { t } = useI18n();

const visitor = computed(() => props.conversation.visitor); // null: a chat from before visitors were known
const holder = computed(() => (props.conversation.assigned_to ? props.conversation.assigned_email || '?' : ''));
const isMine = computed(() => Boolean(props.meId) && props.conversation.assigned_to === props.meId);
const snoozedText = computed(() => {
  const until = props.conversation.snoozed_until;
  if (!until || new Date(until) <= new Date()) return '';
  return t('conversations.later.snoozedUntil', { when: `${formatDay(until)}, ${formatTime(until)}` });
});
</script>
