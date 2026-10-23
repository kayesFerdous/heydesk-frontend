<template>
  <div class="panel flex items-start gap-4 p-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <PhDeviceMobile :size="20"></PhDeviceMobile>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">bKash</h3>
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
        <i18n-t keypath="bkash.connectedText" tag="p" class="mt-1 text-sm text-ink-soft" scope="global">
          <template #username><span class="font-semibold text-ink">{{ account.username }}</span></template>
        </i18n-t>
        <p v-if="account.sandbox" class="notice mt-3 text-sm" role="status">
          <PhFlask :size="18" class="mt-px shrink-0 text-attention"></PhFlask>
          <span>
            <span class="font-semibold text-ink">{{ t('sslcommerz.testModeTitle') }}</span>
            {{ t('bkash.testModeText') }}
          </span>
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-secondary" @click="startChange">{{ t('bkash.change') }}</button>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              {{ t('connect.disconnect') }}
            </button>
          </template>
          <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span>{{ t('bkash.disconnectWarning') }}</span>
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

      <!-- Not connected, closed. -->
      <div v-else-if="!open">
        <p class="mt-0.5 text-sm text-ink-soft">{{ t('common.notConnected') }}</p>
        <button type="button" class="btn btn-secondary mt-3" @click="open = true">{{ t('bkash.connect') }}</button>
      </div>

      <!-- Connecting: two steps, as for SSLCommerz -->
      <form v-else class="mt-3 flex flex-col gap-6" novalidate @submit.prevent="connect">
        <div>
          <p class="text-sm font-semibold">{{ t('bkash.step1') }}</p>
          <p class="mt-0.5 text-sm text-ink-soft">{{ t('bkash.step1Text') }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <a href="https://developer.bka.sh/" target="_blank" rel="noopener" class="btn btn-secondary">
              <PhArrowSquareOut :size="18"></PhArrowSquareOut>
              {{ t('bkash.testAccount') }}
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-sm font-semibold">{{ t('sslcommerz.step2') }}</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="bkash-app-key">{{ t('bkash.appKey') }}</label>
              <input id="bkash-app-key" v-model.trim="appKey" class="field" type="text" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label class="label" for="bkash-app-secret">{{ t('bkash.appSecret') }}</label>
              <input id="bkash-app-secret" v-model.trim="appSecret" class="field" type="password" autocomplete="new-password" />
            </div>
            <div>
              <label class="label" for="bkash-username">{{ t('bkash.username') }}</label>
              <input id="bkash-username" v-model.trim="username" class="field" type="text" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label class="label" for="bkash-password">{{ t('bkash.password') }}</label>
              <input id="bkash-password" v-model.trim="password" class="field" type="password" autocomplete="new-password" />
            </div>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <label class="text-sm font-semibold" for="bkash-sandbox">{{ t('sslcommerz.testMode') }}</label>
              <p class="hint">{{ t('bkash.testModeHint') }}</p>
            </div>
            <ToggleSwitch id="bkash-sandbox" v-model="sandbox" :label="t('sslcommerz.testMode')"></ToggleSwitch>
          </div>
        </div>

        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" :disabled="busy || !filled">
            {{ busy ? t('bkash.checking') : t('connect.connect') }}
          </button>
          <button type="button" class="btn btn-quiet" :disabled="busy" @click="cancel">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhCheckCircle, PhDeviceMobile, PhFlask } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { connectBkash, disconnectBkash, fetchBkash } from '../../api/payments.js';
import { useAgentStore } from '../../stores/agent.js';

// The business's own bKash merchant account (backend D109), the same shape as
// SslcommerzConnect. Emits `change` with whether one is connected.
const emit = defineEmits(['change']);
const { t } = useI18n();
const agent = useAgentStore();

const account = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
const changing = ref(false);
const appKey = ref('');
const appSecret = ref('');
const username = ref('');
const password = ref('');
const sandbox = ref(true);
const busy = ref(false);
const error = ref(null);
const confirmingDisconnect = ref(false);

const filled = computed(() => Boolean(appKey.value && appSecret.value && username.value && password.value));

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    account.value = await fetchBkash();
    emit('change', !!account.value);
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

// The keys never come back, so a change asks for all of them again.
function startChange() {
  changing.value = true;
  open.value = true;
  username.value = account.value.username;
  sandbox.value = account.value.sandbox;
  error.value = null;
}

function cancel() {
  open.value = false;
  changing.value = false;
  error.value = null;
  appKey.value = '';
  appSecret.value = '';
  password.value = '';
}

async function connect() {
  if (!filled.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    account.value = await connectBkash({
      appKey: appKey.value,
      appSecret: appSecret.value,
      username: username.value,
      password: password.value,
      sandbox: sandbox.value,
    });
    cancel();
    emit('change', true);
    // The setup list asks for a payment account until one is connected.
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
    await disconnectBkash();
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
