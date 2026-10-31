<template>
  <!-- On a phone: the daily screens one thumb away, everything else under More
       (which opens the full sidebar as a drawer). -->
  <nav
    class="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex gap-1 rounded-full bg-night p-1.5 shadow-[var(--shadow-float)]"
    :aria-label="t('shell.mainNav')"
  >
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tab-item"
      :class="{ 'tab-item-active': active(item) }"
      :aria-current="active(item) ? 'page' : undefined"
    >
      <span class="relative">
        <component :is="item.icon" :size="22" :weight="active(item) ? 'fill' : 'regular'"></component>
        <span v-if="item.count" class="badge" :class="{ 'badge-attention': item.attention }">{{ formatNumber(item.count) }}</span>
      </span>
      <span>{{ item.short || item.label }}</span>
    </router-link>
    <button type="button" class="tab-item" @click="ui.navOpen = true">
      <PhList :size="22"></PhList>
      <span>{{ t('nav.more') }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhList } from '@phosphor-icons/vue';

import { navGroups, isActive } from '../../lib/navigation.js';
import { formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();
const inbox = useInboxStore();
const ui = useUiStore();

// The first group: the daily work.
const items = computed(() => {
  const groups = navGroups({
    isAdmin: !auth.seesBusiness,
    canManage: auth.canManage,
    preset: agent.kind,
    waitingTotal: inbox.waitingTotal,
    needsHuman: inbox.needsHuman,
  });
  return groups[0].items;
});

function active(item) {
  return isActive(item, route.path);
}
</script>

<style scoped>
.tab-item {
  display: flex;
  flex: 1;
  min-height: 3.25rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-night-soft);
}

/* The page you are on: a lime pill, like the sidebar. */
.tab-item-active {
  background-color: var(--color-lime);
  color: var(--color-ink);
}

.badge {
  position: absolute;
  top: -0.25rem;
  right: -0.625rem;
  display: grid;
  min-width: 1rem;
  height: 1rem;
  place-items: center;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background-color: var(--color-night-tile);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
}

.tab-item-active .badge {
  background-color: var(--color-ink);
}

.badge-attention,
.tab-item-active .badge-attention {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}
</style>
