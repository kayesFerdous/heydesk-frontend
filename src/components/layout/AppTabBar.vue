<template>
  <!-- On a phone: the daily screens one thumb away, everything else under More
       (which opens the full sidebar as a drawer). -->
  <nav
    class="fixed inset-x-0 bottom-0 z-20 flex border-t border-hairline bg-surface/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
    aria-label="Main"
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
        <span v-if="item.count" class="badge" :class="{ 'badge-attention': item.attention }">{{ item.count }}</span>
      </span>
      <span>{{ item.short || item.label }}</span>
    </router-link>
    <button type="button" class="tab-item" @click="$store.commit('ui/setNav', true)">
      <ph-list :size="22"></ph-list>
      <span>More</span>
    </button>
  </nav>
</template>

<script>
import { PhList } from '@phosphor-icons/vue';

import { navGroups, isActive } from '../../lib/navigation.js';

export default {
  components: { PhList },
  computed: {
    // The first group (daily work) plus the agent's settings.
    items() {
      const groups = navGroups(this.$store.getters);
      const daily = groups[0].items;
      const settings = groups[1] ? groups[1].items.slice(0, 1) : [];
      return [...daily, ...settings];
    },
  },
  methods: {
    active(item) {
      return isActive(item, this.$route.path);
    },
  },
};
</script>

<style scoped>
.tab-item {
  display: flex;
  flex: 1;
  min-height: 3rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  border-radius: var(--radius-control);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-ink-soft);
}

.tab-item-active {
  color: var(--color-brand);
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
  background-color: var(--color-brand);
  color: #fff;
  font-size: 0.625rem;
}

.badge-attention {
  background-color: var(--color-attention);
}
</style>
