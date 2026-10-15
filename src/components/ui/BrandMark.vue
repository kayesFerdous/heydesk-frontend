<template>
  <!-- The HeyDesk logo: an h that speaks. The foot of the h is a speech
       bubble's tail, and its counter is the open front of a desk.
       The files live in public/brand/ (made in ../heydesk/brand/).
       Full: the mark and the "heydesk" wordmark, on the front door pages.
       markOnly: the app icon tile, where the name already sits beside it. -->
  <img
    v-if="markOnly"
    src="/brand/heydesk-icon.svg"
    alt=""
    width="32"
    height="32"
    class="h-8 w-8 shrink-0"
  />
  <img
    v-else
    src="/brand/heydesk-logo.svg"
    alt="HeyDesk"
    width="118"
    height="26"
    class="h-[26px] w-auto shrink-0"
  />
</template>

<script setup>
defineProps({
  markOnly: { type: Boolean, default: false },
});
</script>
