<template>
  <!-- What the team does with this chat besides who has it: Done (backend I3) as a button, the
       rest in one menu: Snooze (I3), and AI off or Block for the visitor (I2). What is on now
       shows as a chip, so a snoozed or blocked chat says so without opening the menu. -->
  <div ref="root" class="relative flex flex-wrap items-center gap-2">
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

    <button v-if="conversation.done_at" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('done', false)">
      {{ t('conversations.later.notDone') }}
    </button>
    <button v-else type="button" class="btn btn-secondary btn-sm" :disabled="busy" :title="t('conversations.later.doneHint')" @click="$emit('done', true)">
      <PhCheck :size="16"></PhCheck>
      {{ t('conversations.later.done') }}
    </button>

    <button
      type="button"
      class="btn btn-quiet btn-icon btn-sm"
      :aria-label="t('conversations.more')"
      :title="t('conversations.more')"
      :aria-expanded="open"
      aria-haspopup="menu"
      :disabled="busy"
      @click="open = !open"
    >
      <PhDotsThree :size="20" weight="bold"></PhDotsThree>
    </button>

    <div v-if="open" class="popover right-0 w-64" role="menu">
      <p class="px-3 pt-1.5 pb-1 text-xs font-semibold text-ink-soft">{{ t('conversations.later.snooze') }}</p>
      <button v-for="choice in SNOOZES" :key="choice" type="button" class="menu-item" role="menuitem" @click="snooze(choice)">
        <PhAlarm :size="16" class="text-ink-soft"></PhAlarm>
        {{ t(`conversations.later.${choice}`) }}
      </button>
      <button v-if="snoozedText" type="button" class="menu-item" role="menuitem" @click="snooze('wake')">
        <PhArrowUUpLeft :size="16" class="text-ink-soft"></PhArrowUUpLeft>
        {{ t('conversations.later.wake') }}
      </button>

      <template v-if="visitor">
        <div class="my-1.5 border-t border-hairline"></div>
        <button v-if="visitor.blocked" type="button" class="menu-item" role="menuitem" @click="change({ blocked: false })">
          <PhProhibit :size="16" class="text-ink-soft"></PhProhibit>
          {{ t('conversations.them.unblock') }}
        </button>
        <template v-else>
          <button type="button" class="menu-item" role="menuitem" :title="t('conversations.them.aiOffHint')" @click="change({ ai_off: !visitor.ai_off })">
            <PhRobot :size="16" class="text-ink-soft"></PhRobot>
            {{ visitor.ai_off ? t('conversations.them.aiOn') : t('conversations.them.aiOff') }}
          </button>
          <button type="button" class="menu-item text-danger" role="menuitem" :title="t('conversations.them.blockHint')" @click="change({ blocked: true })">
            <PhProhibit :size="16"></PhProhibit>
            {{ t('conversations.them.block') }}
          </button>
        </template>
      </template>
    </div>

    <p v-if="error" class="w-full text-right text-sm text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhAlarm, PhArrowUUpLeft, PhCheck, PhDotsThree, PhProhibit, PhRobot } from '@phosphor-icons/vue';

import { usePopover } from '../../composables/usePopover.js';
import { blockedLine } from '../../lib/blocked.js';
import { formatDay, formatTime } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
const emit = defineEmits(['done', 'snooze', 'change']);
const { t } = useI18n();
const { open, root } = usePopover();

const SNOOZES = ['inAnHour', 'tomorrow', 'nextWeek'];

const visitor = computed(() => props.conversation.visitor); // null: a chat from before visitors were known
const snoozedText = computed(() => {
  const until = props.conversation.snoozed_until;
  if (!until || new Date(until) <= new Date()) return '';
  return t('conversations.later.snoozedUntil', { when: `${formatDay(until)}, ${formatTime(until)}` });
});

// When each choice ends, from now: an hour, 9 in the morning tomorrow, or a week.
function untilFor(choice) {
  const at = new Date();
  if (choice === 'inAnHour') at.setHours(at.getHours() + 1);
  if (choice === 'tomorrow') {
    at.setDate(at.getDate() + 1);
    at.setHours(9, 0, 0, 0);
  }
  if (choice === 'nextWeek') at.setDate(at.getDate() + 7);
  return at.toISOString();
}

function snooze(choice) {
  open.value = false;
  emit('snooze', choice === 'wake' ? null : untilFor(choice));
}

function change(what) {
  open.value = false;
  emit('change', what);
}
</script>
