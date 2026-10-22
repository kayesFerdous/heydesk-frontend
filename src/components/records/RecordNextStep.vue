<template>
  <!-- Beside the receipt: who the customer is, how to reach them, and the
       one next step the server allows (lib/flows.js). -->
  <div class="flex flex-col p-5 sm:p-6">
    <div class="flex items-start justify-between gap-3">
      <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold" :class="tint" aria-hidden="true">
        {{ initials(record.customer_name) }}
      </span>
      <a
        v-if="record.customer_phone"
        :href="`tel:${record.customer_phone}`"
        class="btn btn-secondary btn-icon shrink-0"
        :aria-label="t('records.call', { name })"
        :title="t('records.call', { name })"
      >
        <PhPhone :size="18" weight="fill"></PhPhone>
      </a>
    </div>
    <p class="mt-3 text-lg font-bold break-words">{{ name }}</p>
    <p v-if="record.customer_phone" class="text-sm text-ink-soft">{{ record.customer_phone }}</p>

    <div class="mt-6 rounded-[var(--radius-card)] bg-wash p-4">
      <p class="text-sm font-semibold text-ink-soft">{{ t('records.nextStep') }}</p>
      <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
      <div class="mt-3 flex flex-col gap-2">
        <button
          v-if="steps.primary"
          type="button"
          class="btn btn-primary w-full"
          :disabled="busy"
          @click="$emit('move', steps.primary.to)"
        >
          {{ steps.primary.label }}
        </button>
        <p v-else-if="!steps.others.length" class="text-sm">{{ t('records.nothingLeft') }}</p>
        <button
          v-for="step in steps.others"
          :key="step.to"
          type="button"
          class="btn btn-quiet w-full"
          :disabled="busy"
          @click="$emit('move', step.to)"
        >
          {{ step.label }}
        </button>
      </div>
    </div>

    <router-link :to="`/conversations?open=${record.conversation_id}`" class="btn btn-secondary mt-3 w-full">
      <PhChatsCircle :size="18"></PhChatsCircle>
      {{ t('records.readConversation') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatsCircle, PhPhone } from '@phosphor-icons/vue';

import { avatarTint, initials } from '../../lib/group.js';
import { nextSteps } from '../../lib/flows.js';

const props = defineProps({
  record: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
});
defineEmits(['move']);
const { t } = useI18n();

const name = computed(() => props.record.customer_name || t('records.customer'));
const tint = computed(() => avatarTint(props.record.customer_name));
const steps = computed(() => nextSteps(props.record));
</script>
