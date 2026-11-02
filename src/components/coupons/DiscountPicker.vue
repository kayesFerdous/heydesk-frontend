<template>
  <!-- What a coupon or an offer takes off: the three kinds as a switch, then the
       amount with its unit beside it. Free delivery has no amount. -->
  <fieldset>
    <legend class="label">{{ t('coupons.discount') }}</legend>
    <div class="flex flex-wrap items-center gap-2">
      <div class="segmented">
        <label
          v-for="option in KINDS"
          :key="option"
          class="segment cursor-pointer has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lime/70"
          :class="{ 'segment-active': kind === option }"
        >
          <input v-model="kind" type="radio" class="sr-only" :name="name" :value="option" />
          {{ t(`coupons.kinds.${option}`) }}
        </label>
      </div>
      <label v-if="kind !== 'free_delivery'" class="relative w-32">
        <span class="sr-only">{{ kind === 'percent' ? t('coupons.percentValue') : t('coupons.amountValue') }}</span>
        <span class="pointer-events-none absolute inset-y-0 grid place-items-center text-sm text-ink-soft" :class="kind === 'percent' ? 'right-3' : 'left-3'" aria-hidden="true">
          {{ kind === 'percent' ? '%' : '৳' }}
        </span>
        <input
          v-model="value"
          class="field tabular-nums"
          :class="kind === 'percent' ? 'pr-8' : 'pl-7'"
          type="number"
          required
          min="1"
          :max="kind === 'percent' ? 100 : undefined"
        />
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  // Keeps the radios of two pickers on one page apart.
  name: { type: String, required: true },
});

const kind = defineModel('kind', { type: String, required: true });
const value = defineModel('value', { type: [String, Number], default: '' });

const { t } = useI18n();
const KINDS = ['percent', 'amount', 'free_delivery'];
</script>
