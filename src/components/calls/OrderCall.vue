<template>
  <!-- A shop order's call to confirm it (backend D89): how it stands, and a way
       to call a new order now. It owns its small fetch, like VoiceCall.vue. -->
  <div v-if="enabled || latest" class="mt-5 flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
    <p v-if="latest" class="flex items-center justify-between gap-3">
      <span class="flex items-center gap-2 text-ink-soft">
        <PhPhoneCall :size="16"></PhPhoneCall>
        {{ t('calls.onOrder') }}
      </span>
      <span class="flex items-center gap-2">
        <span class="text-xs text-ink-soft">{{ formatTime(latest.updated_at) }}</span>
        <StatusChip :status="callState(latest)"></StatusChip>
      </span>
    </p>
    <button
      v-if="enabled && order.status === 'new' && !waiting"
      type="button"
      class="btn btn-secondary w-full"
      :disabled="busy"
      @click="call"
    >
      <PhPhoneCall :size="16"></PhPhoneCall>
      {{ t('calls.callToConfirm') }}
    </button>
    <router-link v-else-if="waiting" to="/calls" class="link self-start text-sm font-medium">{{ t('calls.seeQueue') }}</router-link>
    <p v-if="error" class="text-danger" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPhoneCall } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { fetchCalls, callOrder } from '../../api/calls.js';
import { formatTime } from '../../lib/format.js';
import { callState } from '../../lib/calls.js';
import { useAgentStore } from '../../stores/agent.js';

const props = defineProps({
  order: { type: Object, required: true },
});
const { t } = useI18n();
const agent = useAgentStore();

const calls = ref([]);
const busy = ref(false);
const error = ref(null);

const enabled = computed(() => !!agent.config?.knowledge.calls?.enabled);
const latest = computed(() => calls.value[0] ?? null); // newest first
const waiting = computed(() => calls.value.some((c) => c.status !== 'done'));

async function load() {
  try {
    calls.value = await fetchCalls({ orderId: props.order.id });
  } catch {
    calls.value = []; // the order still shows; only its call line is missing
  }
}

async function call() {
  busy.value = true;
  error.value = null;
  try {
    await callOrder(props.order.id);
    await load();
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

// Another order opened, or this one moved on (a call may have confirmed it).
watch(() => [props.order.id, props.order.status], load, { immediate: true });
</script>
