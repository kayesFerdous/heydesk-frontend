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

    <!-- Logged in with Facebook, several Pages: pick one -->
    <div v-else-if="pages.length" class="flex flex-col gap-3">
      <p class="text-sm">{{ t('messenger.choosePage') }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in pages"
          :key="p.id"
          type="button"
          class="btn btn-secondary"
          :disabled="busy"
          @click="connectPage(p.id)"
        >
          <PhFacebookLogo :size="16"></PhFacebookLogo>
          {{ p.name }}
        </button>
      </div>
      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
      <button type="button" class="self-start text-sm font-semibold text-ink-soft hover:underline" @click="close">{{ t('common.notNow') }}</button>
    </div>

    <!-- Not connected: Connect with Facebook. What it is sits in the row's tip. -->
    <div v-else-if="!open">
      <p class="text-sm text-ink-soft">{{ t('messenger.withFacebookText') }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" class="btn btn-primary" :disabled="busy" @click="withFacebook">
          <PhFacebookLogo :size="16" weight="fill"></PhFacebookLogo>
          {{ busy ? t('messenger.loggingIn') : t('messenger.withFacebook') }}
        </button>
        <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="open = true">{{ t('messenger.byHand') }}</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-danger" role="alert">{{ error }}</p>
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
import { PhArrowSquareOut, PhCheckCircle, PhFacebookLogo } from '@phosphor-icons/vue';

import CopyField from '../ui/CopyField.vue';
import InfoTip from '../ui/InfoTip.vue';
import {
  connectFacebookPage,
  connectMessenger,
  disconnectMessenger,
  fetchFacebookLogin,
  fetchFacebookPages,
  fetchMessenger,
} from '../../api/messenger.js';
import { facebookLogin } from '../../lib/facebook.js';

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
const userToken = ref(null); // Facebook's login, kept only until a Page is chosen
const pages = ref([]); // the login's Pages, when there are several to choose from

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
  userToken.value = null;
  pages.value = [];
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

// Facebook's window: log in, then one Page connects at once and several are a list.
async function withFacebook() {
  busy.value = true;
  error.value = null;
  try {
    const login = await fetchFacebookLogin();
    let token = null;
    try {
      token = await facebookLogin(login.app_id, login.config_id);
    } catch {
      error.value = t('messenger.sdkBlocked');
    }
    if (token) {
      const found = await fetchFacebookPages(token);
      if (found.length === 0) error.value = t('messenger.noPages');
      else if (found.length === 1) page.value = await connectFacebookPage(token, found[0].id);
      else {
        userToken.value = token;
        pages.value = found;
      }
    }
  } catch (err) {
    error.value = err.fields?.page_id || err.fields?.user_token || err.message;
  }
  busy.value = false;
}

async function connectPage(pageId) {
  busy.value = true;
  error.value = null;
  try {
    page.value = await connectFacebookPage(userToken.value, pageId);
    close();
  } catch (err) {
    error.value = err.fields?.page_id || err.fields?.token || err.message;
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
