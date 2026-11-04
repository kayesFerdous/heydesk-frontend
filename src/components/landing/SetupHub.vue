<template>
  <!-- Share your link: each channel wires up to the assistant one at a time, and
       messages start travelling down the wires. -->
  <div ref="root" class="hub-box" role="img" :aria-label="t('landing.shots.channels')">
    <svg class="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
      <g v-for="(channel, index) in CHANNELS" :key="channel.id">
        <path :d="wire(channel)" pathLength="1" class="wire" :class="{ 'is-on': step > index }"></path>
        <circle v-if="step > index && !reduce" r="1.3" class="spark">
          <animateMotion :dur="`${1.6 + index * 0.25}s`" repeatCount="indefinite" :path="wire(channel)"></animateMotion>
        </circle>
      </g>
    </svg>
    <p class="hub"><BrandMark mark-only class="hub-mark"></BrandMark></p>
    <div v-for="(channel, index) in CHANNELS" :key="channel.id" class="channel" :class="{ 'is-on': step > index }" :style="{ left: `${channel.x}%`, top: `${channel.y}%` }">
      <span class="channel-tile"><component :is="channel.icon" :size="26" weight="fill"></component></span>
      <span class="text-sm font-semibold whitespace-nowrap">{{ t(`landing.channels.${channel.id}`) }}</span>
      <span class="flex items-center gap-1 text-xs font-medium whitespace-nowrap" :class="step > index ? 'text-success' : 'text-ink-soft'">
        <PhCheckCircle v-if="step > index" :size="14" weight="fill"></PhCheckCircle>
        {{ step > index ? t('connect.connected') : t('channelsPage.setUp') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatCircle, PhCheckCircle, PhMessengerLogo, PhTelegramLogo, PhWhatsappLogo } from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import { useSceneClock } from '../../composables/useSceneClock.js';

// Where each sits, as a percentage of the box.
const CHANNELS = [
  { id: 'web', icon: PhChatCircle, x: 20, y: 18 },
  { id: 'messenger', icon: PhMessengerLogo, x: 80, y: 18 },
  { id: 'whatsapp', icon: PhWhatsappLogo, x: 20, y: 82 },
  { id: 'telegram', icon: PhTelegramLogo, x: 80, y: 82 },
];

const { t } = useI18n();

const wire = ({ x, y }) => `M${x} ${y} C${x} ${(y + 50) / 2} 50 ${(y + 50) / 2} 50 50`;

const root = ref(null);
const { step, reduce } = useSceneClock({ root, times: [350, 500, 500, 500] });
</script>

<style scoped>
.hub-box {
  position: relative;
  margin-inline: auto;
  aspect-ratio: 1;
  width: 100%;
  max-width: 30rem;
}

.wire {
  fill: none;
  stroke: var(--color-hairline);
  stroke-width: 2px;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition:
    stroke-dashoffset 0.6s var(--ease-settle),
    stroke 0.3s;
}

.wire.is-on {
  stroke: var(--color-ink);
  stroke-dashoffset: 0;
}

.spark {
  fill: var(--color-lime);
  stroke: var(--color-ink);
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
}

.hub {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  height: 6rem;
  width: 6rem;
  place-items: center;
  border-radius: 1.75rem;
  background-color: var(--color-night);
  transform: translate(-50%, -50%);
}

.hub-mark {
  height: 3.5rem;
  width: 3.5rem;
}

.channel {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--color-surface);
  padding: 0.5rem;
  transform: translate(-50%, -50%);
  opacity: 0.55;
  transition: opacity 0.3s;
}

.channel.is-on {
  opacity: 1;
}

.channel-tile {
  display: grid;
  height: 3.25rem;
  width: 3.25rem;
  place-items: center;
  border-radius: var(--radius-card);
  background-color: var(--color-hover);
  color: var(--color-ink-soft);
  transition:
    background-color 0.3s,
    color 0.3s;
}

.is-on .channel-tile {
  background-color: var(--color-night);
  color: var(--color-lime);
}

@media (prefers-reduced-motion: reduce) {
  .wire,
  .channel,
  .channel-tile {
    transition: none;
  }
}
</style>
