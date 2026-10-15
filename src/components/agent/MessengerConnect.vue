<template>
  <!-- The Messenger row's fields; the row's name and tip come from the page. -->
  <div class="min-w-0">
    <div v-if="loading" class="skeleton h-4 w-64" aria-hidden="true"></div>

    <p v-else-if="loadError" class="text-sm" role="alert">
      <span class="text-danger">{{ loadError }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
    </p>

    <!-- Connected: share the link -->
    <div v-else-if="page" class="flex flex-col gap-3">
      <p class="flex flex-wrap items-center gap-2 text-sm">
        <span class="chip bg-success-tint text-success">
          <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
          {{ t('connect.connected') }}
        </span>
        <InfoTip :text="t('messenger.connectedText')"></InfoTip>
      </p>
      <CopyField :label="t('messenger.link')" :value="page.link" @copied="$emit('copied')"></CopyField>
      <div class="flex flex-wrap items-center gap-3">
        <a :href="page.link" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          <PhArrowSquareOut :size="16"></PhArrowSquareOut>
          {{ t('messenger.open') }}
        </a>
        <button v-if="!confirmingDisconnect" type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
          {{ t('connect.disconnect') }}
        </button>
        <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
          <span>{{ t('messenger.disconnectWarning') }}</span>
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
      <button type="button" class="btn btn-secondary mt-3" @click="open = true">{{ t('messenger.setUp') }}</button>
    </div>

    <!-- Not connected: the Page id and its token -->
    <form v-else class="flex flex-col gap-3" @submit.prevent="connect">
      <label class="text-sm font-semibold" for="page-id">{{ t('messenger.pageId') }}</label>
      <p class="-mt-2 text-sm text-ink-soft">{{ t('messenger.pageIdText') }}</p>
      <input
        id="page-id"
        v-model="pageId"
        class="field"
        inputmode="numeric"
        placeholder="1234567890"
        lang="en"
        :disabled="busy"
      />
      <label class="text-sm font-semibold" for="page-token">{{ t('messenger.token') }}</label>
      <p class="-mt-2 text-sm text-ink-soft">{{ t('messenger.tokenText') }}</p>
      <textarea
        id="page-token"
        v-model="token"
        class="field !h-auto py-2.5"
        rows="3"
        placeholder="EAAB..."
        lang="en"
        :disabled="busy"
      ></textarea>
      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn btn-primary" :disabled="busy || !/^\d+$/.test(pageId.trim()) || token.trim().length < 20">
          {{ busy ? t('messenger.connecting') : t('messenger.connect') }}
        </button>
        <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="close">{{ t('common.notNow') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhCheckCircle } from '@phosphor-icons/vue';

import CopyField from '../ui/CopyField.vue';
import InfoTip from '../ui/InfoTip.vue';
import { connectMessenger, disconnectMessenger, fetchMessenger } from '../../api/messenger.js';

defineEmits(['copied']);
const { t } = useI18n();

const page = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
const pageId = ref('');
const token = ref('');
const busy = ref(false);
const error = ref(null);
const confirmingDisconnect = ref(false);

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    page.value = await fetchMessenger();
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

function close() {
  open.value = false;
  pageId.value = '';
  token.value = '';
  error.value = null;
}

async function connect() {
  busy.value = true;
  error.value = null;
  try {
    page.value = await connectMessenger(pageId.value.trim(), token.value.trim());
    close();
  } catch (err) {
    error.value = err.fields?.token || err.fields?.page_id || err.message;
  }
  busy.value = false;
}

async function disconnect() {
  busy.value = true;
  error.value = null;
  try {
    await disconnectMessenger();
    page.value = null;
    confirmingDisconnect.value = false;
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

load();
</script>
