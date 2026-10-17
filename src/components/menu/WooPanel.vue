<template>
  <!-- A shop's WooCommerce store (backend D75): its address and a Read/Write key. -->
  <div class="panel mx-5 mb-4 bg-wash p-5 sm:mx-8">
    <form class="flex max-w-2xl flex-col gap-3" @submit.prevent="connect">
      <h2 class="section-title">
        {{ t('menu.woo.title') }}
        <InfoTip :text="t('menu.woo.intro')" class="ml-0.5 -translate-y-px"></InfoTip>
      </h2>

      <label class="mt-1 text-sm font-semibold" for="woo-url">{{ t('menu.woo.address') }}</label>
      <input
        id="woo-url"
        v-model.trim="url"
        class="field"
        type="url"
        placeholder="https://yourshop.com"
        lang="en"
        :disabled="busy"
      />

      <label class="text-sm font-semibold" for="woo-key">{{ t('menu.woo.key') }}</label>
      <p class="-mt-2 text-sm text-ink-soft">{{ t('menu.woo.keyText') }}</p>
      <input id="woo-key" v-model.trim="key" class="field" placeholder="ck_..." lang="en" autocomplete="off" :disabled="busy" />

      <label class="text-sm font-semibold" for="woo-secret">{{ t('menu.woo.secret') }}</label>
      <input
        id="woo-secret"
        v-model.trim="secret"
        class="field"
        type="password"
        placeholder="cs_..."
        lang="en"
        autocomplete="off"
        :disabled="busy"
      />

      <p class="text-sm text-attention">
        {{ t('menu.woo.replaces', { n: formatNumber(currentCount) }) }}
      </p>
      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="busy || !url || !key || !secret">
          {{ busy ? t('menu.woo.connecting') : t('menu.woo.connect') }}
        </button>
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="$emit('close')">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import InfoTip from '../ui/InfoTip.vue';
import { linkWoo } from '../../api/agent.js';
import { formatNumber } from '../../lib/format.js';

defineProps({
  currentCount: { type: Number, default: 0 },
});
// `linked`: the store as linked now, `{url, products, synced_at, problem}`.
const emit = defineEmits(['close', 'linked']);
const { t } = useI18n();

const url = ref('');
const key = ref('');
const secret = ref('');
const busy = ref(false);
const error = ref(null);

async function connect() {
  busy.value = true;
  error.value = null;
  try {
    emit('linked', await linkWoo(url.value, key.value, secret.value));
  } catch (err) {
    // The server's own sentence for the field it refused ("Make the key Read/Write..."),
    // without the field's name in front.
    error.value = Object.values(err.fields || {})[0] || err.message;
  }
  busy.value = false;
}
</script>
