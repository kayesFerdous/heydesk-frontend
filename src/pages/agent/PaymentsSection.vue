<template>
  <div>
    <!-- Each is a row that opens to connect or change it, saved apart from the
         form below. One or both: with both, the customer picks on the pay page
         (backend D109). -->
    <SettingsGroup :title="t('payments.online')" :tip="`${t('payments.onlineTip')} ${t('payments.oneOrBoth')}`">
      <ul class="-mt-5 -mb-5">
        <ConnectionRow
          id="sslcommerz"
          image="/logos/sslcommerz.svg"
          name="SSLCommerz"
          :line="sslcommerz ? inTest(t('payments.storeLine', { store: sslcommerz.store_id }), sslcommerz.sandbox) : t('payments.about.sslcommerz')"
          :live="liveOf(sslcommerz)"
          :open="open === 'sslcommerz'"
          @toggle="toggle('sslcommerz')"
        >
          <SslcommerzConnect @change="sslcommerz = $event" @close="open = null"></SslcommerzConnect>
        </ConnectionRow>
        <ConnectionRow
          id="bkash"
          image="/logos/bkash.png"
          name="bKash"
          :line="bkash ? inTest(bkash.username, bkash.sandbox) : t('payments.about.bkash')"
          :live="liveOf(bkash)"
          :open="open === 'bkash'"
          @toggle="toggle('bkash')"
        >
          <BkashConnect @change="bkash = $event" @close="open = null"></BkashConnect>
        </ConnectionRow>
      </ul>
    </SettingsGroup>

    <!-- The courier: every confirmed order is booked there (backend D113). -->
    <SettingsGroup :title="t('courier.group')" :tip="t('courier.groupTip')">
      <ul class="-mt-5 -mb-5">
        <ConnectionRow
          id="courier"
          :image="courier ? `/logos/${courier.kind}.png` : ''"
          :images="['/logos/steadfast.png', '/logos/pathao.png']"
          :name="courier ? (courier.kind === 'pathao' ? 'Pathao' : 'Steadfast') : t('courier.title')"
          :line="courier ? inTest(t('courier.linkedShort'), courier.sandbox) : t('payments.about.courier')"
          :live="liveOf(courier)"
          :problem="courier?.problem ? t('courier.stuck') : ''"
          :open="open === 'courier'"
          @toggle="toggle('courier')"
        >
          <CourierConnect @change="courier = $event" @close="open = null"></CourierConnect>
        </ConnectionRow>
      </ul>
    </SettingsGroup>

    <form v-if="form" class="border-t border-hairline [&>section:first-of-type]:!pt-6 [&>section:first-of-type]:!border-t-0" novalidate @submit.prevent="save">
      <FormProblems :message="saveError" :problems="problems" class="mt-6"></FormProblems>

      <!-- Its delivery areas, each with a charge. -->
      <SettingsGroup :title="t('payments.areas')" :tip="t('payments.areasText')">
        <!-- One row per area: name, charge, days, then its districts under it.
             The headings show once when the panel is wide enough; narrower, each field keeps its label. -->
        <div class="@container">
          <div class="hidden grid-cols-[minmax(0,1fr)_6rem_7.5rem_2.75rem] gap-3 pb-1 @md:grid">
            <span class="label !mb-0">{{ t('payments.area') }}</span>
            <span class="label !mb-0">{{ t('payments.charge') }} (৳)</span>
            <span class="label !mb-0">{{ t('payments.usuallyTakes') }}</span>
          </div>
          <div class="divide-y divide-hairline border-b border-hairline">
            <div v-for="(zone, index) in form.zones" :key="index" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-end gap-x-3 gap-y-2.5 py-4 @md:grid-cols-[minmax(0,1fr)_6rem_7.5rem_2.75rem]">
              <div class="col-span-2 @md:col-span-1">
                <FieldLabel :html-for="`zone-${index}`" class="@md:sr-only">{{ t('payments.area') }}</FieldLabel>
                <input :id="`zone-${index}`" v-model.trim="zone.name" class="field" :class="{ 'field-invalid': !zone.name }" type="text" :placeholder="t('payments.areaPlaceholder')" />
              </div>
              <div>
                <FieldLabel :html-for="`zone-charge-${index}`" class="@md:sr-only">{{ t('payments.charge') }} (৳)</FieldLabel>
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
              <div class="col-span-2 @md:col-span-1">
                <FieldLabel :html-for="`zone-days-${index}`" class="@md:sr-only">{{ t('payments.usuallyTakes') }}</FieldLabel>
                <input :id="`zone-days-${index}`" v-model.trim="zone.days" class="field" type="text" :placeholder="t('payments.daysPlaceholder')" />
              </div>
              <button type="button" class="btn btn-quiet btn-icon col-start-3 row-start-1 @md:col-start-4" :aria-label="t('payments.removeArea', { name: zone.name || t('payments.thisArea') })" @click="form.zones.splice(index, 1)">
                <PhTrash :size="18"></PhTrash>
              </button>
              <!-- Picked from the 64 (type to search), so nothing is misspelled; none: everywhere else. -->
              <div class="col-span-3 flex flex-wrap items-center gap-2 @md:col-span-4">
                <FieldLabel :html-for="`zone-districts-${index}`" class="sr-only">{{ t('payments.districts') }}</FieldLabel>
                <span v-for="name in zone.districts" :key="name" class="chip bg-hover text-ink-soft">
                  {{ districtLabel(name) }}
                  <button type="button" class="hover:text-danger" :aria-label="t('payments.removeDistrict', { name: districtLabel(name) })" @click="zone.districts = zone.districts.filter((d) => d !== name)">
                    <PhX :size="12" weight="bold"></PhX>
                  </button>
                </span>
                <input
                  :id="`zone-districts-${index}`"
                  :list="`zone-districts-list-${index}`"
                  class="field h-9 w-auto min-w-48 flex-1"
                  type="text"
                  autocomplete="off"
                  :placeholder="zone.districts.length ? t('payments.addDistrict') : t('payments.everywhereElse')"
                  @change="addDistrict(zone, $event)"
                  @keydown.enter.prevent="addDistrict(zone, $event)"
                />
                <datalist :id="`zone-districts-list-${index}`">
                  <option v-for="[en] in DISTRICTS.filter(([d]) => !zone.districts.includes(d))" :key="en" :value="districtLabel(en)"></option>
                </datalist>
              </div>
            </div>
          </div>
        </div>
        <!-- Add an area and the free-delivery line share one row. -->
        <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
          <button type="button" class="btn btn-secondary" @click="form.zones.push({ name: '', charge: '', days: '', districts: [] })">
            <PhPlus :size="16" weight="bold"></PhPlus>
            {{ t('payments.addArea') }}
          </button>
          <div>
            <FieldLabel html-for="free-over" :tip="t('payments.freeOverHint')">{{ t('payments.freeOver') }} (৳)</FieldLabel>
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
          </div>
        </div>
      </SettingsGroup>

      <!-- Whether a cash order waits for the shop's call before it is sent (backend call_to_confirm). -->
      <SettingsGroup v-if="hasCallToConfirm" :title="t('payments.cash')">
        <div class="flex items-center justify-between gap-4">
          <div>
            <label class="text-sm font-medium" for="call-to-confirm">{{ t('profile.fields.call_to_confirm.label') }}</label>
            <p class="hint !mt-0.5">{{ form.call_to_confirm ? t('profile.fields.call_to_confirm.on') : t('profile.fields.call_to_confirm.off') }}</p>
          </div>
          <ToggleSwitch id="call-to-confirm" v-model="form.call_to_confirm" :label="t('profile.fields.call_to_confirm.label')"></ToggleSwitch>
        </div>
      </SettingsGroup>

      <SettingsGroup :title="t('payments.shop.title')" :tip="t('payments.shop.explain')">
        <!-- Paying first needs an account connected above: until then the switch
             stays away and one line says why. -->
        <div v-if="connected" class="flex items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-1.5">
              <label class="text-sm font-medium" for="pay-first">{{ t('payments.shop.toggle') }}</label>
              <InfoTip :text="`${t('payments.linkIntroAny')} ${t('payments.shop.after')} ${t('payments.onlyPayment')}`"></InfoTip>
            </div>
            <!-- What is still missing stays in view: it is the next step. -->
            <p v-if="blocker" class="hint !mt-0.5">{{ blocker }}</p>
          </div>
          <ToggleSwitch
            id="pay-first"
            :model-value="form.pay_first && !blocker"
            :label="t('payments.shop.toggle')"
            :disabled="!!blocker"
            @update:model-value="form.pay_first = $event"
          ></ToggleSwitch>
        </div>
        <p v-else class="hint !mt-0">{{ t('payments.connectAccountFirst') }}</p>
      </SettingsGroup>

      <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
      <div class="h-8"></div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPlus, PhTrash, PhX } from '@phosphor-icons/vue';

import ConnectionRow from '../../components/ui/ConnectionRow.vue';
import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import InfoTip from '../../components/ui/InfoTip.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import SslcommerzConnect from '../../components/agent/SslcommerzConnect.vue';
import BkashConnect from '../../components/agent/BkashConnect.vue';
import CourierConnect from '../../components/agent/CourierConnect.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { DISTRICTS } from '../../lib/districts.js';

// Taka in the form, paisa in the API.
const toTaka = (paisa) => String((paisa || 0) / 100);
const toPaisa = (taka) => Math.round(Number(taka || 0) * 100);

const { t, locale } = useI18n();
const agent = useAgentStore();

// Only a desk that has the switch (a shop).
const hasCallToConfirm = computed(() => 'call_to_confirm' in (agent.preset?.knowledge_schema.properties ?? {}));

// A district's name in the console's language; the English one is saved.
const districtLabel = (en) => (locale.value === 'bn' && DISTRICTS.find(([d]) => d === en)?.[1]) || en;
// What they typed or picked, in English or Bangla, as a district not yet in the area;
// anything else stays in the box to fix.
function addDistrict(zone, event) {
  const typed = event.target.value.trim().toLowerCase();
  const found = DISTRICTS.find(([en, bn]) => en.toLowerCase() === typed || bn === typed);
  if (!found) return;
  if (!zone.districts.includes(found[0])) zone.districts.push(found[0]);
  event.target.value = '';
}
// The accounts the rows below report: undefined while still being asked for, null when
// not connected, else the account. Paying first needs either payment account.
const sslcommerz = ref(undefined);
const bkash = ref(undefined);
const courier = ref(undefined);
const connected = computed(() => !!sslcommerz.value || !!bkash.value);
// One connection open at a time, none to begin with.
const open = ref(null);
const toggle = (id) => (open.value = open.value === id ? null : id);
const liveOf = (account) => (account === undefined ? null : !!account);
const inTest = (line, sandbox) => (sandbox ? `${line} · ${t('payments.testMode')}` : line);

function validAmount(taka) {
  return taka === '' || Number(taka) >= 0;
}

const { form, isDirty, isSaving, saveError, problems, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const k = config.knowledge;
    return {
      zones: (k.delivery || []).map((z) => ({
        name: z.name,
        charge: toTaka(z.charge),
        days: z.days || '',
        // The districts it covers (backend D98).
        districts: [...(z.districts || [])],
      })),
      freeOver: toTaka(k.free_delivery_over),
      // A shop pays first per area (backend D92); this one switch is on if any area is.
      pay_first: !!k.pay_first || (k.delivery || []).some((z) => z.pay_first),
      call_to_confirm: k.call_to_confirm ?? true,
    };
  },
  // Only this desk's own fields. Paying first stays as the owner left it while the
  // payment account is missing: the agent asks for nothing until one is connected.
  patchFrom: (f) => {
    const payFirst = f.pay_first && !nothingToTake.value;
    // There is no switch of its own since backend D92: it's set on every area.
    return {
      delivery: f.zones.map((z) => ({
        name: z.name,
        charge: toPaisa(z.charge),
        days: z.days,
        districts: z.districts,
        pay_first: payFirst,
      })),
      free_delivery_over: toPaisa(f.freeOver),
      ...(hasCallToConfirm.value && { call_to_confirm: f.call_to_confirm }),
    };
  },
});

// What's missing for there to be anything to take first, or ''.
const nothingToTake = computed(() => {
  const f = form.value;
  return f.zones.length ? '' : t('payments.shop.needs');
});

// Why paying first can't be turned on yet, or '' when it can.
const blocker = computed(() => (connected.value ? nothingToTake.value : t('payments.connectAccountFirst')));
</script>
