<template>
  <!-- The team's say over this visitor (backend I2): Block them, or turn the AI off so the
       team answers by hand. Either way their messages cost nothing. -->
  <div v-if="visitor" class="flex flex-wrap items-center gap-2 text-sm">
    <template v-if="visitor.blocked">
      <span class="chip bg-danger-tint px-2.5 text-[0.8125rem] font-semibold text-danger">
        <PhProhibit :size="14" weight="bold"></PhProhibit>
        {{ blockedText }}
      </span>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="$emit('change', { blocked: false })">
        {{ t('conversations.them.unblock') }}
      </button>
    </template>
    <template v-else>
      <span v-if="visitor.ai_off" class="chip bg-attention-tint px-2.5 text-[0.8125rem] font-semibold text-attention">
        {{ t('conversations.them.aiIsOff') }}
      </span>
      <button type="button" class="btn btn-quiet btn-sm" :disabled="busy" :title="t('conversations.them.aiOffHint')" @click="$emit('change', { ai_off: !visitor.ai_off })">
        {{ visitor.ai_off ? t('conversations.them.aiOn') : t('conversations.them.aiOff') }}
      </button>
      <button type="button" class="btn btn-quiet btn-sm text-danger" :disabled="busy" :title="t('conversations.them.blockHint')" @click="$emit('change', { blocked: true })">
        {{ t('conversations.them.block') }}
      </button>
    </template>
    <p v-if="error" class="w-full text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhProhibit } from '@phosphor-icons/vue';

import { blockedLine } from '../../lib/blocked.js';

const props = defineProps({
  visitor: { type: Object, default: null }, // null: a chat from before visitors were known
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
defineEmits(['change']);
const { t } = useI18n();

const blockedText = computed(() => blockedLine(props.visitor, t));
</script>
