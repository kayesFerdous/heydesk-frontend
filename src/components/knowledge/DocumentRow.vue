<template>
  <li class="row flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-8">
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <component :is="icon" :size="18"></component>
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold" :title="document.filename || document.title">{{ document.title }}</p>
      <p class="mt-0.5 text-sm text-ink-soft">
        {{ t('knowledge.row.meta', { kind: t(`knowledge.kinds.${kind}`), pieces: t('knowledge.row.pieces', { n: formatNumber(document.chunk_count) }, document.chunk_count), day }) }}
      </p>
    </div>

    <span v-if="confirming" class="flex items-center gap-2 text-sm">
      <span>{{ t('knowledge.row.removeIt') }}</span>
      <button type="button" class="btn btn-danger btn-sm" :disabled="busy" @click="$emit('remove')">
        {{ busy ? t('knowledge.row.removing') : t('common.remove') }}
      </button>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="confirming = false">{{ t('common.keepIt') }}</button>
    </span>
    <span v-else class="flex items-center gap-1">
      <button type="button" class="btn btn-quiet btn-sm" @click="$emit('read')">{{ t('knowledge.row.read') }}</button>
      <button type="button" class="btn btn-quiet btn-sm hover:!text-danger" @click="confirming = true">{{ t('common.remove') }}</button>
    </span>
  </li>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhFilePdf, PhFileMd, PhFileText } from '@phosphor-icons/vue';

import { formatDay, formatNumber } from '../../lib/format.js';

const ICONS = {
  pdf: PhFilePdf,
  markdown: PhFileMd,
  text: PhFileText,
};

const props = defineProps({
  document: { type: Object, required: true },
  timezone: { type: String, default: 'Asia/Dhaka' },
  busy: { type: Boolean, default: false },
});
defineEmits(['read', 'remove']);
const { t } = useI18n();

const confirming = ref(false);
const kind = computed(() => (ICONS[props.document.kind] ? props.document.kind : 'text'));
const icon = computed(() => ICONS[kind.value]);
const day = computed(() => formatDay(props.document.created_at, props.timezone));

// The row stays put when a remove fails, so the question must reset.
watch(
  () => props.busy,
  (now) => {
    if (!now) confirming.value = false;
  },
);
</script>
