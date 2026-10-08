<template>
  <li class="row flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-8">
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <component :is="icon" :size="18"></component>
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold" :title="document.filename || document.title">{{ document.title }}</p>
      <p class="mt-0.5 text-sm text-ink-soft">
        {{ kindLabel }}, {{ document.chunk_count }} {{ document.chunk_count === 1 ? 'piece' : 'pieces' }}, added {{ day }}
      </p>
    </div>

    <span v-if="confirming" class="flex items-center gap-2 text-sm">
      <span>Remove it?</span>
      <button type="button" class="btn btn-danger btn-sm" :disabled="busy" @click="$emit('remove')">
        {{ busy ? 'Removing...' : 'Remove' }}
      </button>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="confirming = false">Keep it</button>
    </span>
    <span v-else class="flex items-center gap-1">
      <button type="button" class="btn btn-quiet btn-sm" @click="$emit('read')">Read</button>
      <button type="button" class="btn btn-quiet btn-sm hover:!text-danger" @click="confirming = true">Remove</button>
    </span>
  </li>
</template>

<script>
import { PhFilePdf, PhFileMd, PhFileText } from '@phosphor-icons/vue';

import { formatDay } from '../../lib/format.js';

const KINDS = {
  pdf: { label: 'PDF', icon: PhFilePdf },
  markdown: { label: 'Markdown', icon: PhFileMd },
  text: { label: 'Text', icon: PhFileText },
};

export default {
  props: {
    document: { type: Object, required: true },
    timezone: { type: String, default: 'Asia/Dhaka' },
    busy: { type: Boolean, default: false },
  },
  emits: ['read', 'remove'],
  data() {
    return { confirming: false };
  },
  computed: {
    kind() {
      return KINDS[this.document.kind] || KINDS.text;
    },
    kindLabel() {
      return this.kind.label;
    },
    icon() {
      return this.kind.icon;
    },
    day() {
      return formatDay(this.document.created_at, this.timezone);
    },
  },
  watch: {
    // The row stays put when a remove fails, so the question must reset.
    busy(now) {
      if (!now) this.confirming = false;
    },
  },
};
</script>
