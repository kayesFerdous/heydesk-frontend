<template>
  <div class="panel flex items-start gap-4 p-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <PhTruck :size="20"></PhTruck>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t('courier.title') }}</h3>
        <span v-if="link && !link.problem" class="chip bg-success-tint text-success">
          <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
          {{ t('connect.connected') }}
        </span>
        <span v-else-if="link" class="chip bg-danger-tint text-danger">
          <PhWarningCircle :size="14" weight="bold"></PhWarningCircle>
          {{ t('courier.stuck') }}
        </span>
      </div>

      <div v-if="loading" class="skeleton mt-2 h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="mt-1 text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
      </p>

      <!-- Linked -->
      <div v-else-if="link && !changing">
        <p class="mt-1 text-sm text-ink-soft">{{ t('courier.linkedText', { name: NAMES[link.kind] }) }}</p>
        <p v-if="link.problem" class="mt-2 text-sm text-danger" role="alert">{{ link.problem }}</p>
        <p v-if="link.sandbox" class="notice mt-3 text-sm" role="status">
          <PhFlask :size="18" class="mt-px shrink-0 text-attention"></PhFlask>
          <span>
            <span class="font-semibold text-ink">{{ t('sslcommerz.testModeTitle') }}</span>
            {{ t('courier.testModeText') }}
          </span>
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-secondary" :disabled="busy" @click="sync">
            {{ busy ? t('courier.syncing') : t('courier.sync') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="startChange">{{ t('courier.change') }}</button>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              {{ t('connect.disconnect') }}
            </button>
          </template>
          <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span>{{ t('courier.disconnectWarning') }}</span>
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

      <!-- Not linked, closed. -->
      <div v-else-if="!open">
        <p class="mt-0.5 text-sm text-ink-soft">{{ t('courier.notLinked') }}</p>
        <button type="button" class="btn btn-secondary mt-3" @click="open = true">{{ t('courier.connect') }}</button>
      </div>

      <!-- Linking: pick the courier, then its keys. -->
      <form v-else class="mt-3 flex flex-col gap-4" novalidate @submit.prevent="connect">
        <div class="segmented self-start" role="radiogroup" :aria-label="t('courier.which')">
          <button
            v-for="(name, value) in NAMES"
            :key="value"
            type="button"
            role="radio"
            class="segment"
            :class="{ 'segment-active': kind === value }"
            :aria-checked="kind === value"
            @click="kind = value; error = null"
          >
            {{ name }}
          </button>
        </div>
        <p class="text-sm text-ink-soft">{{ t(`courier.${kind}Help`) }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="courier-key">{{ t(`courier.${kind}Key`) }}</label>
            <input id="courier-key" v-model.trim="key" class="field" type="text" autocomplete="off" spellcheck="false" />
          </div>
          <div>
            <label class="label" for="courier-secret">{{ t(`courier.${kind}Secret`) }}</label>
            <input id="courier-secret" v-model.trim="secret" class="field" type="password" autocomplete="new-password" />
          </div>
          <template v-if="kind === 'pathao'">
            <div>
              <label class="label" for="courier-username">{{ t('courier.username') }}</label>
              <input id="courier-username" v-model.trim="username" class="field" type="email" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label class="label" for="courier-password">{{ t('courier.password') }}</label>
              <input id="courier-password" v-model="password" class="field" type="password" autocomplete="new-password" />
            </div>
          </template>
        </div>
        <div v-if="kind === 'pathao'" class="flex items-center justify-between gap-4">
          <div>
            <label class="text-sm font-semibold" for="courier-sandbox">{{ t('sslcommerz.testMode') }}</label>
            <p class="hint">{{ t('courier.testModeHint') }}</p>
          </div>
          <ToggleSwitch id="courier-sandbox" v-model="sandbox" :label="t('sslcommerz.testMode')"></ToggleSwitch>
        </div>

        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" :disabled="busy || !filled">
            {{ busy ? t('courier.checking', { name: NAMES[kind] }) : t('connect.connect') }}
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
import { PhCheckCircle, PhFlask, PhTruck, PhWarningCircle } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { connectCourier, disconnectCourier, fetchCourier, syncCourier } from '../../api/courier.js';

// A shop's courier (backend D90, D113), the same shape as BkashConnect. Once
// linked, every confirmed order is booked there and its parcel followed.
const NAMES = { steadfast: 'Steadfast', pathao: 'Pathao' };
const { t } = useI18n();

const link = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
const changing = ref(false);
const kind = ref('steadfast');
const key = ref('');
const secret = ref('');
const username = ref('');
const password = ref('');
const sandbox = ref(false);
const busy = ref(false);
const error = ref(null);
const confirmingDisconnect = ref(false);

const filled = computed(() => Boolean(key.value && secret.value && (kind.value !== 'pathao' || (username.value && password.value))));

// A refused key comes back as a 422 whose `fields.key` is the courier's own words.
function problem(err) {
  return (err.fields && err.fields.key) || err.message;
}

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    link.value = await fetchCourier();
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

// The keys never come back, so a change asks for all of them again.
function startChange() {
  changing.value = true;
  open.value = true;
  kind.value = link.value.kind;
  sandbox.value = link.value.sandbox;
  error.value = null;
}

function cancel() {
  open.value = false;
  changing.value = false;
  error.value = null;
  key.value = '';
  secret.value = '';
  password.value = '';
}

async function connect() {
  if (!filled.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    link.value = await connectCourier({
      kind: kind.value,
      key: key.value,
      secret: secret.value,
      username: kind.value === 'pathao' ? username.value : '',
      password: kind.value === 'pathao' ? password.value : '',
      sandbox: kind.value === 'pathao' && sandbox.value,
    });
    cancel();
  } catch (err) {
    error.value = problem(err);
  }
  busy.value = false;
}

async function sync() {
  busy.value = true;
  error.value = null;
  try {
    link.value = await syncCourier();
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

async function disconnect() {
  busy.value = true;
  error.value = null;
  try {
    await disconnectCourier();
    link.value = null;
    confirmingDisconnect.value = false;
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

load();
</script>
