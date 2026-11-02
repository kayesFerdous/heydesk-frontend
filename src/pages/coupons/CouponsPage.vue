<template>
  <!-- A shop's coupon codes (backend D133) and offers (D140). The codes are the
       page; the two forms stay closed until a header button opens one. -->
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('coupons.title')" :tip="t('coupons.subtitle')" :subtitle="liveCount ? t('coupons.live', { n: formatNumber(liveCount) }) : ''">
      <!-- Hidden while a form is open, so its own button is the screen's one black one. -->
      <template v-if="!opened" #actions>
        <button type="button" class="btn btn-secondary" @click="open('offer')">
          <PhMegaphone :size="16"></PhMegaphone>
          {{ t('coupons.sendOffer') }}
        </button>
        <button type="button" class="btn btn-primary" @click="open('coupon')">
          <PhPlus :size="16"></PhPlus>
          {{ t('coupons.newCoupon') }}
        </button>
      </template>
    </PageHeader>

    <form v-if="opened === 'coupon'" class="island mb-3 flex flex-col gap-4 p-5 sm:p-6" @submit.prevent="add">
      <h2 class="section-title">{{ t('coupons.newCoupon') }}</h2>
      <div class="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div>
          <label class="label" for="coupon-code">{{ t('coupons.code') }}</label>
          <input id="coupon-code" v-model.trim="form.code" class="field serial uppercase" required minlength="2" maxlength="30" placeholder="EID10" aria-describedby="coupon-code-hint" />
          <p id="coupon-code-hint" class="hint">{{ t('coupons.codeHint') }}</p>
        </div>
        <DiscountPicker v-model:kind="form.kind" v-model:value="form.value" name="coupon-kind"></DiscountPicker>
        <label class="block">
          <span class="label">{{ t('coupons.lastDay') }} <span class="font-normal text-ink-soft">({{ t('coupons.optional') }})</span></span>
          <input v-model="form.ends" class="field" type="date" />
        </label>
        <label class="block sm:max-w-48">
          <span class="label">{{ t('coupons.useLimit') }} <span class="font-normal text-ink-soft">({{ t('coupons.optional') }})</span></span>
          <input v-model="form.maxUses" class="field tabular-nums" type="number" min="1" :placeholder="t('coupons.noLimit')" />
        </label>
      </div>
      <!-- The coupon read back in plain words, so the owner sees what buyers get before saving. -->
      <p v-if="readBack" class="flex items-start gap-2 rounded-[var(--radius-card)] bg-wash px-4 py-3 text-sm">
        <PhChatCircleText :size="18" class="mt-px shrink-0 text-ink-soft"></PhChatCircleText>
        {{ readBack }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? t('common.saving') : t('coupons.add') }}
        </button>
        <button type="button" class="btn btn-quiet" @click="close">{{ t('common.cancel') }}</button>
        <p v-if="addError" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ addError }}
        </p>
      </div>
    </form>

    <!-- An offer goes out at once (backend D140, D163), so the button asks once more. -->
    <form v-if="opened === 'offer'" class="island mb-3 flex flex-col gap-4 p-5 sm:p-6" @submit.prevent="confirmingOffer = true">
      <div>
        <h2 class="section-title">{{ t('coupons.offer.title') }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ t('coupons.offer.intro') }}</p>
      </div>
      <label class="block">
        <span class="label">{{ t('coupons.offer.text') }}</span>
        <textarea v-model="offer.text" class="field" rows="2" required maxlength="500" :placeholder="t('coupons.offer.placeholder')"></textarea>
      </label>
      <div class="flex flex-wrap gap-x-6 gap-y-4">
        <DiscountPicker v-model:kind="offer.kind" v-model:value="offer.value" name="offer-kind"></DiscountPicker>
        <label class="block w-full sm:w-56">
          <span class="label">{{ t('coupons.offer.ends') }}</span>
          <input v-model="offer.ends" class="field" type="datetime-local" required />
        </label>
      </div>
      <fieldset>
        <legend class="label">{{ t('coupons.offer.who') }}</legend>
        <div class="segmented flex-wrap">
          <label
            v-for="hours in WITHIN_HOURS"
            :key="hours"
            class="segment cursor-pointer has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lime/70"
            :class="{ 'segment-active': offer.within === hours }"
          >
            <input v-model="offer.within" type="radio" class="sr-only" name="offer-within" :value="hours" />
            {{ t(`coupons.offer.within.h${hours}`) }}
          </label>
        </div>
        <p v-if="offer.within > 24" class="hint">{{ t('coupons.offer.windowHint') }}</p>
      </fieldset>
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="confirmingOffer">
          <span class="basis-full text-sm font-medium sm:basis-auto">{{ t('coupons.offer.sure', { when: t(`coupons.offer.within.h${offer.within}`) }) }}</span>
          <button type="button" class="btn btn-primary" :disabled="sending" @click="send">
            {{ sending ? t('coupons.offer.sending') : t('coupons.offer.sendNow') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="confirmingOffer = false">{{ t('common.cancel') }}</button>
        </template>
        <template v-else>
          <button type="submit" class="btn btn-primary">
            <PhMegaphone :size="16"></PhMegaphone>
            {{ t('coupons.offer.send') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="close">{{ t('common.cancel') }}</button>
        </template>
        <p v-if="offerError" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ offerError }}
        </p>
      </div>
    </form>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!loaded" class="island overflow-hidden"></SkeletonRows>
    <EmptyState v-else-if="!coupons.length" class="island" :icon="PhTicket" :title="t('coupons.emptyTitle')" :text="t('coupons.emptyText')"></EmptyState>
    <div v-else class="island overflow-hidden pb-2">
      <p v-if="done" class="flex items-start gap-2 border-b border-hairline px-5 py-3 text-sm sm:px-8" role="status">
        <PhCheckCircle :size="18" weight="fill" class="mt-px shrink-0 text-success"></PhCheckCircle>
        {{ done }}
      </p>
      <template v-for="group in groups" :key="group.key">
        <h2 class="day-head">
          {{ t(`coupons.groups.${group.key}`) }}
          <span class="font-medium text-ink-soft tabular-nums">{{ formatNumber(group.coupons.length) }}</span>
        </h2>
        <ul>
          <li
            v-for="coupon in group.coupons"
            :key="coupon.code"
            class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-5 py-3 last:border-b-0 sm:px-8"
          >
            <span class="chip serial bg-hover" :class="group.key === 'ended' ? 'text-ink-soft' : 'text-ink'">{{ coupon.code }}</span>
            <span class="min-w-0 flex-1 basis-40">
              <span class="block text-sm font-semibold" :class="{ 'text-ink-soft': group.key === 'ended' }">{{ discount(coupon.kind, coupon.value) }}</span>
              <span class="block text-[0.8125rem] text-ink-soft tabular-nums">
                {{ uses(coupon) }} &middot; {{ coupon.ends_at ? t('coupons.until', { day: formatDay(coupon.ends_at, timezone) }) : t('coupons.noEnd') }}
                <template v-if="isOffer(coupon)">
                  &middot;
                  <PhMegaphone :size="13" class="inline align-[-2px]"></PhMegaphone>
                  {{ t('coupons.offerCode') }}
                </template>
              </span>
            </span>
            <template v-if="confirming === coupon.code">
              <span class="basis-full text-sm sm:basis-auto">{{ t(group.key === 'live' ? 'coupons.confirmStop' : 'coupons.confirmRemove', { code: coupon.code }) }}</span>
              <span class="ml-auto flex gap-2">
                <button type="button" class="btn btn-danger btn-sm" :disabled="deleting === coupon.code" @click="remove(coupon)">
                  {{ group.key === 'live' ? t('coupons.stopIt') : t('coupons.remove') }}
                </button>
                <button type="button" class="btn btn-quiet btn-sm" @click="confirming = null">{{ t('common.cancel') }}</button>
              </span>
            </template>
            <span v-else class="ml-auto flex items-center gap-2">
              <span class="chip" :class="STATUS_LOOKS[status(coupon)].classes">
                <component :is="STATUS_LOOKS[status(coupon)].icon" :size="13" weight="bold"></component>
                {{ t(`coupons.status.${status(coupon)}`) }}
              </span>
              <button type="button" class="btn btn-quiet btn-sm" @click="confirming = coupon.code">
                {{ group.key === 'live' ? t('coupons.stop') : t('coupons.remove') }}
              </button>
            </span>
          </li>
        </ul>
      </template>
      <p v-if="rowError" class="flex items-start gap-2 px-5 py-3 text-sm text-danger sm:px-8" role="alert">
        <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
        {{ rowError }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCalendarX, PhChatCircleText, PhCheckCircle, PhChecks, PhMegaphone, PhPlus, PhTicket, PhWarningCircle } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import DiscountPicker from '../../components/coupons/DiscountPicker.vue';
import { addCoupon, deleteCoupon, fetchCoupons, sendOffer } from '../../api/coupons.js';
import { formatDay, formatMoney, formatNumber } from '../../lib/format.js';
import { useAgentStore } from '../../stores/agent.js';

const { t } = useI18n();
const agent = useAgentStore();
const timezone = computed(() => agent.config?.timezone || 'Asia/Dhaka');

// Status is an icon plus a word: live in green, the two ways a code stops in grey.
const STATUS_LOOKS = {
  live: { icon: PhCheckCircle, classes: 'bg-success-tint text-success' },
  ended: { icon: PhCalendarX, classes: 'bg-hover text-ink-soft' },
  used_up: { icon: PhChecks, classes: 'bg-hover text-ink-soft' },
};
// How far back an offer reaches (backend D163). Messenger and WhatsApp only take one within 24 hours.
const WITHIN_HOURS = [24, 48, 72, 168];
const blank = () => ({ code: '', kind: 'percent', value: '', ends: '', maxUses: '' });
const blankOffer = () => ({ text: '', kind: 'percent', value: '', ends: '', within: 24 });

const coupons = ref([]);
const loaded = ref(false);
const loadError = ref(null);
const opened = ref(null); // 'coupon', 'offer' or null
const done = ref(''); // what the last form did, over the list
const form = ref(blank());
const adding = ref(false);
const addError = ref(null);
const offer = ref(blankOffer());
const confirmingOffer = ref(false);
const sending = ref(false);
const offerError = ref(null);
const confirming = ref(null); // the code whose Stop is asking once more
const deleting = ref(null);
const rowError = ref(null);

function status(coupon) {
  if (coupon.ends_at && new Date(coupon.ends_at) < new Date()) return 'ended';
  if (coupon.max_uses && coupon.used >= coupon.max_uses) return 'used_up';
  return 'live';
}

// Live codes first, then the ones that stopped working, each group only when it has some.
const groups = computed(() => {
  const live = coupons.value.filter((c) => status(c) === 'live');
  const ended = coupons.value.filter((c) => status(c) !== 'live');
  return [{ key: 'live', coupons: live }, { key: 'ended', coupons: ended }].filter((g) => g.coupons.length);
});
const liveCount = computed(() => groups.value.find((g) => g.key === 'live')?.coupons.length || 0);

// Offers are saved as OFFER1, OFFER2... (backend D140).
const isOffer = (coupon) => /^OFFER\d+$/.test(coupon.code);

// An amount is typed in taka and kept in paisa; free delivery has none.
function minorValue(kind, value) {
  return kind === 'free_delivery' ? 0 : Math.round(Number(value) * (kind === 'amount' ? 100 : 1));
}

function discount(kind, value) {
  if (kind === 'percent') return t('coupons.percentOff', { n: formatNumber(value) });
  if (kind === 'amount') return t('coupons.amountOff', { money: formatMoney(value) });
  return t('coupons.freeDelivery');
}

function uses(coupon) {
  const n = formatNumber(coupon.used);
  if (coupon.max_uses) return t('coupons.usedOf', { n, max: formatNumber(coupon.max_uses) });
  return t('coupons.used', { n }, coupon.used);
}

// The end of that day in the browser's time is near enough: the backend keeps UTC.
const endOfDay = (day) => new Date(`${day}T23:59:59`).toISOString();

const readBack = computed(() => {
  const { code, kind, value, ends, maxUses } = form.value;
  if (!code || (kind !== 'free_delivery' && !value)) return '';
  const lines = [t('coupons.readBack', { code: code.toUpperCase(), discount: discount(kind, minorValue(kind, value)) })];
  if (ends) lines.push(t('coupons.readBackUntil', { day: formatDay(endOfDay(ends), timezone.value) }));
  if (maxUses) lines.push(t('coupons.readBackLimit', { n: formatNumber(maxUses) }, Number(maxUses)));
  return lines.join(' ');
});

function open(which) {
  opened.value = which;
  done.value = '';
}

function close() {
  opened.value = null;
  addError.value = null;
  offerError.value = null;
  confirmingOffer.value = false;
}

async function load() {
  loadError.value = null;
  try {
    coupons.value = await fetchCoupons();
    loaded.value = true;
  } catch (error) {
    loadError.value = error.message;
  }
}

async function add() {
  const { code, kind, value, ends, maxUses } = form.value;
  adding.value = true;
  addError.value = null;
  try {
    const coupon = await addCoupon({
      code,
      kind,
      value: minorValue(kind, value),
      ends_at: ends ? endOfDay(ends) : null,
      max_uses: maxUses ? Number(maxUses) : null,
    });
    coupons.value = [...coupons.value, coupon];
    form.value = blank();
    close();
    done.value = t('coupons.added', { code: coupon.code });
  } catch (error) {
    addError.value = error.message; // the backend's own words: a code already taken, a percent over 100
  }
  adding.value = false;
}

async function send() {
  const { text, kind, value, ends, within } = offer.value;
  sending.value = true;
  offerError.value = null;
  try {
    // The browser reads `ends` in its own time; the backend keeps UTC.
    const sent = await sendOffer({ text, kind, value: minorValue(kind, value), ends_at: new Date(ends).toISOString(), within_hours: within });
    offer.value = blankOffer();
    close();
    done.value = t('coupons.offer.sent', { n: formatNumber(sent.sent_to), code: sent.code });
    load(); // the offer's code is in the list now
  } catch (error) {
    offerError.value = error.message; // the backend's own words: an end already past
    confirmingOffer.value = false;
  }
  sending.value = false;
}

async function remove(coupon) {
  deleting.value = coupon.code;
  rowError.value = null;
  done.value = '';
  try {
    await deleteCoupon(coupon.code);
    coupons.value = coupons.value.filter((c) => c.code !== coupon.code);
  } catch (error) {
    rowError.value = error.message;
  }
  confirming.value = null;
  deleting.value = null;
}

load();
agent.load().catch(() => {}); // for the timezone the end dates show in
</script>
