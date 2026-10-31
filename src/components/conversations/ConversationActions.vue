<template>
  <!-- What the team does with a chat, in its header: Done (backend I3) quiet, Take it
       (I1) as the one black button while nobody has the chat, and the rest in one
       More menu: who has it (I1), Snooze (I3), and AI off or Block for the visitor
       (I2). What is on now shows in `ConversationChips`. -->
  <div ref="root" class="relative flex items-center gap-1.5">
    <button v-if="conversation.done_at" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('done', false)">
      {{ t('conversations.later.notDone') }}
    </button>
    <button v-else type="button" class="btn btn-secondary btn-sm" :disabled="busy" :title="t('conversations.later.doneHint')" @click="$emit('done', true)">
      <PhCheck :size="16"></PhCheck>
      {{ t('conversations.later.done') }}
    </button>

    <button v-if="!conversation.assigned_to" type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="$emit('assign', meId)">
      <PhHandGrabbing :size="16"></PhHandGrabbing>
      {{ t('conversations.assign.take') }}
    </button>

    <button
      type="button"
      class="btn btn-secondary btn-icon btn-sm"
      :aria-label="t('conversations.more')"
      :title="t('conversations.more')"
      :aria-expanded="open"
      aria-haspopup="menu"
      :disabled="busy"
      @click="open = !open"
    >
      <PhDotsThree :size="20" weight="bold"></PhDotsThree>
    </button>

    <div v-if="open" class="popover right-0 w-72" role="menu">
      <template v-if="assignable">
        <AssignItems :conversation="conversation" :members="members" :me-id="meId" :can-assign-anyone="canAssignAnyone" @assign="assign"></AssignItems>
        <div class="my-1.5 border-t border-hairline"></div>
      </template>

      <p class="px-3 pt-1.5 pb-1 text-xs font-semibold text-ink-soft">{{ t('conversations.later.snooze') }}</p>
      <button v-for="choice in SNOOZES" :key="choice" type="button" class="menu-item" role="menuitem" @click="snooze(choice)">
        <PhAlarm :size="16" class="text-ink-soft"></PhAlarm>
        {{ t(`conversations.later.${choice}`) }}
      </button>
      <form v-if="picking" class="flex flex-col gap-2 px-3 py-1.5" @submit.prevent="snoozeAt">
        <label class="text-xs text-ink-soft" for="snooze-at">{{ t('conversations.later.pickTimeLabel') }}</label>
        <input
          id="snooze-at"
          v-model="picked"
          type="datetime-local"
          class="field"
          required
          :min="pickable(0)"
          :max="pickable(MAX_SNOOZE_DAYS)"
        />
        <button type="submit" class="btn btn-secondary btn-sm" :disabled="!picked">
          <PhAlarm :size="16"></PhAlarm>
          {{ t('conversations.later.snooze') }}
        </button>
      </form>
      <button v-else type="button" class="menu-item" role="menuitem" @click="picking = true">
        <PhCalendarDots :size="16" class="text-ink-soft"></PhCalendarDots>
        {{ t('conversations.later.pickTime') }}
      </button>
      <button v-if="snoozed" type="button" class="menu-item" role="menuitem" @click="snooze('wake')">
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

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhAlarm, PhArrowUUpLeft, PhCalendarDots, PhCheck, PhDotsThree, PhHandGrabbing, PhProhibit, PhRobot } from '@phosphor-icons/vue';

import { usePopover } from '../../composables/usePopover.js';
import AssignItems from './AssignItems.vue';

const props = defineProps({
  conversation: { type: Object, required: true },
  members: { type: Array, default: () => [] }, // the team with their open chats, for the owner's list
  meId: { type: String, default: '' },
  canAssignAnyone: { type: Boolean, default: false }, // the owner
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['assign', 'done', 'snooze', 'change']);
const { t } = useI18n();
const { open, root } = usePopover();

const SNOOZES = ['inAnHour', 'tomorrow', 'nextWeek'];
const MAX_SNOOZE_DAYS = 30; // the backend's limit (I3)
const picking = ref(false); // "Pick a time" shows a date-and-time field
const picked = ref('');
watch(open, () => (picking.value = false)); // the menu opens on its choices again

const visitor = computed(() => props.conversation.visitor); // null: a chat from before visitors were known
const snoozed = computed(() => {
  const until = props.conversation.snoozed_until;
  return Boolean(until) && new Date(until) > new Date();
});
// A moderator has nothing to choose on a colleague's chat.
const assignable = computed(() => props.canAssignAnyone || !props.conversation.assigned_to || props.conversation.assigned_to === props.meId);

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

// The browser's clock `days` from now, in the field's shape ("2026-10-28T15:30"): its min and max.
function pickable(days) {
  const at = new Date();
  at.setDate(at.getDate() + days);
  at.setMinutes(at.getMinutes() - at.getTimezoneOffset());
  return at.toISOString().slice(0, 16);
}

// The field's time is the browser's, as the other choices are.
function snoozeAt() {
  open.value = false;
  emit('snooze', new Date(picked.value).toISOString());
}

function assign(userId) {
  open.value = false;
  if (userId !== (props.conversation.assigned_to || null)) emit('assign', userId);
}

function change(what) {
  open.value = false;
  emit('change', what);
}
</script>
