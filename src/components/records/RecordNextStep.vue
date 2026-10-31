<template>
  <!-- The open record's one row of actions, at its top: the one next step the
       server allows (lib/flows.js) as the black button, the small tools beside
       it (call, the conversation: the slot), and the other legal moves under
       a "..." menu. -->
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5">
      <button v-if="steps.primary" type="button" class="btn btn-primary min-w-0 flex-1" :disabled="busy" @click="$emit('move', steps.primary.to)">
        <span class="truncate">{{ steps.primary.label }}</span>
      </button>
      <slot></slot>
      <div v-if="steps.others.length" ref="root" class="relative">
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          :aria-label="t('records.moreSteps')"
          :title="t('records.moreSteps')"
          aria-haspopup="menu"
          :aria-expanded="open"
          :disabled="busy"
          @click="open = !open"
        >
          <PhDotsThree :size="20" weight="bold"></PhDotsThree>
        </button>
        <div v-if="open" class="popover right-0 w-52" role="menu">
          <button
            v-for="step in steps.others"
            :key="step.to"
            type="button"
            role="menuitem"
            class="menu-item"
            :class="{ '!text-danger': step.to === 'cancelled' }"
            @click="pick(step.to)"
          >
            {{ step.label }}
          </button>
        </div>
      </div>
    </div>
    <p v-if="ended && record.flow !== 'shop_order'" class="text-[0.8125rem] text-ink-soft">{{ t('records.nothingLeft') }}</p>
    <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhDotsThree } from '@phosphor-icons/vue';

import { usePopover } from '../../composables/usePopover.js';
import { nextSteps } from '../../lib/flows.js';

const props = defineProps({
  record: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
const emit = defineEmits(['move']);
const { t } = useI18n();
const { open, root } = usePopover();

const steps = computed(() => nextSteps(props.record));
const ended = computed(() => !steps.value.primary && !steps.value.others.length);

function pick(to) {
  open.value = false;
  emit('move', to);
}
</script>
