<template>
  <!-- A pretend website with the chat bubble on it, drawn from the form as the
       owner edits, before anything is saved (backend D82). Click the bubble
       to see the chat open and closed, as a customer would. -->
  <div class="overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-wash" :style="{ '--c': colour, '--on': onColour }">
    <div class="flex items-center gap-1.5 border-b border-hairline bg-surface px-3 py-2" aria-hidden="true">
      <span class="h-2.5 w-2.5 rounded-full bg-hover"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-hover"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-hover"></span>
      <span class="ml-3 rounded-full bg-wash px-3 py-0.5 text-[0.6875rem] text-ink-faint">{{ t('bubble.yourWebsite') }}</span>
    </div>

    <div class="relative h-[30rem]">
      <!-- Their website, as grey lines. -->
      <div class="space-y-3 p-6" aria-hidden="true">
        <span class="block h-5 w-40 rounded bg-hover"></span>
        <span class="block h-3 w-full max-w-sm rounded bg-hover"></span>
        <span class="block h-3 w-3/4 max-w-xs rounded bg-hover"></span>
        <div class="flex gap-3 pt-3">
          <span class="block h-24 w-28 rounded-[var(--radius-control)] bg-hover"></span>
          <span class="block h-24 w-28 rounded-[var(--radius-control)] bg-hover"></span>
        </div>
      </div>

      <!-- The chat window. -->
      <div
        class="window absolute bottom-[5.25rem] flex w-[17.5rem] flex-col overflow-hidden rounded-2xl bg-surface"
        :class="[side === 'left' ? 'left-4 origin-bottom-left' : 'right-4 origin-bottom-right', { shut: !open }]"
        :aria-hidden="!open"
      >
        <div class="flex items-center gap-2.5 px-3 py-2.5" :style="{ background: 'var(--c)', color: 'var(--on)' }">
          <img v-if="logo" :src="logo" alt="" class="h-8 w-8 shrink-0 rounded-full bg-white object-cover" />
          <span v-else class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-semibold">{{ initials(name) }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[0.8125rem] leading-tight font-semibold">{{ name }}</p>
            <p class="text-[0.6875rem] opacity-85">{{ t('chat.repliesInstantly') }}</p>
          </div>
          <PhX :size="14" weight="bold" aria-hidden="true"></PhX>
        </div>
        <div class="flex-1 space-y-2.5 px-3 py-3">
          <p class="text-[0.75rem] leading-relaxed text-ink">{{ greeting }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(starter, i) in shownStarters"
              :key="i"
              class="rounded-full border border-line-strong px-2.5 py-1 text-[0.6875rem] font-medium text-ink"
            >
              {{ starter }}
            </span>
          </div>
        </div>
        <div class="m-2.5 mt-0 flex items-center justify-between rounded-[var(--radius-control)] border border-line-strong px-2.5 py-2 text-[0.6875rem] text-ink-faint">
          {{ t('chat.typeMessage') }}
          <PhArrowUp :size="12" weight="bold"></PhArrowUp>
        </div>
      </div>

      <!-- The line that pops out of the bubble. -->
      <div
        v-if="nudge.trim() && !open"
        class="nudge absolute bottom-[5.25rem] max-w-[13rem] bg-surface px-3 py-2 text-[0.75rem] text-ink"
        :class="side === 'left' ? 'left-4 rounded-[0.875rem_0.875rem_0.875rem_0.25rem]' : 'right-4 rounded-[0.875rem_0.875rem_0.25rem_0.875rem]'"
      >
        {{ nudge }}
      </div>

      <button
        type="button"
        class="bubble absolute bottom-4 grid h-14 w-14 place-items-center overflow-hidden rounded-full"
        :class="side === 'left' ? 'left-4' : 'right-4'"
        :style="{ background: 'var(--c)', color: 'var(--on)' }"
        :aria-label="open ? t('bubble.previewClose') : t('bubble.previewOpen')"
        @click="open = !open"
      >
        <PhX v-if="open" :size="22" weight="bold"></PhX>
        <img v-else-if="logo" :src="logo" alt="" class="h-full w-full bg-white object-cover" />
        <PhChatCircleDots v-else :size="28" weight="fill"></PhChatCircleDots>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowUp, PhChatCircleDots, PhX } from '@phosphor-icons/vue';

import { initials } from '../../lib/group.js';
import { isLight } from '../../lib/colour.js';

const props = defineProps({
  colour: { type: String, required: true },
  side: { type: String, default: 'right' },
  nudge: { type: String, default: '' },
  starters: { type: Array, default: () => [] },
  logo: { type: String, default: '' },
  name: { type: String, default: '' },
  greeting: { type: String, default: '' },
});
const { t } = useI18n();

const open = ref(true);
const onColour = computed(() => (/^#[0-9a-f]{6}$/i.test(props.colour) && isLight(props.colour) ? 'var(--color-ink)' : 'white'));
const shownStarters = computed(() => props.starters.filter((s) => s.trim()));
</script>

<style scoped>
.window {
  box-shadow: 0 18px 48px rgb(11 26 51 / 0.16), 0 3px 10px rgb(11 26 51 / 0.06);
  transition:
    opacity 0.2s,
    transform 0.4s var(--ease-settle);
}

.window.shut {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
  pointer-events: none;
}

.nudge {
  box-shadow: 0 10px 28px rgb(11 26 51 / 0.14), 0 1px 3px rgb(11 26 51 / 0.08);
  animation: pop 0.4s var(--ease-settle) both;
}

.bubble {
  box-shadow: 0 8px 22px rgb(11 26 51 / 0.2), 0 2px 6px rgb(11 26 51 / 0.12);
  transition: transform 0.3s var(--ease-settle);
}

.bubble:hover {
  transform: scale(1.06);
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .window,
  .bubble,
  .nudge {
    transition: none;
    animation: none;
  }
}
</style>
