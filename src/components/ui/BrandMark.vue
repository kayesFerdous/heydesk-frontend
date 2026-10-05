<template>
  <span class="inline-flex items-center gap-2.5">
    <!-- The mark echoes Gigalogy's logo, a constellation of connected dots:
         here five nodes joined into a speech bubble. -->
    <svg viewBox="0 0 32 32" class="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-brand)" />
      <path
        d="M9 9.5H23V19.5L13 24.5L9 19.5Z"
        fill="none"
        stroke="#fff"
        stroke-opacity=".75"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <g fill="#fff">
        <circle cx="9" cy="9.5" r="2" />
        <circle cx="23" cy="9.5" r="2" />
        <circle cx="23" cy="19.5" r="2" />
        <circle cx="13" cy="24.5" r="2" />
        <circle cx="9" cy="19.5" r="2" />
      </g>
    </svg>
    <span class="text-[1.0625rem] font-semibold tracking-tight">HeyDesk</span>
  </span>
</template>
