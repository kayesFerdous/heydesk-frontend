<template>
  <div>
    <!-- Its own Connect button, saved apart from the form below. -->
    <sslcommerz-connect @change="connected = $event"></sslcommerz-connect>

    <form v-if="form" class="mt-10 border-t border-hairline pt-8" novalidate @submit.prevent="save">
      <form-problems :message="saveError" :problems="problems"></form-problems>

      <!-- A restaurant: pickup only, or delivery too, at one charge to any address. -->
      <div v-if="kind === 'restaurant'" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">Delivery</h2>
          <p class="mt-1 text-sm text-ink-soft">Off: your agent takes pickup orders only.</p>
        </div>
        <div class="flex items-center justify-between gap-4">
          <label class="text-sm font-semibold" for="delivers">We deliver</label>
          <toggle-switch id="delivers" v-model="form.delivers" label="We deliver"></toggle-switch>
        </div>
        <div v-if="form.delivers">
          <label class="label" for="delivery-charge">Delivery charge (৳)</label>
          <input
            id="delivery-charge"
            v-model="form.charge"
            class="field max-w-40"
            :class="{ 'field-invalid': !validAmount(form.charge) }"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
          />
          <p class="hint">The same to any address. 0 for free delivery.</p>
        </div>
      </div>

      <!-- A shop: its delivery areas, each with a charge. -->
      <div v-if="kind === 'shop'" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">Delivery areas</h2>
          <p class="mt-1 text-sm text-ink-soft">Your agent asks the buyer which area, then tells them the charge and the total.</p>
        </div>
        <!-- One area per block: the name on its own line, so it never gets squeezed. -->
        <div
          v-for="(zone, index) in form.zones"
          :key="index"
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 rounded-[var(--radius-control)] border border-hairline p-3"
        >
          <div class="col-span-2">
            <label class="label" :for="`zone-${index}`">Area</label>
            <input :id="`zone-${index}`" v-model.trim="zone.name" class="field" :class="{ 'field-invalid': !zone.name }" type="text" placeholder="Inside Dhaka" />
          </div>
          <button type="button" class="btn btn-quiet !px-2.5" :aria-label="`Remove ${zone.name || 'this area'}`" @click="form.zones.splice(index, 1)">
            <ph-trash :size="18"></ph-trash>
          </button>
          <div>
            <label class="label" :for="`zone-charge-${index}`">Charge (৳)</label>
            <input
              :id="`zone-charge-${index}`"
              v-model="zone.charge"
              class="field"
              :class="{ 'field-invalid': !validAmount(zone.charge) }"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
            />
          </div>
          <div class="col-span-2">
            <label class="label" :for="`zone-days-${index}`">Usually takes</label>
            <input :id="`zone-days-${index}`" v-model.trim="zone.days" class="field" type="text" placeholder="1–2 days" />
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary" @click="form.zones.push({ name: '', charge: '', days: '' })">
            <ph-plus :size="16" weight="bold"></ph-plus>
            Add an area
          </button>
        </div>
        <div>
          <label class="label" for="free-over">Free delivery on orders of (৳)</label>
          <input
            id="free-over"
            v-model="form.freeOver"
            class="field max-w-40"
            :class="{ 'field-invalid': !validAmount(form.freeOver) }"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
          />
          <p class="hint">0: delivery is never free.</p>
        </div>
      </div>

      <div :class="{ 'mt-10 border-t border-hairline pt-8': kind !== 'clinic' }" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">{{ words.title }}</h2>
          <p class="mt-1 text-sm text-ink-soft">{{ words.explain }}</p>
        </div>

        <div v-if="kind === 'clinic'">
          <label class="label" for="deposit">Deposit (৳)</label>
          <input
            id="deposit"
            v-model="form.deposit"
            class="field max-w-40"
            :class="{ 'field-invalid': !validAmount(form.deposit) }"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
          />
          <p class="hint">Taken with each appointment request.</p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div>
            <label class="text-sm font-semibold" for="pay-first">{{ words.toggle }}</label>
            <p v-if="blocker" class="hint">{{ blocker }}</p>
          </div>
          <toggle-switch
            id="pay-first"
            :model-value="form.pay_first && !blocker"
            :label="words.toggle"
            :disabled="!!blocker"
            @update:model-value="form.pay_first = $event"
          ></toggle-switch>
        </div>

        <p class="flex items-start gap-2 text-sm text-ink-soft">
          <ph-credit-card :size="18" class="mt-px shrink-0 text-ink-faint"></ph-credit-card>
          <span>
            Your agent sends the customer a link to pay into your SSLCommerz account.
            {{ words.after }} Your agent can't mark anything paid: only the payment can.
          </span>
        </p>
      </div>

      <save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></save-bar>
      <div class="h-8"></div>
    </form>
  </div>
</template>

<script>
import { PhCreditCard, PhPlus, PhTrash } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import SslcommerzConnect from '../../components/agent/SslcommerzConnect.vue';
import agentSection from '../../mixins/agentSection.js';

// What each kind of business takes first, in the owner's words.
const WORDS = {
  restaurant: {
    title: 'Paying first',
    explain: 'Many customers pay the delivery charge first, so you only cook for real orders.',
    toggle: 'Take the delivery charge online first',
    needs: 'Turn on delivery and set a charge first.',
    after: 'A delivery order reaches you only after it is paid; the rest is paid on delivery. Pickup orders pay nothing first.',
  },
  clinic: {
    title: 'Deposit',
    explain: 'A small deposit with each request cuts the appointments nobody comes to.',
    toggle: 'Take a deposit online first',
    needs: 'Set the deposit amount first.',
    after: 'A request reaches you only after its deposit is paid.',
  },
  shop: {
    title: 'Paying first',
    explain: 'Buyers pay the delivery charge first, so you only pack real orders.',
    toggle: 'Take the delivery charge online first',
    needs: 'Add a delivery area first.',
    after: 'An order reaches you only after it is paid; the rest is cash on delivery.',
  },
};

// Taka in the form, paisa in the API.
const toTaka = (paisa) => String((paisa || 0) / 100);
const toPaisa = (taka) => Math.round(Number(taka || 0) * 100);

export default {
  components: { FormProblems, SaveBar, ToggleSwitch, SslcommerzConnect, PhCreditCard, PhPlus, PhTrash },
  mixins: [agentSection],
  data() {
    return { connected: false };
  },
  computed: {
    kind() {
      return this.config && this.config.preset;
    },
    words() {
      return WORDS[this.kind] || WORDS.shop;
    },
    // What's missing for there to be anything to take first, or ''.
    nothingToTake() {
      const f = this.form;
      if (this.kind === 'restaurant' && !(f.delivers && toPaisa(f.charge) > 0)) return this.words.needs;
      if (this.kind === 'clinic' && !(toPaisa(f.deposit) > 0)) return this.words.needs;
      if (this.kind === 'shop' && !f.zones.length) return this.words.needs;
      return '';
    },
    // Why paying first can't be turned on yet, or '' when it can.
    blocker() {
      return this.connected ? this.nothingToTake : 'Connect SSLCommerz above first.';
    },
  },
  methods: {
    validAmount(taka) {
      return taka === '' || Number(taka) >= 0;
    },
    formFrom(config) {
      const k = config.knowledge;
      return {
        delivers: !!k.delivers,
        charge: toTaka(k.delivery_charge),
        deposit: toTaka(k.deposit),
        zones: (k.delivery || []).map((z) => ({ name: z.name, charge: toTaka(z.charge), days: z.days || '' })),
        freeOver: toTaka(k.free_delivery_over),
        pay_first: !!k.pay_first,
      };
    },
    // Only this desk's own fields. Paying first stays as the owner left it while the
    // SSLCommerz account is missing: the agent asks for nothing until one is connected.
    patchFrom(form) {
      const patch = { pay_first: form.pay_first && !this.nothingToTake };
      if (this.kind === 'restaurant') {
        patch.delivers = form.delivers;
        patch.delivery_charge = toPaisa(form.charge);
      }
      if (this.kind === 'clinic') patch.deposit = toPaisa(form.deposit);
      if (this.kind === 'shop') {
        patch.delivery = form.zones.map((z) => ({ name: z.name, charge: toPaisa(z.charge), days: z.days }));
        patch.free_delivery_over = toPaisa(form.freeOver);
      }
      return patch;
    },
  },
};
</script>
