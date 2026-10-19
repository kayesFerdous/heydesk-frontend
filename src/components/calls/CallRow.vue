<template>
  <!-- One call: its place in line (or when it ended), the buyer, the order, how
       it stands, and what the owner can do about it. -->
  <div class="row flex items-center gap-4 px-5 py-3 sm:px-8">
    <span
      class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
      :class="call.place === 1 ? 'bg-brand text-white' : 'bg-hover text-ink-soft'"
      :aria-label="call.place ? t('calls.placeLabel', { n: formatNumber(call.place) }) : undefined"
    >
      <template v-if="call.place">{{ formatNumber(call.place) }}</template>
      <PhPhoneCall v-else :size="16" weight="bold"></PhPhoneCall>
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold">{{ call.name }}</span>
      <span class="block truncate text-sm text-ink-soft">
        <span class="serial">{{ call.code }}</span> · {{ call.phone }}
      </span>
      <span class="block text-xs text-ink-soft">{{ when }}</span>
    </span>

    <StatusChip :status="callState(call)"></StatusChip>

    <span class="flex shrink-0 gap-1">
      <button v-if="call.status === 'queued' && call.place !== 1" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('now')">
        {{ t('calls.callNow') }}
      </button>
      <button v-if="call.status === 'queued'" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('stop')">
        {{ t('calls.cancel') }}
      </button>
      <button v-if="canCallAgain(call)" type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="$emit('again')">
        {{ t('calls.callAgain') }}
      </button>
      <router-link v-if="call.conversation_id" :to="`/conversations?open=${call.conversation_id}`" class="btn btn-quiet btn-sm">
        {{ t('calls.readCall') }}
      </router-link>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPhoneCall } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { formatNumber, formatTime } from '../../lib/format.js';
import { callState, canCallAgain } from '../../lib/calls.js';

const props = defineProps({
  call: { type: Object, required: true },
  tries: { type: Number, default: 1 }, // the shop's setting: how many rings before it gives up
  busy: { type: Boolean, default: false },
});
defineEmits(['now', 'stop', 'again']);
const { t } = useI18n();

// Waiting: when it rings next, and which try that is. Done: when it ended.
const when = computed(() => {
  const c = props.call;
  if (c.status === 'done') return formatTime(c.updated_at);
  if (c.status !== 'queued') return t('calls.tryOf', { n: formatNumber(c.tries), max: formatNumber(props.tries) });
  const next = new Date(c.next_try_at) <= new Date() ? t('calls.due') : t('calls.at', { time: formatTime(c.next_try_at) });
  return c.tries ? `${next} · ${t('calls.tryOf', { n: formatNumber(c.tries + 1), max: formatNumber(props.tries) })}` : next;
});
</script>
