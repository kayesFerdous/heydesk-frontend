<template>
  <form v-if="form" novalidate @submit.prevent="save">
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

    <div :class="{ 'mt-10 border-t border-hairline pt-8': kind === 'restaurant' }" class="flex flex-col gap-5">
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
          <p v-if="!canPayFirst" class="hint">{{ words.needs }}</p>
        </div>
        <toggle-switch
          id="pay-first"
          :model-value="form.pay_first && canPayFirst"
          :label="words.toggle"
          :disabled="!canPayFirst"
          @update:model-value="form.pay_first = $event"
        ></toggle-switch>
      </div>

      <p class="flex items-start gap-2 text-sm text-ink-soft">
        <ph-credit-card :size="18" class="mt-px shrink-0 text-ink-faint"></ph-credit-card>
        <span>
          Customers pay through SSLCommerz, with a link your agent sends in the chat.
          {{ words.after }} Your agent can't mark anything paid: only the payment can.
        </span>
      </p>
    </div>

    <save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></save-bar>
    <div class="h-8"></div>
  </form>
</template>

<script>
import { PhCreditCard } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
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
    explain: 'Buyers pay the delivery charge first, against fake orders.',
    toggle: 'Take the delivery charge online first',
    needs: '',
    after: 'An order reaches you only after it is paid; the rest is cash on delivery.',
  },
};

// Taka in the form, paisa in the API.
const toTaka = (paisa) => String((paisa || 0) / 100);
const toPaisa = (taka) => Math.round(Number(taka || 0) * 100);

export default {
  components: { FormProblems, SaveBar, ToggleSwitch, PhCreditCard },
  mixins: [agentSection],
  computed: {
    kind() {
      return this.config && this.config.preset;
    },
    words() {
      return WORDS[this.kind] || WORDS.shop;
    },
    canPayFirst() {
      if (this.kind === 'restaurant') return this.form.delivers && toPaisa(this.form.charge) > 0;
      if (this.kind === 'clinic') return toPaisa(this.form.deposit) > 0;
      return true;
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
        pay_first: !!k.pay_first,
      };
    },
    // Only this desk's own fields; paying first stays off when there is nothing to take.
    patchFrom(form) {
      const patch = { pay_first: form.pay_first && this.canPayFirst };
      if (this.kind === 'restaurant') {
        patch.delivers = form.delivers;
        patch.delivery_charge = toPaisa(form.charge);
      }
      if (this.kind === 'clinic') patch.deposit = toPaisa(form.deposit);
      return patch;
    },
  },
};
</script>
