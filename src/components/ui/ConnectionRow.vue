<template>
  <!-- One thing the business connects (a channel, a payment account, a courier)
       as a ruled row: its logo, its name over one quiet line, and whether it is
       connected. The whole row opens what connects, shares or changes it. The
       body stays mounted (v-show) so what sits in it can ask for its own state. -->
  <li class="border-b border-hairline last:border-b-0">
    <button type="button" class="group flex w-full items-center gap-4 py-5 text-left" :aria-expanded="open" :aria-controls="`connection-${id}`" @click="$emit('toggle')">
      <!-- A brand's own mark on white, or a Phosphor icon on its tint. -->
      <span v-if="image" class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-card)] border border-hairline bg-surface">
        <img :src="image" alt="" class="h-6 w-6 object-contain" />
      </span>
      <!-- Either of two brands (a courier not yet picked): both marks, one over the other's corner. -->
      <span v-else-if="images.length" class="relative h-10 w-10 shrink-0">
        <span
          v-for="(src, i) in images"
          :key="src"
          class="absolute grid h-7 w-7 place-items-center rounded-full border border-hairline bg-surface"
          :class="i ? 'right-0 bottom-0' : 'top-0 left-0'"
        >
          <img :src="src" alt="" class="h-4 w-4 object-contain" />
        </span>
      </span>
      <span v-else class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-card)]" :class="tile">
        <component :is="icon" :size="20" :weight="weight"></component>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[0.9375rem] font-semibold tracking-[-0.01em]">{{ name }}</span>
        <span class="mt-0.5 block text-sm break-words text-ink-soft sm:truncate">{{ line }}</span>
      </span>
      <span v-if="live === null" class="skeleton h-5 w-20" aria-hidden="true"></span>
      <span v-else-if="live && problem" class="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-danger">
        <PhWarningCircle :size="16" weight="fill"></PhWarningCircle>
        {{ problem }}
      </span>
      <span v-else-if="live" class="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-success">
        <PhCheckCircle :size="16" weight="fill"></PhCheckCircle>
        {{ liveLabel || t('connect.connected') }}
      </span>
      <span v-else-if="!open" class="btn btn-secondary btn-sm shrink-0">{{ t('channelsPage.setUp') }}</span>
      <PhCaretDown :size="16" weight="bold" class="shrink-0 text-ink-faint transition-transform duration-200 group-hover:text-ink" :class="{ 'rotate-180': open }" aria-hidden="true"></PhCaretDown>
    </button>
    <div v-show="open" :id="`connection-${id}`" class="pb-6 sm:pl-14">
      <slot></slot>
    </div>
  </li>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhCaretDown, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue';

defineProps({
  id: { type: String, required: true },
  // A brand's logo file (public/logos/), or else an icon on a tile of these colours.
  image: { type: String, default: '' },
  images: { type: Array, default: () => [] },
  icon: { type: [Object, Function], default: null },
  tile: { type: String, default: '' },
  weight: { type: String, default: 'fill' },
  name: { type: String, required: true },
  line: { type: String, required: true },
  // null while it is still being asked for.
  live: { type: null, default: null },
  liveLabel: { type: String, default: '' },
  // Connected but stuck: said in place of "Connected".
  problem: { type: String, default: '' },
  open: { type: Boolean, default: false },
});
defineEmits(['toggle']);

const { t } = useI18n();
</script>
