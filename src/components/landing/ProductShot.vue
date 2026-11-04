<template>
  <!-- A real screen from the app, taken on an example shop (public/landing/,
       one folder per language). On a phone, `phone` swaps in the same screen as
       a phone shows it. -->
  <picture class="block">
    <source v-if="phone" media="(max-width: 767px)" :srcset="src(`${name}-phone`)" width="1170" height="2532" />
    <img :src="src(name)" :alt="alt" width="2880" height="1800" :loading="eager ? 'eager' : 'lazy'" decoding="async" class="block h-auto w-full" />
  </picture>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  name: { type: String, required: true },
  alt: { type: String, required: true },
  phone: { type: Boolean, default: false },
  eager: { type: Boolean, default: false },
});

const { locale } = useI18n();
const src = (file) => `/landing/${locale.value}/${file}.webp`;
</script>
