<template>
  <div aria-hidden="true">
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center gap-4 border-b border-hairline px-5 py-3.5"
    >
      <span class="skeleton h-10 w-10 !rounded-full"></span>
      <span class="flex-1">
        <span class="skeleton block h-4 w-1/3"></span>
        <span class="skeleton mt-2 block h-3.5 w-2/3"></span>
      </span>
      <span class="skeleton h-6 w-16 !rounded-full"></span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    count: { type: Number, default: 5 },
  },
};
</script>

<style scoped>
.skeleton {
  border-radius: 0.375rem;
  background-color: var(--color-wash);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
