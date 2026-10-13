<template>
  <div>
    <!-- Its own Connect button, saved apart from the form below. -->
    <SslcommerzConnect @change="connected = $event"></SslcommerzConnect>

    <form v-if="form" class="mt-10 border-t border-hairline pt-8" novalidate @submit.prevent="save">
      <FormProblems :message="saveError" :problems="problems"></FormProblems>

      <!-- A restaurant: pickup only, or delivery too, at one charge to any address. -->
      <div v-if="kind === 'restaurant'" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">{{ t('payments.delivery') }}</h2>
          <p class="mt-1 text-sm text-ink-soft">{{ t('payments.deliveryOff') }}</p>
        </div>
        <div class="flex items-center justify-between gap-4">
          <label class="text-sm font-semibold" for="delivers">{{ t('payments.weDeliver') }}</label>
          <ToggleSwitch id="delivers" v-model="form.delivers" :label="t('payments.weDeliver')"></ToggleSwitch>
        </div>
        <div v-if="form.delivers">
          <label class="label" for="delivery-charge">{{ t('payments.deliveryCharge') }} (৳)</label>
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
          <p class="hint">{{ t('payments.deliveryChargeHint') }}</p>
        </div>
      </div>

      <!-- A shop: its delivery areas, each with a charge. -->
      <div v-if="kind === 'shop'" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">{{ t('payments.areas') }}</h2>
          <p class="mt-1 text-sm text-ink-soft">{{ t('payments.areasText') }}</p>
        </div>
        <!-- One area per block: the name on its own line, so it never gets squeezed. -->
        <div
          v-for="(zone, index) in form.zones"
          :key="index"
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 rounded-[var(--radius-control)] border border-hairline p-3"
        >
          <div class="col-span-2">
            <label class="label" :for="`zone-${index}`">{{ t('payments.area') }}</label>
            <input :id="`zone-${index}`" v-model.trim="zone.name" class="field" :class="{ 'field-invalid': !zone.name }" type="text" :placeholder="t('payments.areaPlaceholder')" />
          </div>
          <button type="button" class="btn btn-quiet !px-2.5" :aria-label="t('payments.removeArea', { name: zone.name || t('payments.thisArea') })" @click="form.zones.splice(index, 1)">
            <PhTrash :size="18"></PhTrash>
          </button>
          <div>
            <label class="label" :for="`zone-charge-${index}`">{{ t('payments.charge') }} (৳)</label>
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
            <label class="label" :for="`zone-days-${index}`">{{ t('payments.usuallyTakes') }}</label>
            <input :id="`zone-days-${index}`" v-model.trim="zone.days" class="field" type="text" :placeholder="t('payments.daysPlaceholder')" />
          </div>
          <div class="col-span-3">
            <label class="label" :for="`zone-places-${index}`">{{ t('payments.places') }}</label>
            <input :id="`zone-places-${index}`" v-model="zone.places" class="field" type="text" :placeholder="t('payments.placesPlaceholder')" />
            <p class="hint">{{ t('payments.placesHint') }}</p>
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary" @click="form.zones.push({ name: '', charge: '', days: '', places: '' })">
            <PhPlus :size="16" weight="bold"></PhPlus>
            {{ t('payments.addArea') }}
          </button>
        </div>
        <div>
          <label class="label" for="free-over">{{ t('payments.freeOver') }} (৳)</label>
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
          <p class="hint">{{ t('payments.freeOverHint') }}</p>
        </div>
      </div>

      <div :class="{ 'mt-10 border-t border-hairline pt-8': kind !== 'clinic' }" class="flex flex-col gap-5">
        <div>
          <h2 class="section-title">{{ t(`${words}.title`) }}</h2>
          <p class="mt-1 text-sm text-ink-soft">{{ t(`${words}.explain`) }}</p>
        </div>

        <div v-if="kind === 'clinic'">
          <label class="label" for="deposit">{{ t('payments.deposit') }} (৳)</label>
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
          <p class="hint">{{ t('payments.depositHint') }}</p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div>
            <label class="text-sm font-semibold" for="pay-first">{{ t(`${words}.toggle`) }}</label>
            <p v-if="blocker" class="hint">{{ blocker }}</p>
          </div>
          <ToggleSwitch
            id="pay-first"
            :model-value="form.pay_first && !blocker"
            :label="t(`${words}.toggle`)"
            :disabled="!!blocker"
            @update:model-value="form.pay_first = $event"
          ></ToggleSwitch>
        </div>

        <p class="flex items-start gap-2 text-sm text-ink-soft">
          <PhCreditCard :size="18" class="mt-px shrink-0 text-ink-faint"></PhCreditCard>
          <span>
            {{ t('payments.linkIntro') }}
            {{ t(`${words}.after`) }} {{ t('payments.onlyPayment') }}
          </span>
        </p>
      </div>

      <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
      <div class="h-8"></div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCreditCard, PhPlus, PhTrash } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import SslcommerzConnect from '../../components/agent/SslcommerzConnect.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';

// Taka in the form, paisa in the API.
const toTaka = (paisa) => String((paisa || 0) / 100);
const toPaisa = (taka) => Math.round(Number(taka || 0) * 100);
// "Mirpur, Uttara" in the form, ["Mirpur", "Uttara"] in the API.
const toList = (text) => text.split(',').map((part) => part.trim()).filter(Boolean);

const { t } = useI18n();
const agent = useAgentStore();

const connected = ref(false);
const kind = computed(() => agent.kind);
// What each kind of business takes first, in the owner's words: `payments.<kind>.*`.
const words = computed(() => `payments.${['restaurant', 'clinic'].includes(kind.value) ? kind.value : 'shop'}`);

function validAmount(taka) {
  return taka === '' || Number(taka) >= 0;
}

const { form, isDirty, isSaving, saveError, problems, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const k = config.knowledge;
    return {
      delivers: !!k.delivers,
      charge: toTaka(k.delivery_charge),
      deposit: toTaka(k.deposit),
      zones: (k.delivery || []).map((z) => ({
        name: z.name,
        charge: toTaka(z.charge),
        days: z.days || '',
        places: (z.places || []).join(', '),
      })),
      freeOver: toTaka(k.free_delivery_over),
      pay_first: !!k.pay_first,
    };
  },
  // Only this desk's own fields. Paying first stays as the owner left it while the
  // SSLCommerz account is missing: the agent asks for nothing until one is connected.
  patchFrom: (f) => {
    const patch = { pay_first: f.pay_first && !nothingToTake.value };
    if (kind.value === 'restaurant') {
      patch.delivers = f.delivers;
      patch.delivery_charge = toPaisa(f.charge);
    }
    if (kind.value === 'clinic') patch.deposit = toPaisa(f.deposit);
    if (kind.value === 'shop') {
      patch.delivery = f.zones.map((z) => ({
        name: z.name,
        charge: toPaisa(z.charge),
        days: z.days,
        places: toList(z.places),
      }));
      patch.free_delivery_over = toPaisa(f.freeOver);
    }
    return patch;
  },
});

// What's missing for there to be anything to take first, or ''.
const nothingToTake = computed(() => {
  const f = form.value;
  const needs = t(`${words.value}.needs`);
  if (kind.value === 'restaurant' && !(f.delivers && toPaisa(f.charge) > 0)) return needs;
  if (kind.value === 'clinic' && !(toPaisa(f.deposit) > 0)) return needs;
  if (kind.value === 'shop' && !f.zones.length) return needs;
  return '';
});

// Why paying first can't be turned on yet, or '' when it can.
const blocker = computed(() => (connected.value ? nothingToTake.value : t('payments.connectFirst')));
</script>
