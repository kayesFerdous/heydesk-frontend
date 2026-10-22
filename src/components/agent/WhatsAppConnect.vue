<template>
  <!-- The WhatsApp row's fields; the row's name and tip come from the page. -->
  <div class="min-w-0">
    <div v-if="loading" class="skeleton h-4 w-64" aria-hidden="true"></div>

    <p v-else-if="loadError" class="text-sm" role="alert">
      <span class="text-danger">{{ loadError }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
    </p>

    <!-- Connected. No link to share: the owner already knows their number (D103). -->
    <div v-else-if="number" class="flex flex-col gap-3">
      <p class="flex flex-wrap items-center gap-2 text-sm">
        <span class="chip bg-success-tint text-success">
          <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
          {{ t('connect.connected') }}
        </span>
        <span class="text-ink-soft">{{ t('whatsapp.numberId', { id: number.phone_id }) }}</span>
        <InfoTip :text="t('whatsapp.connectedText')"></InfoTip>
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <button v-if="!confirmingDisconnect" type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
          {{ t('connect.disconnect') }}
        </button>
        <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
          <span>{{ t('whatsapp.disconnectWarning') }}</span>
          <button type="button" class="font-semibold text-danger hover:underline" :disabled="busy" @click="disconnect">
            {{ busy ? t('connect.disconnecting') : t('connect.disconnect') }}
          </button>
          <button type="button" class="font-semibold text-ink-soft hover:underline" @click="confirmingDisconnect = false">
            {{ t('common.keepIt') }}
          </button>
        </span>
      </div>
      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
    </div>

    <!-- Not connected, steps closed. What it is sits in the row's tip. -->
    <div v-else-if="!open">
      <p class="text-sm text-ink-soft">{{ t('common.notConnected') }}</p>
      <button type="button" class="btn btn-secondary mt-3" @click="open = true">{{ t('whatsapp.setUp') }}</button>
    </div>

    <!-- Not connected: the two ids side by side, then the token. -->
    <form v-else class="flex flex-col gap-3" @submit.prevent="connect">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel html-for="wa-account" :tip="t('whatsapp.accountIdText')">{{ t('whatsapp.accountId') }}</FieldLabel>
          <input id="wa-account" v-model="accountId" class="field" inputmode="numeric" placeholder="1234567890" lang="en" :disabled="busy" />
        </div>
        <div>
          <FieldLabel html-for="wa-phone" :tip="t('whatsapp.phoneIdText')">{{ t('whatsapp.phoneId') }}</FieldLabel>
          <input id="wa-phone" v-model="phoneId" class="field" inputmode="numeric" placeholder="1234567890" lang="en" :disabled="busy" />
        </div>
      </div>
      <div>
        <FieldLabel html-for="wa-token" :tip="t('whatsapp.tokenText')">{{ t('whatsapp.token') }}</FieldLabel>
        <textarea id="wa-token" v-model="token" class="field !h-auto py-2.5" rows="3" placeholder="EAAB..." lang="en" :disabled="busy"></textarea>
      </div>
      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn btn-primary" :disabled="busy || !ready">
          {{ busy ? t('whatsapp.connecting') : t('whatsapp.connect') }}
        </button>
        <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="close">{{ t('common.notNow') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle } from '@phosphor-icons/vue';

import FieldLabel from '../ui/FieldLabel.vue';
import InfoTip from '../ui/InfoTip.vue';
import { connectWhatsApp, disconnectWhatsApp, fetchWhatsApp } from '../../api/whatsapp.js';

const { t } = useI18n();

const number = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
const accountId = ref('');
const phoneId = ref('');
const token = ref('');
const busy = ref(false);
const error = ref(null);
const confirmingDisconnect = ref(false);

// The same checks the server makes: two ids of digits and a token of 20 or more.
const digits = (value) => /^\d{1,25}$/.test(value.trim());
const ready = computed(() => digits(accountId.value) && digits(phoneId.value) && token.value.trim().length >= 20);

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    number.value = await fetchWhatsApp();
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

function close() {
  open.value = false;
  accountId.value = '';
  phoneId.value = '';
  token.value = '';
  error.value = null;
}

async function connect() {
  busy.value = true;
  error.value = null;
  try {
    number.value = await connectWhatsApp(accountId.value.trim(), phoneId.value.trim(), token.value.trim());
    close();
  } catch (err) {
    error.value = err.fields?.token || err.fields?.phone_id || err.fields?.account_id || err.message;
  }
  busy.value = false;
}

async function disconnect() {
  busy.value = true;
  error.value = null;
  try {
    await disconnectWhatsApp();
    number.value = null;
    confirmingDisconnect.value = false;
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

load();
</script>
