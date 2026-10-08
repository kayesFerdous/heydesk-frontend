<template>
  <div class="grid min-h-dvh place-items-center bg-surface p-6">
    <div class="max-w-sm text-center">
      <brand-mark mark-only class="justify-center"></brand-mark>
      <h1 class="mt-6 text-xl font-semibold tracking-[-0.01em]">We could not find that page</h1>
      <p class="mt-2 text-sm text-ink-soft">
        The link may be old, or the page may have moved.
      </p>
      <router-link to="/" class="btn btn-primary mt-6">Go to Home</router-link>
    </div>
  </div>
</template>

<script>
import BrandMark from '../components/ui/BrandMark.vue';

export default {
  components: { BrandMark },
};
</script>
