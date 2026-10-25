<template>
  <!-- Who has the chat (backend I1). The owner gives it to anyone on the team, or no one;
       a moderator takes a free one and gives back their own. -->
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <PhUserCircle :size="18" class="shrink-0 text-ink-soft"></PhUserCircle>
    <select
      v-if="canAssignAnyone"
      :value="conversation.assigned_to || ''"
      class="field h-9 w-auto py-0"
      :aria-label="t('conversations.assign.to')"
      :disabled="busy"
      @change="$emit('assign', $event.target.value || null)"
    >
      <option value="">{{ t('conversations.assign.noOne') }}</option>
      <option v-for="member in members" :key="member.id" :value="member.id">
        {{ member.id === meId ? t('conversations.assign.me') : member.email }}
      </option>
    </select>
    <template v-else>
      <span class="text-ink-soft">{{ holder }}</span>
      <button v-if="!conversation.assigned_to" type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="$emit('assign', meId)">
        {{ t('conversations.assign.take') }}
      </button>
      <button v-else-if="conversation.assigned_to === meId" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('assign', null)">
        {{ t('conversations.assign.giveBack') }}
      </button>
    </template>
    <p v-if="error" class="w-full text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUserCircle } from '@phosphor-icons/vue';

const props = defineProps({
  conversation: { type: Object, required: true },
  members: { type: Array, default: () => [] }, // the team, for the owner's list
  meId: { type: String, default: '' },
  canAssignAnyone: { type: Boolean, default: false }, // the owner
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
defineEmits(['assign']);
const { t } = useI18n();

const holder = computed(() => {
  const id = props.conversation.assigned_to;
  if (!id) return t('conversations.assign.unassigned');
  if (id === props.meId) return t('conversations.assign.yours');
  return t('conversations.assign.with', { email: props.conversation.assigned_email || '' });
});
</script>
