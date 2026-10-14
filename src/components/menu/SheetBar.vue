<template>
  <!-- The list is kept in a Google Sheet (backend D58): where it's read from, when, and why not. -->
  <div class="notice mx-5 mb-4 flex-col gap-3 sm:mx-8 sm:flex-row sm:items-center">
    <div class="flex min-w-0 flex-1 items-start gap-2 text-sm">
      <PhWarningCircle v-if="sheet.problem" :size="16" class="mt-0.5 shrink-0 text-danger"></PhWarningCircle>
      <PhTable v-else :size="16" class="mt-0.5 shrink-0 text-success"></PhTable>
      <div class="min-w-0">
        <p>
          {{ t('menu.sheet.linked') }}
          <a :href="sheet.url" target="_blank" rel="noopener" class="font-medium text-brand hover:underline">{{ t('menu.sheet.open') }}</a>
        </p>
        <p v-if="error || sheet.problem" class="text-danger" role="alert">{{ error || sheet.problem }}</p>
        <p v-else class="text-ink-soft">
          <template v-if="sheet.synced_at">{{ t('menu.sheet.readAgo', { ago: formatAgo(sheet.synced_at) }) }}</template>
          {{ t('menu.sheet.every') }}
        </p>
      </div>
    </div>
    <div class="flex gap-2">
      <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="sync">
        <PhArrowsClockwise :size="14"></PhArrowsClockwise>
        {{ busy ? t('menu.sheet.reading') : t('menu.sheet.readNow') }}
      </button>
      <button type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="unlink">{{ t('menu.sheet.stop') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowsClockwise, PhTable, PhWarningCircle } from '@phosphor-icons/vue';

import { syncSheet, unlinkSheet } from '../../api/agent.js';
import { formatAgo } from '../../lib/format.js';

defineProps({
  sheet: { type: Object, required: true }, // { url, synced_at, problem }
});
// `synced`: the sheet as read now; `unlinked`: the list is edited here again.
const emit = defineEmits(['synced', 'unlinked']);
const { t } = useI18n();

const busy = ref(false);
const error = ref(null);

async function act(call, after) {
  busy.value = true;
  error.value = null;
  try {
    after(await call());
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

function sync() {
  act(syncSheet, (sheet) => emit('synced', sheet));
}

// The list stays as it is: nothing is lost by stopping.
function unlink() {
  act(unlinkSheet, () => emit('unlinked'));
}
</script>
