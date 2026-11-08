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
      <!-- Your plan in one row: which one and until when, then how much of it is used.
           What a reply is and what happens when they run out sit behind the "i". -->
      <div class="island flex flex-col gap-4 px-5 py-4 sm:px-6 md:flex-row md:items-center md:gap-10">
        <div class="shrink-0">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-2xl leading-none font-semibold tracking-[-0.03em]">
              <span class="sr-only">{{ t('billing.yourPlan') }}: </span>{{ t(`billing.plans.${billing.plan}`) }}
            </h2>
            <span v-if="billing.active" class="chip bg-success-tint text-success">
              <PhCheckCircle :size="14" weight="fill"></PhCheckCircle>
              {{ t('billing.until', { day: formatDay(billing.paid_until) }) }}
            </span>
            <span v-else class="chip bg-danger-tint text-danger">
              <PhWarningCircle :size="14" weight="fill"></PhWarningCircle>
              {{ t('billing.ended') }}
            </span>
          </div>
          <p v-if="!billing.active" class="mt-2 max-w-md text-sm text-danger" role="alert">{{ t('billing.endedText') }}</p>
        </div>

        <div class="min-w-0 flex-1 md:border-l md:border-hairline md:pl-10">
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-ink-soft">
              {{ t('billing.replies') }}
              <InfoTip :text="`${t('billing.yourPlanTip')} ${t('billing.repliesHint')}`" class="ml-0.5 -translate-y-px"></InfoTip>
            </span>
            <span class="shrink-0">
              <span class="font-semibold">{{ formatNumber(billing.replies_used) }}</span>
              <span class="text-ink-soft"> / {{ formatNumber(billing.replies) }}</span>
            </span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-hover" role="progressbar"
               :aria-valuenow="billing.replies_used" aria-valuemin="0" :aria-valuemax="billing.replies">
            <!-- A sliver stays visible even at a handful of replies, so the bar reads as a bar. -->
            <div class="h-full min-w-2 rounded-full transition-[width] duration-500 ease-[var(--ease-settle)]"
                 :class="used >= 0.8 ? 'bg-danger' : 'bg-ink'" :style="{ width: `${used * 100}%` }"></div>
          </div>
        </div>
      </div>

      <!-- The plans as a pricing page: three cards stepping up to the right, the
           popular one dark. Each shows its name, price, button, then what it holds.
           On a wide screen the island takes the rest of the window and the cards sit
           in the middle of it: their tops step, their bottoms line up. -->
      <div class="island p-5 lg:flex lg:flex-1 lg:flex-col">
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

        <div class="mt-5 lg:flex lg:flex-1 lg:items-center">
        <div class="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-3">
          <div
            v-for="(plan, index) in billing.plans"
            :key="plan.key"
            class="flex flex-col gap-4 rounded-[var(--radius-panel)] p-5 shadow-[var(--shadow-float)] [@media(min-height:820px)]:gap-6 [@media(min-height:820px)]:p-7 [@media(min-height:820px)]:lg:min-h-[32rem]"
            :class="[STEP[index], plan.key === POPULAR ? 'plan-popular text-white' : ['plan-light border', plan.key === billing.plan ? 'border-ink' : 'border-hairline']]"
          >
            <div class="flex min-h-7 items-center justify-between gap-2">
              <h3 class="font-semibold" :class="soft(plan)">{{ t(`billing.plans.${plan.key}`) }}</h3>
              <span v-if="plan.key === billing.plan" class="chip bg-brand-tint text-ink">{{ t('billing.current') }}</span>
              <span v-else-if="plan.key === POPULAR" class="chip border border-white/20 bg-night-tile">
                <span class="popular-text">{{ t('billing.popular') }}</span>
              </span>
            </div>

            <div>
              <p>
                <span class="text-4xl font-semibold tracking-[-0.03em]">{{ formatMoney(months === 1 ? plan.price : plan.year_price) }}</span>
                <span class="font-semibold" :class="soft(plan)"> /{{ months === 1 ? t('billing.month') : t('billing.year') }}</span>
              </p>
              <!-- The other way of paying, so the two can be compared without switching. -->
              <p class="mt-1 text-sm" :class="soft(plan)">
                {{ months === 1
                  ? t('billing.orYearly', { money: formatMoney(plan.year_price) })
                  : t('billing.yearSaves', { money: formatMoney(Math.round(plan.year_price / 1200) * 100), saved: formatMoney(plan.price * 12 - plan.year_price) }) }}
              </p>
            </div>

            <button
              v-if="billing.gateways.length"
              type="button"
              class="btn"
              :class="plan.key === POPULAR ? 'bg-white text-ink hover:bg-hover' : plan.key === billing.plan ? 'btn-secondary' : 'btn-primary'"
              :disabled="paying !== null"
              @click="pay(plan)"
            >
              {{ paying === plan.key ? t('billing.opening') : t(plan.key === billing.plan ? 'billing.renew' : 'billing.pay') }}
            </button>

            <ul class="flex flex-col gap-2.5 text-sm [@media(min-height:820px)]:gap-3.5">
              <li v-for="line in lines(plan)" :key="line" class="flex items-center gap-2.5">
                <PhCheck :size="16" weight="bold" class="shrink-0"></PhCheck>
                {{ line }}
              </li>
            </ul>

            <!-- What 100 replies cost here, the plans' one like-for-like figure, closes the card. -->
            <p class="mt-auto flex items-baseline justify-between gap-3 border-t pt-3 text-sm [@media(min-height:820px)]:pt-4" :class="plan.key === POPULAR ? 'border-white/10' : 'border-hairline'">
              <span :class="soft(plan)">{{ t('billing.per100Label') }}</span>
              <span class="font-semibold">{{ formatMoney(per100(plan)) }}</span>
            </p>
          </div>
        </div>
        </div>
        <p class="hint mt-4 [@media(min-height:820px)]:mt-6">{{ billing.gateways.length ? t('billing.payNote') : t('billing.noGateway') }}</p>

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

// The plan most shops pick: its card is the dark one.
const POPULAR = 'growth';
// Cards step up left to right, as on a pricing page; stacked on a phone.
const STEP = ['lg:mt-6 [@media(min-height:820px)]:lg:mt-12', 'lg:mt-3 [@media(min-height:820px)]:lg:mt-6'];

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

// The dark card (the popular plan) has light text, so its quiet words are the sidebar's soft grey.
function soft(plan) {
  return plan.key === POPULAR ? 'text-night-soft' : 'text-ink-soft';
}

// What 100 replies cost on a plan, paying monthly or yearly: a way to compare plans.
function per100(plan) {
  const month = months.value === 1 ? plan.price : plan.year_price / 12;
  return (month / plan.replies) * 100;
}

// What a plan holds: what differs first, then what every plan shares.
// A paid plan keeps answering for GRACE_DAYS after it ends (backend D106).
function lines(plan) {
  return [
    t('billing.repliesEach', { n: formatNumber(plan.replies) }),
    t('billing.repliesDay', { n: formatNumber(Math.floor(plan.replies / 30)) }),
    t('billing.moderators', { n: formatNumber(plan.moderators) }, plan.moderators),
    t('billing.shared.grace'),
    t('billing.shared.features'),
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

<style scoped>
/* The popular plan: the sidebar's black, lit by a soft lime glow from its top
   corner. The light cards fade from the wash to white. */
.plan-popular {
  background:
    radial-gradient(120% 70% at 100% 0%, color-mix(in srgb, var(--color-lime) 22%, transparent), transparent 60%),
    var(--color-night);
}

.plan-light {
  background: linear-gradient(to bottom, var(--color-wash), var(--color-surface) 45%);
}

/* "Most popular" in the soft pastels. */
.popular-text {
  background: linear-gradient(to right, var(--color-tint-lilac), var(--color-lime), var(--color-tint-sky));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
