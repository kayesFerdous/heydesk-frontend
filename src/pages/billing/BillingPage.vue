<template>
  <!-- The business's plan (backend D106): how much of it is used, and paying for one.
       Paying sends the owner to the gateway's page (SSLCommerz or bKash, whichever HeyDesk has
       set up, backend D109); the backend sends them back here with ?payment=paid|review|failed. -->
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('billing.title')" :tip="t('billing.subtitle')"></PageHeader>

    <p v-if="paid" class="island mb-4 flex items-start gap-2 px-5 py-3 text-sm sm:px-8"
       :class="paid === 'paid' ? 'bg-success-tint text-success' : 'bg-danger-tint text-danger'" role="status">
      <component :is="paid === 'paid' ? PhCheckCircle : PhWarningCircle" :size="18" class="mt-px shrink-0"></component>
      {{ t(`billing.paid.${paid}`) }}
    </p>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!billing" class="island overflow-hidden"></SkeletonRows>

    <div v-else class="island px-4 pt-4 pb-3 sm:px-6">
      <SettingsGroup :title="t('billing.yourPlan')" :tip="t('billing.yourPlanTip')">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-semibold">{{ t(`billing.plans.${billing.plan}`) }}</span>
          <span v-if="billing.active" class="chip bg-brand-tint text-brand">
            {{ t('billing.until', { day: formatDay(billing.paid_until) }) }}
          </span>
          <span v-else class="chip bg-danger-tint text-danger">{{ t('billing.ended') }}</span>
        </div>

        <div class="max-w-md">
          <div class="flex justify-between text-sm">
            <span>{{ t('billing.replies') }}</span>
            <span class="text-ink-soft">
              {{ formatNumber(billing.replies_used) }} / {{ formatNumber(billing.replies) }}
            </span>
          </div>
          <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-hover" role="progressbar"
               :aria-valuenow="billing.replies_used" aria-valuemin="0" :aria-valuemax="billing.replies">
            <div class="h-full rounded-full" :class="used >= 0.8 ? 'bg-danger' : 'bg-brand'" :style="{ width: `${used * 100}%` }"></div>
          </div>
          <p class="hint">{{ t('billing.repliesHint') }}</p>
        </div>

        <p v-if="!billing.active" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ t('billing.endedText') }}
        </p>
      </SettingsGroup>

      <SettingsGroup :title="t('billing.choose')" :tip="t('billing.chooseTip')">
        <div class="segmented self-start" role="radiogroup">
          <button
            v-for="option in [1, 12]"
            :key="option"
            type="button"
            role="radio"
            :aria-checked="months === option"
            class="segment"
            :class="{ 'segment-active': months === option }"
            @click="months = option"
          >
            {{ option === 1 ? t('billing.monthly') : t('billing.yearly') }}
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div
            v-for="plan in billing.plans"
            :key="plan.key"
            class="flex flex-col gap-4 rounded-xl border p-5"
            :class="plan.key === billing.plan ? 'border-brand' : 'border-hairline'"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold">{{ t(`billing.plans.${plan.key}`) }}</p>
                <span v-if="plan.key === billing.plan" class="chip bg-brand-tint text-brand">{{ t('billing.current') }}</span>
              </div>
              <p class="mt-0.5 text-sm text-ink-soft">{{ t(`billing.planFor.${plan.key}`) }}</p>
              <p class="mt-3">
                <span class="text-2xl font-semibold">{{ formatMoney(months === 1 ? plan.price : plan.year_price) }}</span>
                <span class="text-sm text-ink-soft"> / {{ months === 1 ? t('billing.month') : t('billing.year') }}</span>
              </p>
              <!-- The other way of paying, so the two can be compared without switching. -->
              <p class="text-sm text-ink-soft">
                {{ months === 1
                  ? t('billing.orYearly', { money: formatMoney(plan.year_price) })
                  : t('billing.yearSaves', { money: formatMoney(Math.round(plan.year_price / 1200) * 100), saved: formatMoney(plan.price * 12 - plan.year_price) }) }}
              </p>
            </div>
            <ul class="flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
              <li class="flex items-center gap-2">
                <PhChatsCircle :size="16" class="shrink-0 text-ink-soft"></PhChatsCircle>
                {{ t('billing.repliesEach', { n: formatNumber(plan.replies) }) }}
              </li>
              <li class="flex items-center gap-2">
                <PhCalendarBlank :size="16" class="shrink-0 text-ink-soft"></PhCalendarBlank>
                {{ t('billing.repliesDay', { n: formatNumber(Math.floor(plan.replies / 30)) }) }}
              </li>
              <li class="flex items-center gap-2">
                <PhUsersThree :size="16" class="shrink-0 text-ink-soft"></PhUsersThree>
                {{ t('billing.moderators', { n: plan.moderators }, plan.moderators) }}
              </li>
              <li class="flex items-center gap-2">
                <PhCoins :size="16" class="shrink-0 text-ink-soft"></PhCoins>
                {{ t('billing.per100', { money: formatMoney(per100(plan)) }) }}
              </li>
            </ul>
            <!-- One button per gateway HeyDesk has set up; the first is the main one. -->
            <div v-if="billing.gateways.length" class="mt-auto flex flex-col gap-2">
              <button
                v-for="(gateway, index) in billing.gateways"
                :key="gateway"
                type="button"
                class="btn"
                :class="plan.key === billing.plan && billing.active ? 'btn-quiet' : plan.key === suggested && index === 0 ? 'btn-primary' : 'btn-secondary'"
                :disabled="paying !== null"
                @click="pay(plan, gateway)"
              >
                {{ paying === `${plan.key}:${gateway}`
                  ? t('billing.opening')
                  : t(`billing.${plan.key === billing.plan ? 'renewWith' : 'payWith'}.${gateway}`) }}
              </button>
            </div>
          </div>
        </div>
        <!-- What every plan shares is said once, so the cards show only what differs. A paid plan keeps answering for GRACE_DAYS after it ends (backend D106). -->
        <p class="hint">
          {{ t('billing.allPlans') }}
          {{ billing.gateways.length ? t('billing.payNote') : t('billing.noGateway') }}
        </p>

        <p v-if="payError" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ payError }}
        </p>
      </SettingsGroup>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  PhCalendarBlank,
  PhChatsCircle,
  PhCheckCircle,
  PhCoins,
  PhUsersThree,
  PhWarningCircle,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchBilling, startCheckout } from '../../api/billing.js';
import { formatDay, formatMoney, formatNumber } from '../../lib/format.js';

const { t } = useI18n();

const billing = ref(null);
const loadError = ref(null);
const months = ref(1);
const paying = ref(null); // "plan:gateway" whose payment page is opening
const payError = ref(null);

// How the payment went, from the backend's redirect after the gateway (backend D116). Read once,
// then dropped from the address so a reload doesn't show it again.
const route = useRoute();
const router = useRouter();
const paid = ref(['paid', 'review', 'failed'].includes(route.query.payment) ? route.query.payment : null);
if (route.query.payment) router.replace({ query: {} });
const used = computed(() => Math.min(1, billing.value.replies_used / billing.value.replies));

// What 100 replies cost on a plan, paying monthly or yearly: a way to compare plans.
function per100(plan) {
  const month = months.value === 1 ? plan.price : plan.year_price / 12;
  return (month / plan.replies) * 100;
}

async function load() {
  loadError.value = null;
  try {
    billing.value = await fetchBilling();
  } catch (error) {
    loadError.value = error.message;
  }
}

async function pay(plan, gateway) {
  paying.value = `${plan.key}:${gateway}`;
  payError.value = null;
  try {
    const { url } = await startCheckout(plan.key, months.value, gateway);
    window.location.assign(url);
  } catch (error) {
    payError.value = error.message; // the backend's own words, such as no store set up yet
    paying.value = null;
  }
}

load();
</script>
