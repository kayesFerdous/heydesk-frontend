<template>
  <div class="panel flex items-start gap-4 p-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <PhCreditCard :size="20"></PhCreditCard>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">SSLCommerz</h3>
        <span v-if="account" class="chip bg-success-tint text-success">
          <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
          {{ t('connect.connected') }}
        </span>
      </div>

      <div v-if="loading" class="skeleton mt-2 h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="mt-1 text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
      </p>

      <!-- Connected -->
      <div v-else-if="account && !changing">
        <i18n-t keypath="sslcommerz.connectedText" tag="p" class="mt-1 text-sm text-ink-soft" scope="global">
          <template #store><span class="font-semibold text-ink">{{ account.store_id }}</span></template>
        </i18n-t>
        <p v-if="account.sandbox" class="notice mt-3 text-sm" role="status">
          <PhFlask :size="18" class="mt-px shrink-0 text-attention"></PhFlask>
          <span>
            <span class="font-semibold text-ink">{{ t('sslcommerz.testModeTitle') }}</span>
            {{ t('sslcommerz.testModeText') }}
          </span>
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-secondary" @click="startChange">{{ t('sslcommerz.change') }}</button>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              {{ t('connect.disconnect') }}
            </button>
          </template>
          <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span>{{ t('sslcommerz.disconnectWarning') }}</span>
            <button type="button" class="font-semibold text-danger hover:underline" :disabled="busy" @click="disconnect">
              {{ busy ? t('connect.disconnecting') : t('connect.disconnect') }}
            </button>
            <button type="button" class="font-semibold text-ink-soft hover:underline" @click="confirmingDisconnect = false">
              {{ t('common.keepIt') }}
            </button>
          </span>
        </div>
        <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
      </div>

      <!-- Not connected, closed. What SSLCommerz is sits in the row's tip. -->
      <div v-else-if="!open">
        <p class="mt-0.5 text-sm text-ink-soft">{{ t('common.notConnected') }}</p>
        <button type="button" class="btn btn-secondary mt-3" @click="open = true">{{ t('sslcommerz.connect') }}</button>
      </div>

      <!-- Connecting: two steps -->
      <form v-else class="mt-3 flex flex-col gap-6" novalidate @submit.prevent="connect">
        <div>
          <p class="text-sm font-semibold">{{ t('sslcommerz.step1') }}</p>
          <i18n-t keypath="sslcommerz.step1Text" tag="p" class="mt-0.5 text-sm text-ink-soft" scope="global">
            <template #storeId><span class="font-semibold text-ink">{{ t('sslcommerz.storeId') }}</span></template>
            <template #storePassword><span class="font-semibold text-ink">{{ t('sslcommerz.storePassword') }}</span></template>
          </i18n-t>
          <div class="mt-3 flex flex-wrap gap-2">
            <a href="https://developer.sslcommerz.com/registration/" target="_blank" rel="noopener" class="btn btn-secondary">
              <PhArrowSquareOut :size="18"></PhArrowSquareOut>
              {{ t('sslcommerz.testAccount') }}
            </a>
            <a href="https://sslcommerz.com/" target="_blank" rel="noopener" class="btn btn-quiet">
              {{ t('sslcommerz.liveAccount') }}
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-sm font-semibold">{{ t('sslcommerz.step2') }}</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="ssl-store-id">{{ t('sslcommerz.storeId') }}</label>
              <input id="ssl-store-id" v-model.trim="storeId" class="field" type="text" autocomplete="off" spellcheck="false" placeholder="yourshop0live" />
            </div>
            <div>
              <label class="label" for="ssl-password">{{ t('sslcommerz.storePassword') }}</label>
              <input id="ssl-password" v-model.trim="password" class="field" type="password" autocomplete="new-password" placeholder="yourshop0live@ssl" />
            </div>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <label class="text-sm font-semibold" for="ssl-sandbox">{{ t('sslcommerz.testMode') }}</label>
              <p class="hint">{{ t('sslcommerz.testModeHint') }}</p>
            </div>
            <ToggleSwitch id="ssl-sandbox" v-model="sandbox" :label="t('sslcommerz.testMode')"></ToggleSwitch>
          </div>
        </div>

        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" :disabled="busy || !storeId || !password">
            {{ busy ? t('sslcommerz.checking') : t('connect.connect') }}
          </button>
          <button type="button" class="btn btn-quiet" :disabled="busy" @click="cancel">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhCheckCircle, PhCreditCard, PhFlask } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { connectSslcommerz, disconnectSslcommerz, fetchSslcommerz } from '../../api/payments.js';
import { useAgentStore } from '../../stores/agent.js';

// The business's own SSLCommerz store. Emits `change` with whether one is connected,
// so the page can say when paying first can be turned on.
const emit = defineEmits(['change']);
const { t } = useI18n();
const agent = useAgentStore();

const account = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
const changing = ref(false);
const storeId = ref('');
const password = ref('');
const sandbox = ref(true);
const busy = ref(false);
const error = ref(null);
const confirmingDisconnect = ref(false);

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    account.value = await fetchSslcommerz();
    emit('change', !!account.value);
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

function startChange() {
  changing.value = true;
  open.value = true;
  storeId.value = account.value.store_id;
  password.value = '';
  sandbox.value = account.value.sandbox;
  error.value = null;
}

function cancel() {
  open.value = false;
  changing.value = false;
  error.value = null;
  password.value = '';
}

async function connect() {
  if (!storeId.value || !password.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    account.value = await connectSslcommerz({
      storeId: storeId.value,
      password: password.value,
      sandbox: sandbox.value,
    });
    cancel();
    emit('change', true);
    // The setup list says "Connect your SSLCommerz account" until now.
    agent.load({ force: true }).catch(() => {});
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

async function disconnect() {
  busy.value = true;
  error.value = null;
  try {
    await disconnectSslcommerz();
    account.value = null;
    confirmingDisconnect.value = false;
    emit('change', false);
    agent.load({ force: true }).catch(() => {});
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

load();
</script>
