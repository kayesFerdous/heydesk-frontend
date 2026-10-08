<template>
  <!-- One inbox row in the landing demo, drawn like the real Inbox. -->
  <div class="flex items-center gap-3">
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand" aria-hidden="true">
      {{ row.initials }}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate font-semibold">
        {{ row.name }}
        <span v-if="row.code" class="ml-1 font-normal text-ink-soft">{{ row.code }}</span>
      </span>
      <span class="block truncate text-ink-soft">{{ row.summary }}</span>
    </span>
    <span class="flex shrink-0 flex-col items-end gap-1">
      <span class="text-xs text-ink-soft">
        {{ time }}<template v-if="row.amount"> · <span class="font-semibold text-ink">{{ row.amount }}</span></template>
      </span>
      <status-chip :status="row.status"></status-chip>
    </span>
  </div>
</template>

<script>
import StatusChip from '../ui/StatusChip.vue';

export default {
  components: { StatusChip },
  props: {
    row: { type: Object, required: true },
    time: { type: String, default: '' },
  },
};
</script>
