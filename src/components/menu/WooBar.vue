<template>
  <!-- The list comes from a WooCommerce store (backend D75): when it was synced, and why not. -->
  <div class="notice mx-5 mb-4 flex-col gap-3 sm:mx-8 sm:flex-row sm:items-center">
    <div class="flex min-w-0 flex-1 items-start gap-2 text-sm">
      <PhWarningCircle v-if="woo.problem" :size="16" class="mt-0.5 shrink-0 text-danger"></PhWarningCircle>
      <PhStorefront v-else :size="16" class="mt-0.5 shrink-0 text-success"></PhStorefront>
      <div class="min-w-0">
        <p>
          {{ t('menu.woo.linked') }}
          <a :href="woo.url" target="_blank" rel="noopener" class="font-medium text-brand hover:underline">{{ t('menu.woo.open') }}</a>
        </p>
        <p v-if="error || woo.problem" class="text-danger" role="alert">{{ error || woo.problem }}</p>
        <p v-else class="text-ink-soft">
          <template v-if="woo.synced_at">{{ t('menu.woo.syncedAgo', { ago: formatAgo(woo.synced_at) }) }}</template>
          {{ t('menu.woo.every') }}
        </p>
      </div>
    </div>
    <!-- Reading it again and unlinking are the owner's (backend D97). -->
    <div v-if="auth.canManage" class="flex gap-2">
      <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="sync">
        <PhArrowsClockwise :size="14"></PhArrowsClockwise>
        {{ busy ? t('menu.woo.syncing') : t('menu.woo.syncNow') }}
      </button>
      <button type="button" class="btn btn-quiet btn-sm" :disabled="busy" @click="unlink">{{ t('menu.woo.stop') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowsClockwise, PhStorefront, PhWarningCircle } from '@phosphor-icons/vue';

import { syncWoo, unlinkWoo } from '../../api/agent.js';
import { formatAgo } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

defineProps({
  woo: { type: Object, required: true }, // { url, products, synced_at, problem }
});
// `synced`: the store as synced now; `unlinked`: the list is edited here again.
const emit = defineEmits(['synced', 'unlinked']);
const { t } = useI18n();
const auth = useAuthStore();

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

// Writes the orders that changed and reads the products now.
function sync() {
  act(syncWoo, (woo) => emit('synced', woo));
}

// The list stays as it is, and the orders already in the store stay there.
function unlink() {
  act(unlinkWoo, () => emit('unlinked'));
}
</script>
