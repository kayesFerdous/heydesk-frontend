<template>
  <!-- Who has the chat (backend I1), as one button. The owner picks anyone on the team from
       a list with their open chats; a moderator takes a free one and gives back their own. -->
  <div ref="root" class="relative">
    <!-- A colleague's chat: a moderator only sees whose it is. -->
    <span v-if="!canAssignAnyone && holder && !isMine" class="chip h-9 max-w-56 bg-hover px-3 text-sm text-ink-soft" :title="t('conversations.assign.assignedTo')">
      <span :class="AVATAR">{{ initialOf(holder) }}</span>
      <span class="truncate">{{ t('conversations.assign.with', { email: holder }) }}</span>
    </span>

    <button
      v-else-if="!canAssignAnyone && !holder"
      type="button"
      class="btn btn-secondary btn-sm"
      :disabled="busy"
      @click="$emit('assign', meId)"
    >
      <PhHandGrabbing :size="16"></PhHandGrabbing>
      {{ t('conversations.assign.take') }}
    </button>

    <button
      v-else
      type="button"
      class="btn btn-secondary btn-sm max-w-56"
      :title="t('conversations.assign.assignedTo')"
      :aria-expanded="open"
      aria-haspopup="menu"
      :disabled="busy"
      @click="open = !open"
    >
      <template v-if="holder">
        <span :class="AVATAR">{{ initialOf(isMine ? t('conversations.assign.you') : holder) }}</span>
        <span class="truncate">{{ isMine ? t('conversations.assign.you') : holder }}</span>
      </template>
      <template v-else>
        <PhUserPlus :size="16"></PhUserPlus>
        {{ t('conversations.assign.assign') }}
      </template>
      <PhCaretDown :size="14" class="shrink-0 text-ink-soft"></PhCaretDown>
    </button>

    <div v-if="open" class="popover right-0 w-72" role="menu">
      <template v-if="canAssignAnyone">
        <p class="px-3 pt-1.5 pb-1 text-xs font-semibold text-ink-soft">{{ t('conversations.assign.giveTo') }}</p>
        <button v-for="person in people" :key="person.id" type="button" class="menu-item" role="menuitem" @click="pick(person.id)">
          <span :class="AVATAR">{{ initialOf(person.name) }}</span>
          <span class="min-w-0 flex-1 truncate">{{ person.name }}</span>
          <span class="text-xs font-normal text-ink-soft" :title="t('conversations.assign.openHint')">
            {{ t('conversations.assign.open', { n: formatNumber(person.open_chats || 0) }) }}
          </span>
          <PhCheck v-if="person.id === conversation.assigned_to" :size="16" weight="bold" class="shrink-0"></PhCheck>
        </button>
        <p v-if="people.length < 2" class="px-3 py-2 text-xs text-ink-soft">{{ t('conversations.assign.noTeam') }}</p>
      </template>
      <button v-if="holder" type="button" class="menu-item text-ink-soft" role="menuitem" @click="pick(null)">
        <PhUserMinus :size="16"></PhUserMinus>
        {{ canAssignAnyone ? t('conversations.assign.unassign') : t('conversations.assign.giveBack') }}
      </button>
    </div>

    <p v-if="error" class="absolute top-full right-0 z-20 mt-1 w-64 text-right text-sm text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCaretDown, PhCheck, PhHandGrabbing, PhUserMinus, PhUserPlus } from '@phosphor-icons/vue';

import { usePopover } from '../../composables/usePopover.js';
import { formatNumber } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  members: { type: Array, default: () => [] }, // the team, with open_chats, for the owner's list
  meId: { type: String, default: '' },
  canAssignAnyone: { type: Boolean, default: false }, // the owner
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
const emit = defineEmits(['assign']);
const { t } = useI18n();
const { open, root } = usePopover();

// A person's first letter in a small circle, the same on the button and in the list.
const AVATAR = 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[0.6875rem] font-bold text-ink';

const isMine = computed(() => Boolean(props.meId) && props.conversation.assigned_to === props.meId);
const holder = computed(() => (props.conversation.assigned_to ? props.conversation.assigned_email || '' : ''));

// You first, then everyone who has joined (an invited moderator can't sign in yet).
const people = computed(() => {
  const joined = props.members.filter((m) => m.status === 'active');
  const me = joined.filter((m) => m.id === props.meId).map((m) => ({ ...m, name: t('conversations.assign.you') }));
  const others = joined.filter((m) => m.id !== props.meId).map((m) => ({ ...m, name: m.email }));
  return [...me, ...others];
});

function initialOf(text) {
  return (text || '?').charAt(0).toUpperCase();
}

function pick(userId) {
  open.value = false;
  if (userId !== (props.conversation.assigned_to || null)) emit('assign', userId);
}
</script>
