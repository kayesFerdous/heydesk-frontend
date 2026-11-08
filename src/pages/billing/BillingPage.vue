<template>
  <!-- The business's plan (backend D106): how much of it is used, and paying for one.
       Paying sends the owner to the gateway's page (SSLCommerz or bKash, whichever HeyDesk has
       set up, backend D109); the backend sends them back here with ?payment=paid|review|failed. -->
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('billing.title')" :tip="t('billing.subtitle')"></PageHeader>

    <p v-if="paid" class="island mb-2 flex items-start gap-2 px-5 py-3 text-sm sm:px-6"
       :class="paid === 'paid' ? 'bg-success-tint text-success' : 'bg-danger-tint text-danger'" role="status">
      <component :is="paid === 'paid' ? PhCheckCircle : PhWarningCircle" :size="18" class="mt-px shrink-0"></component>
      {{ t(`billing.paid.${paid}`) }}
    </p>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!billing" class="island overflow-hidden"></SkeletonRows>

    <div v-else class="flex flex-col gap-2">
      <!-- Your plan: which one and until when on the left, how much of it is used on the right. -->
      <div class="island grid gap-6 p-5 sm:p-6 md:grid-cols-2 md:gap-10">
        <div>
          <h2 class="section-title">
            {{ t('billing.yourPlan') }}
            <InfoTip :text="t('billing.yourPlanTip')" class="ml-0.5 -translate-y-px"></InfoTip>
          </h2>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <span class="text-[2rem] leading-none font-semibold tracking-[-0.03em]">{{ t(`billing.plans.${billing.plan}`) }}</span>
            <span v-if="billing.active" class="chip bg-success-tint text-success">
              <PhCheckCircle :size="14" weight="fill"></PhCheckCircle>
              {{ t('billing.until', { day: formatDay(billing.paid_until) }) }}
            </span>
            <span v-else class="chip bg-danger-tint text-danger">
              <PhWarningCircle :size="14" weight="fill"></PhWarningCircle>
              {{ t('billing.ended') }}
            </span>
          </div>
          <p v-if="!billing.active" class="mt-3 max-w-md text-sm text-danger" role="alert">{{ t('billing.endedText') }}</p>
        </div>

        <div class="md:border-l md:border-hairline md:pl-10">
          <p class="text-sm text-ink-soft">{{ t('billing.replies') }}</p>
          <p class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[2rem] leading-none font-semibold tracking-[-0.03em]">{{ formatNumber(billing.replies_used) }}</span>
            <span class="text-sm text-ink-soft">/ {{ formatNumber(billing.replies) }}</span>
          </p>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-hover" role="progressbar"
               :aria-valuenow="billing.replies_used" aria-valuemin="0" :aria-valuemax="billing.replies">
            <!-- A sliver stays visible even at a handful of replies, so the bar reads as a bar. -->
            <div class="h-full min-w-2 rounded-full transition-[width] duration-500 ease-[var(--ease-settle)]"
                 :class="used >= 0.8 ? 'bg-danger' : 'bg-ink'" :style="{ width: `${used * 100}%` }"></div>
          </div>
          <p class="hint">{{ t('billing.repliesHint') }}</p>
        </div>
      </div>

      <!-- The plans side by side. The one you are on is the dark card; the one black
           button is the plan to pick next (renew once yours ended, else the next one up). -->
      <div class="island p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="section-title">
            {{ t('billing.choose') }}
            <InfoTip :text="t('billing.chooseTip')" class="ml-0.5 -translate-y-px"></InfoTip>
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <!-- How to pay, only when HeyDesk has more than one way set up. -->
            <div v-if="billing.gateways.length > 1" class="segmented" role="radiogroup" :aria-label="t('billing.payBy')">
              <button
                v-for="option in billing.gateways"
                :key="option"
                type="button"
                role="radio"
                :aria-checked="gateway === option"
                class="segment"
                :class="{ 'segment-active': gateway === option }"
                @click="gateway = option"
              >
                <component :is="option === 'bkash' ? PhDeviceMobile : PhCreditCard" :size="16"></component>
                {{ t(`billing.gateway.${option}`) }}
              </button>
            </div>
            <div class="segmented" role="radiogroup" :aria-label="t('billing.choose')">
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
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div
            v-for="plan in billing.plans"
            :key="plan.key"
            class="flex flex-col rounded-[var(--radius-card)] p-6"
            :class="plan.key === billing.plan ? 'bg-night text-white' : 'border border-hairline bg-surface'"
          >
            <div class="flex min-h-7 items-center justify-between gap-2">
              <h3 class="font-semibold">{{ t(`billing.plans.${plan.key}`) }}</h3>
              <span v-if="plan.key === billing.plan" class="chip bg-lime text-ink">{{ t('billing.current') }}</span>
            </div>
            <p class="mt-0.5 text-sm" :class="soft(plan)">{{ t(`billing.planFor.${plan.key}`) }}</p>

            <p class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-semibold tracking-[-0.03em]">{{ formatMoney(months === 1 ? plan.price : plan.year_price) }}</span>
              <span class="text-sm font-medium" :class="soft(plan)">/ {{ months === 1 ? t('billing.month') : t('billing.year') }}</span>
            </p>
            <!-- The other way of paying, so the two can be compared without switching. -->
            <p class="mt-1 text-sm" :class="soft(plan)">
              {{ months === 1
                ? t('billing.orYearly', { money: formatMoney(plan.year_price) })
                : t('billing.yearSaves', { money: formatMoney(Math.round(plan.year_price / 1200) * 100), saved: formatMoney(plan.price * 12 - plan.year_price) }) }}
            </p>

            <button
              v-if="billing.gateways.length"
              type="button"
              class="btn mt-6 w-full"
              :class="buttonClass(plan)"
              :disabled="paying !== null"
              @click="pay(plan)"
            >
              {{ paying === plan.key ? t('billing.opening') : t(plan.key === billing.plan ? 'billing.renew' : 'billing.pay') }}
            </button>

            <ul class="mt-6 flex flex-col gap-3 border-t pt-5 text-sm" :class="plan.key === billing.plan ? 'border-night-tile' : 'border-hairline'">
              <li v-for="line in lines(plan)" :key="line" class="flex items-start gap-2.5">
                <PhCheck :size="16" weight="bold" class="mt-0.5 shrink-0" :class="plan.key === billing.plan ? 'text-lime' : 'text-ink-soft'"></PhCheck>
                {{ line }}
              </li>
            </ul>
          </div>
        </div>

        <!-- What every plan shares is said once, so the cards show only what differs.
             A paid plan keeps answering for GRACE_DAYS after it ends (backend D106). -->
        <ul class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li v-for="line in [t('billing.shared.features'), t('billing.shared.grace')]" :key="line" class="flex items-center gap-2">
            <PhCheckCircle :size="16" weight="fill" class="shrink-0 text-success"></PhCheckCircle>
            {{ line }}
          </li>
        </ul>
        <p class="hint">{{ billing.gateways.length ? t('billing.payNote') : t('billing.noGateway') }}</p>

        <p v-if="payError" class="mt-3 flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ payError }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { PhCheck, PhCheckCircle, PhCreditCard, PhDeviceMobile, PhWarningCircle } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import InfoTip from '../../components/ui/InfoTip.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchBilling, startCheckout } from '../../api/billing.js';
import { formatDay, formatMoney, formatNumber } from '../../lib/format.js';

const { t } = useI18n();

const billing = ref(null);
const loadError = ref(null);
const months = ref(1);
const gateway = ref(null); // how to pay: the first gateway HeyDesk has set up, unless the owner picks another
const paying = ref(null); // the plan whose payment page is opening
const payError = ref(null);

// How the payment went, from the backend's redirect after the gateway (backend D116). Read once,
// then dropped from the address so a reload doesn't show it again.
const route = useRoute();
const router = useRouter();
const paid = ref(['paid', 'review', 'failed'].includes(route.query.payment) ? route.query.payment : null);
if (route.query.payment) router.replace({ query: {} });
const used = computed(() => Math.min(1, billing.value.replies_used / billing.value.replies));

watch(billing, (value) => {
  if (value && !value.gateways.includes(gateway.value)) gateway.value = value.gateways[0] ?? null;
});

// The plan to pick next: yours again once it has ended, else the next one up
// (the first for a free trial), and none when you are on the biggest.
const suggested = computed(() => {
  const { plans, plan, active } = billing.value;
  const index = plans.findIndex((p) => p.key === plan);
  if (!active) return index >= 0 ? plan : plans[0]?.key;
  return plans[index + 1]?.key;
});

// The dark card (your plan) has light text, so its quiet words are the sidebar's soft grey.
function soft(plan) {
  return plan.key === billing.value.plan ? 'text-night-soft' : 'text-ink-soft';
}

function buttonClass(plan) {
  const current = plan.key === billing.value.plan;
  if (plan.key === suggested.value) return current ? 'btn-lime' : 'btn-primary';
  if (current) return 'bg-night-tile text-white hover:bg-[color-mix(in_srgb,var(--color-night-tile),white_8%)]';
  return 'btn-secondary';
}

// What 100 replies cost on a plan, paying monthly or yearly: a way to compare plans.
function per100(plan) {
  const month = months.value === 1 ? plan.price : plan.year_price / 12;
  return (month / plan.replies) * 100;
}

// Only what differs between plans; what they share is said once under them.
function lines(plan) {
  return [
    t('billing.repliesEach', { n: formatNumber(plan.replies) }),
    t('billing.repliesDay', { n: formatNumber(Math.floor(plan.replies / 30)) }),
    t('billing.moderators', { n: formatNumber(plan.moderators) }, plan.moderators),
    t('billing.per100', { money: formatMoney(per100(plan)) }),
  ];
}

async function load() {
  loadError.value = null;
  try {
    billing.value = await fetchBilling();
  } catch (error) {
    loadError.value = error.message;
  }
}

async function pay(plan) {
  paying.value = plan.key;
  payError.value = null;
  try {
    const { url } = await startCheckout(plan.key, months.value, gateway.value);
    window.location.assign(url);
  } catch (error) {
    payError.value = error.message; // the backend's own words, such as no store set up yet
    paying.value = null;
  }
}

load();
</script>
