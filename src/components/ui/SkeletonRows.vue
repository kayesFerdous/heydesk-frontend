<template>
  <!-- Loading, in the shape of a list of rows: avatar, two lines, a chip. -->
  <div aria-hidden="true">
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center gap-3 border-b border-hairline px-5 py-3.5 sm:px-8"
    >
      <span class="skeleton h-9 w-9 shrink-0 !rounded-full"></span>
      <span class="flex-1">
        <span class="skeleton block h-3.5 w-1/3"></span>
        <span class="skeleton mt-2 block h-3 w-2/3"></span>
      </span>
      <span class="skeleton h-5 w-16 !rounded-full"></span>
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
