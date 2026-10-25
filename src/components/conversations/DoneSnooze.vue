<template>
  <!-- Done hides the chat until the buyer writes again; Snooze hides it until a time, when it
       comes back with an alert (backend I3). -->
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <span v-if="snoozedText" class="chip bg-hover px-2.5 text-[0.8125rem] font-semibold text-ink-soft">
      <PhAlarm :size="14"></PhAlarm>
      {{ snoozedText }}
    </span>
    <button v-if="conversation.done_at" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('done', false)">
      {{ t('conversations.later.notDone') }}
    </button>
    <button v-else type="button" class="btn btn-secondary btn-sm" :disabled="busy" :title="t('conversations.later.doneHint')" @click="$emit('done', true)">
      <PhCheck :size="14"></PhCheck>
      {{ t('conversations.later.done') }}
    </button>
    <select
      class="field h-9 w-auto py-0"
      :aria-label="t('conversations.later.snooze')"
      :disabled="busy"
      @change="pick($event)"
    >
      <option value="">{{ t('conversations.later.snooze') }}</option>
      <option value="hour">{{ t('conversations.later.inAnHour') }}</option>
      <option value="tomorrow">{{ t('conversations.later.tomorrow') }}</option>
      <option value="week">{{ t('conversations.later.nextWeek') }}</option>
      <option v-if="conversation.snoozed_until" value="now">{{ t('conversations.later.wake') }}</option>
    </select>
    <p v-if="error" class="w-full text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhAlarm, PhCheck } from '@phosphor-icons/vue';

import { formatDay, formatTime } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
const emit = defineEmits(['done', 'snooze']);
const { t } = useI18n();

const snoozedText = computed(() => {
  const until = props.conversation.snoozed_until;
  if (!until || new Date(until) <= new Date()) return '';
  return t('conversations.later.snoozedUntil', { when: `${formatDay(until)}, ${formatTime(until)}` });
});

// When each choice ends, from now: an hour, 9 in the morning tomorrow, or a week.
function untilFor(choice) {
  const at = new Date();
  if (choice === 'hour') at.setHours(at.getHours() + 1);
  if (choice === 'tomorrow') {
    at.setDate(at.getDate() + 1);
    at.setHours(9, 0, 0, 0);
  }
  if (choice === 'week') at.setDate(at.getDate() + 7);
  return at.toISOString();
}

function pick(event) {
  const choice = event.target.value;
  event.target.value = ''; // the menu goes back to "Snooze"
  if (choice) emit('snooze', choice === 'now' ? null : untilFor(choice));
}
</script>
