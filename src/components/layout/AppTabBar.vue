<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 flex border-t border-hairline bg-surface px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    aria-label="Main"
  >
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tab"
      active-class="tab-active"
    >
      <component :is="item.icon" :size="24"></component>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script>
import { listLinks } from '../../lib/presets.js';
import {
  PhTray,
  PhChatsCircle,
  PhHeadset,
  PhBooks,
  PhBuildings,
} from '@phosphor-icons/vue';

export default {
  computed: {
    items() {
      if (this.$store.getters['auth/isAdmin']) {
        return [{ to: '/admin', label: 'Businesses', icon: PhBuildings }];
      }
      return [
        { to: '/inbox', label: 'Inbox', icon: PhTray },
        { to: '/conversations', label: 'Chats', icon: PhChatsCircle },
        ...listLinks(this.$store.getters['agent/config'] && this.$store.getters['agent/config'].preset),
        { to: '/knowledge', label: 'Docs', icon: PhBooks },
        { to: '/agent', label: 'Agent', icon: PhHeadset },
      ];
    },
  },
};
</script>

<style scoped>
.tab {
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

.tab-active {
  color: var(--color-brand);
}
</style>
