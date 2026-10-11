<template>
  <span class="chip" :class="look.classes">
    <component :is="look.icon" :size="13" weight="bold" :class="look.iconClass"></component>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import {
  PhClock,
  PhCheckCircle,
  PhChecks,
  PhXCircle,
  PhArchive,
  PhUserSound,
  PhHourglass,
  PhTruck,
  PhArrowUUpLeft,
} from '@phosphor-icons/vue';

import { statusLabel } from '../../lib/flows.js';

// Status is always an icon plus a word, never colour alone.
const LOOKS = {
  unpaid: { icon: PhHourglass, classes: 'bg-attention-tint text-ink', iconClass: 'text-attention' },
  new: { icon: PhClock, classes: 'bg-brand-tint text-brand' },
  ready: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  confirmed: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  done: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
  handled: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  collected: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
  shipped: { icon: PhTruck, classes: 'bg-brand-tint text-brand' },
  delivered: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
  returned: { icon: PhArrowUUpLeft, classes: 'bg-hover text-ink-soft' },
  cancelled: { icon: PhXCircle, classes: 'bg-hover text-ink-soft' },
  archived: { icon: PhArchive, classes: 'bg-hover text-ink-soft' },
  needs_human: { icon: PhUserSound, classes: 'bg-attention-tint text-ink', iconClass: 'text-attention' },
  active: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
};

const props = defineProps({
  status: { type: String, required: true },
});

const look = computed(() => LOOKS[props.status] || LOOKS.collected);
const label = computed(() => statusLabel(props.status));
</script>
