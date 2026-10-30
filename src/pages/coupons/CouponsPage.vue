<template>
  <!-- A shop's coupon codes (backend D133): a form for a new one, then the codes,
       each with what it takes off, how many orders used it and when it ends. -->
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('coupons.title')" :tip="t('coupons.subtitle')"></PageHeader>

    <form class="island grid grid-cols-2 gap-3 p-5 sm:grid-cols-5" @submit.prevent="add">
      <label class="block">
        <span class="label">{{ t('coupons.code') }}</span>
        <input v-model.trim="form.code" class="field uppercase" required minlength="2" maxlength="30" placeholder="EID10" />
      </label>
      <label class="block">
        <span class="label">{{ t('coupons.kind') }}</span>
        <select v-model="form.kind" class="field">
          <option v-for="kind in KINDS" :key="kind" :value="kind">{{ t(`coupons.kinds.${kind}`) }}</option>
        </select>
      </label>
      <label v-if="form.kind !== 'free_delivery'" class="block">
        <span class="label">{{ form.kind === 'percent' ? t('coupons.percent') : t('coupons.amount') }}</span>
        <input v-model="form.value" class="field" type="number" required min="1" :max="form.kind === 'percent' ? 100 : undefined" />
      </label>
      <label class="block">
        <span class="label">{{ t('coupons.endsOn') }}</span>
        <input v-model="form.ends" class="field" type="date" />
      </label>
      <label class="block">
        <span class="label">{{ t('coupons.maxUses') }}</span>
        <input v-model="form.maxUses" class="field" type="number" min="1" :placeholder="t('coupons.noLimit')" />
      </label>
      <div class="col-span-full flex items-center gap-3">
        <button type="submit" class="btn btn-primary" :disabled="adding">
          <PhPlus :size="16"></PhPlus>
          {{ adding ? t('common.saving') : t('coupons.add') }}
        </button>
        <p v-if="addError" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ addError }}
        </p>
      </div>
    </form>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!loaded" class="island overflow-hidden"></SkeletonRows>
    <EmptyState v-else-if="!coupons.length" class="island" :icon="PhTicket" :title="t('coupons.emptyTitle')" :text="t('coupons.emptyText')"></EmptyState>
    <div v-else class="island px-5 py-2 sm:px-8">
      <ul>
        <li v-for="coupon in coupons" :key="coupon.code" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline py-3 last:border-b-0">
          <span class="chip bg-hover font-semibold">{{ coupon.code }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ discount(coupon) }}</span>
            <span class="block text-sm text-ink-soft">
              {{ coupon.max_uses ? t('coupons.usedOf', { n: formatNumber(coupon.used), max: formatNumber(coupon.max_uses) }) : t('coupons.used', { n: formatNumber(coupon.used) }) }}
              &middot;
              {{ coupon.ends_at ? t('coupons.ends', { day: formatDay(coupon.ends_at, timezone) }) : t('coupons.noEnd') }}
            </span>
          </span>
          <button
            type="button"
            class="btn btn-quiet btn-sm"
            :aria-label="t('coupons.delete', { code: coupon.code })"
            :disabled="deleting === coupon.code"
            @click="remove(coupon)"
          >
            <PhTrash :size="16"></PhTrash>
          </button>
        </li>
      </ul>
      <p v-if="rowError" class="flex items-start gap-2 pb-3 text-sm text-danger" role="alert">
        <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
        {{ rowError }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPlus, PhTicket, PhTrash, PhWarningCircle } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import { addCoupon, deleteCoupon, fetchCoupons } from '../../api/coupons.js';
import { formatDay, formatMoney, formatNumber } from '../../lib/format.js';
import { useAgentStore } from '../../stores/agent.js';

const { t } = useI18n();
const agent = useAgentStore();
const timezone = computed(() => agent.config?.timezone || 'Asia/Dhaka');

const KINDS = ['percent', 'amount', 'free_delivery'];
const blank = () => ({ code: '', kind: 'percent', value: '', ends: '', maxUses: '' });

const coupons = ref([]);
const loaded = ref(false);
const loadError = ref(null);
const form = ref(blank());
const adding = ref(false);
const addError = ref(null);
const deleting = ref(null);
const rowError = ref(null);

async function load() {
  loadError.value = null;
  try {
    coupons.value = await fetchCoupons();
    loaded.value = true;
  } catch (error) {
    loadError.value = error.message;
  }
}

function discount(coupon) {
  if (coupon.kind === 'percent') return t('coupons.percentOff', { n: formatNumber(coupon.value) });
  if (coupon.kind === 'amount') return t('coupons.amountOff', { money: formatMoney(coupon.value) });
  return t('coupons.freeDelivery');
}

async function add() {
  const { code, kind, value, ends, maxUses } = form.value;
  adding.value = true;
  addError.value = null;
  try {
    const coupon = await addCoupon({
      code,
      kind,
      // An amount is typed in taka and kept in paisa; free delivery has none.
      value: kind === 'free_delivery' ? 0 : Math.round(Number(value) * (kind === 'amount' ? 100 : 1)),
      // The end of that day in the browser's time is near enough: the backend keeps UTC.
      ends_at: ends ? new Date(`${ends}T23:59:59`).toISOString() : null,
      max_uses: maxUses ? Number(maxUses) : null,
    });
    coupons.value = [...coupons.value, coupon];
    form.value = blank();
  } catch (error) {
    addError.value = error.message; // the backend's own words: a code already taken, a percent over 100
  }
  adding.value = false;
}

async function remove(coupon) {
  deleting.value = coupon.code;
  rowError.value = null;
  try {
    await deleteCoupon(coupon.code);
    coupons.value = coupons.value.filter((c) => c.code !== coupon.code);
  } catch (error) {
    rowError.value = error.message;
  }
  deleting.value = null;
}

load();
agent.load().catch(() => {}); // for the timezone the end dates show in
</script>
