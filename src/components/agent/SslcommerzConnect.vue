<template>
  <div class="flex items-start gap-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <ph-credit-card :size="20"></ph-credit-card>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="section-title">SSLCommerz</h2>
        <span v-if="account" class="chip bg-success-tint text-success">
          <ph-check-circle :size="14" weight="bold"></ph-check-circle>
          Connected
        </span>
      </div>

      <div v-if="loading" class="skeleton mt-2 h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="mt-1 text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
      </p>

      <!-- Connected -->
      <div v-else-if="account && !changing">
        <p class="mt-1 text-sm text-ink-soft">
          Customers' payments go straight to your store
          <span class="font-semibold text-ink">{{ account.store_id }}</span>.
        </p>
        <p v-if="account.sandbox" class="notice mt-3 text-sm" role="status">
          <ph-flask :size="18" class="mt-px shrink-0 text-attention"></ph-flask>
          <span>
            <span class="font-semibold text-ink">Test mode.</span>
            Payments use SSLCommerz's test cards and no real money moves. Connect your live store when SSLCommerz
            approves it.
          </span>
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-secondary" @click="startChange">Change store</button>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              Disconnect
            </button>
          </template>
          <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span>Your agent will stop asking for payments.</span>
            <button type="button" class="font-semibold text-danger hover:underline" :disabled="busy" @click="disconnect">
              {{ busy ? 'Disconnecting...' : 'Disconnect' }}
            </button>
            <button type="button" class="font-semibold text-ink-soft hover:underline" @click="confirmingDisconnect = false">
              Keep it
            </button>
          </span>
        </div>
        <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
      </div>

      <!-- Not connected, closed -->
      <div v-else-if="!open">
        <p class="mt-1 text-sm text-ink-soft">
          Connect your own SSLCommerz account so customers can pay you online, by card, bKash, Nagad or their bank.
          The money goes straight to you.
        </p>
        <button type="button" class="btn btn-secondary mt-4" @click="open = true">Connect SSLCommerz</button>
      </div>

      <!-- Connecting: two steps -->
      <form v-else class="mt-3 flex flex-col gap-6" novalidate @submit.prevent="connect">
        <div>
          <p class="text-sm font-semibold">1. Get your store's details</p>
          <p class="mt-0.5 text-sm text-ink-soft">
            SSLCommerz emails a <span class="font-semibold text-ink">Store ID</span> and a
            <span class="font-semibold text-ink">Store Password</span> when it opens your store. The store password
            is not the one you sign in with. No account yet? A free test account takes a minute.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <a href="https://developer.sslcommerz.com/registration/" target="_blank" rel="noopener" class="btn btn-secondary">
              <ph-arrow-square-out :size="18"></ph-arrow-square-out>
              Get a test account
            </a>
            <a href="https://sslcommerz.com/" target="_blank" rel="noopener" class="btn btn-quiet">
              Apply for a live account
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-sm font-semibold">2. Paste them here</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="ssl-store-id">Store ID</label>
              <input id="ssl-store-id" v-model.trim="storeId" class="field" type="text" autocomplete="off" spellcheck="false" placeholder="yourshop0live" />
            </div>
            <div>
              <label class="label" for="ssl-password">Store Password</label>
              <input id="ssl-password" v-model.trim="password" class="field" type="password" autocomplete="new-password" placeholder="yourshop0live@ssl" />
            </div>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div>
              <label class="text-sm font-semibold" for="ssl-sandbox">Test mode</label>
              <p class="hint">On for a test account from developer.sslcommerz.com. Off for your live store.</p>
            </div>
            <toggle-switch id="ssl-sandbox" v-model="sandbox" label="Test mode"></toggle-switch>
          </div>
        </div>

        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" :disabled="busy || !storeId || !password">
            {{ busy ? 'Checking with SSLCommerz...' : 'Connect' }}
          </button>
          <button type="button" class="btn btn-quiet" :disabled="busy" @click="cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { PhArrowSquareOut, PhCheckCircle, PhCreditCard, PhFlask } from '@phosphor-icons/vue';

import ToggleSwitch from '../ui/ToggleSwitch.vue';
import { connectSslcommerz, disconnectSslcommerz, fetchSslcommerz } from '../../api/payments.js';

// The business's own SSLCommerz store. Emits `change` with whether one is connected,
// so the page can say when paying first can be turned on.
export default {
  components: { ToggleSwitch, PhArrowSquareOut, PhCheckCircle, PhCreditCard, PhFlask },
  emits: ['change'],
  data() {
    return {
      account: null,
      loading: true,
      loadError: null,
      open: false,
      changing: false,
      storeId: '',
      password: '',
      sandbox: true,
      busy: false,
      error: null,
      confirmingDisconnect: false,
    };
  },
  created() {
    this.load();
  },
  methods: {
    token() {
      return this.$store.getters['auth/token'];
    },
    async load() {
      this.loading = true;
      this.loadError = null;
      try {
        this.account = await fetchSslcommerz(this.token());
        this.$emit('change', !!this.account);
      } catch (error) {
        this.loadError = error.message;
      }
      this.loading = false;
    },
    startChange() {
      this.changing = true;
      this.open = true;
      this.storeId = this.account.store_id;
      this.password = '';
      this.sandbox = this.account.sandbox;
      this.error = null;
    },
    cancel() {
      this.open = false;
      this.changing = false;
      this.error = null;
      this.password = '';
    },
    async connect() {
      if (!this.storeId || !this.password || this.busy) return;
      this.busy = true;
      this.error = null;
      try {
        this.account = await connectSslcommerz(this.token(), {
          storeId: this.storeId,
          password: this.password,
          sandbox: this.sandbox,
        });
        this.cancel();
        this.$emit('change', true);
        // The setup list says "Connect your SSLCommerz account" until now.
        this.$store.dispatch('agent/load', { force: true }).catch(() => {});
      } catch (error) {
        this.error = error.message;
      }
      this.busy = false;
    },
    async disconnect() {
      this.busy = true;
      this.error = null;
      try {
        await disconnectSslcommerz(this.token());
        this.account = null;
        this.confirmingDisconnect = false;
        this.$emit('change', false);
        this.$store.dispatch('agent/load', { force: true }).catch(() => {});
      } catch (error) {
        this.error = error.message;
      }
      this.busy = false;
    },
  },
};
</script>
