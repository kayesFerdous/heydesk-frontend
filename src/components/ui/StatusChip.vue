<template>
  <span class="chip" :class="look.classes">
    <component :is="look.icon" :size="13" weight="bold" :class="look.iconClass"></component>
    {{ label }}
  </span>
</template>

<script>
import {
  PhClock,
  PhCheckCircle,
  PhChecks,
  PhXCircle,
  PhArchive,
  PhUserSound,
} from '@phosphor-icons/vue';

import { STATUS_LABELS } from '../../lib/flows.js';

// Status is always an icon plus a word, never colour alone.
const LOOKS = {
  new: { icon: PhClock, classes: 'bg-brand-tint text-brand' },
  ready: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  confirmed: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  done: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
  handled: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  collected: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
  cancelled: { icon: PhXCircle, classes: 'bg-hover text-ink-soft' },
  archived: { icon: PhArchive, classes: 'bg-hover text-ink-soft' },
  needs_human: { icon: PhUserSound, classes: 'bg-attention-tint text-ink', iconClass: 'text-attention' },
  active: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
};

export default {
  props: {
    status: { type: String, required: true },
  },
  computed: {
    look() {
      return LOOKS[this.status] || LOOKS.collected;
    },
    label() {
      return STATUS_LABELS[this.status] || this.status;
    },
  },
};
</script>
