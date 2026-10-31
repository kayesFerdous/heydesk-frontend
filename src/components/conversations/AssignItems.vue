<template>
  <!-- Who has the chat (backend I1), as the top of the chat's More menu. The owner
       picks anyone on the team from a list with their open chats; a moderator takes
       a free one and gives back their own. A colleague's chat shows nothing here:
       its chip says whose it is. -->
  <template v-if="!canAssignAnyone">
    <button v-if="holder && isMine" type="button" class="menu-item" role="menuitem" @click="$emit('assign', null)">
      <PhUserMinus :size="16" class="text-ink-soft"></PhUserMinus>
      {{ t('conversations.assign.giveBack') }}
    </button>
    <button v-else-if="!holder" type="button" class="menu-item" role="menuitem" @click="$emit('assign', meId)">
      <PhHandGrabbing :size="16" class="text-ink-soft"></PhHandGrabbing>
      {{ t('conversations.assign.take') }}
    </button>
  </template>
  <template v-else>
    <p class="px-3 pt-1.5 pb-1 text-xs font-semibold text-ink-soft">{{ t('conversations.assign.giveTo') }}</p>
    <button
      v-for="person in people"
      :key="person.id"
      type="button"
      class="menu-item"
      role="menuitemradio"
      :aria-checked="person.id === conversation.assigned_to"
      @click="$emit('assign', person.id)"
    >
      <span :class="MEMBER_AVATAR">{{ initialOf(person.name) }}</span>
      <span class="min-w-0 flex-1 truncate">{{ person.name }}</span>
      <span class="text-xs font-normal text-ink-soft" :title="t('conversations.assign.openHint')">
        {{ t('conversations.assign.open', { n: formatNumber(person.open_chats || 0) }) }}
      </span>
      <PhCheck v-if="person.id === conversation.assigned_to" :size="16" weight="bold" class="shrink-0"></PhCheck>
    </button>
    <p v-if="people.length < 2" class="px-3 py-2 text-xs text-ink-soft">{{ t('conversations.assign.noTeam') }}</p>
    <button v-if="holder" type="button" class="menu-item text-ink-soft" role="menuitem" @click="$emit('assign', null)">
      <PhUserMinus :size="16"></PhUserMinus>
      {{ t('conversations.assign.unassign') }}
    </button>
  </template>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheck, PhHandGrabbing, PhUserMinus } from '@phosphor-icons/vue';

import { formatNumber } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  members: { type: Array, default: () => [] }, // the team, with open_chats, for the owner's list
  meId: { type: String, default: '' },
  canAssignAnyone: { type: Boolean, default: false }, // the owner
});
defineEmits(['assign']);
const { t } = useI18n();

// A person's first letter in a small circle, the same here and in the chips.
const MEMBER_AVATAR = 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[0.6875rem] font-bold text-ink';

const isMine = computed(() => Boolean(props.meId) && props.conversation.assigned_to === props.meId);
const holder = computed(() => Boolean(props.conversation.assigned_to));

// You first, then everyone who has joined (an invited moderator can't sign in yet).
const people = computed(() => {
  const joined = props.members.filter((m) => m.status === 'active');
  const me = joined.filter((m) => m.id === props.meId).map((m) => ({ ...m, name: t('conversations.assign.you') }));
  const others = joined.filter((m) => m.id !== props.meId).map((m) => ({ ...m, name: m.email }));
  return [...me, ...others];
});

const initialOf = (text) => (text || '?').charAt(0).toUpperCase();
</script>
