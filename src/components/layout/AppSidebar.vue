<template>
  <aside class="flex min-h-0 flex-col justify-between bg-rail px-3 py-4 text-white">
    <div>
      <router-link to="/inbox" class="block px-2 py-1.5">
        <brand-mark></brand-mark>
      </router-link>

      <p
        class="mt-5 truncate rounded-[var(--radius-control)] bg-white/5 px-3 py-2.5 text-sm font-medium text-white/90"
      >
        {{ businessName }}
      </p>

      <nav class="mt-5 flex flex-col gap-0.5" aria-label="Main">
        <router-link
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item-active"
        >
          <component :is="item.icon" :size="20" weight="regular"></component>
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.count"
            class="min-w-5 rounded-full px-1.5 text-center text-xs font-semibold"
            :class="
              item.attention
                ? 'bg-attention-tint text-attention'
                : 'bg-white/12 text-white'
            "
          >
            {{ item.count }}
          </span>
        </router-link>
      </nav>
    </div>

    <div>
      <button
        v-if="!isAdmin"
        type="button"
        class="btn btn-primary mb-4 w-full !bg-brand-glow !text-rail hover:!bg-white"
        :class="{ 'lg:!hidden': onAgentPage }"
        @click="$store.commit('ui/setTestSheet', true)"
      >
        <ph-chat-circle-dots :size="20" weight="fill"></ph-chat-circle-dots>
        Talk to your agent
      </button>

      <div class="flex items-center gap-3 border-t border-white/10 px-1 pt-4">
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12 text-sm font-semibold"
          aria-hidden="true"
        >
          {{ initial }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ email }}</p>
          <p class="text-xs text-white/60">{{ roleLabel }}</p>
        </div>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-[var(--radius-control)] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
          title="Sign out"
          @click="signOut"
        >
          <ph-sign-out :size="18"></ph-sign-out>
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
import {
  PhTray,
  PhChatsCircle,
  PhForkKnife,
  PhHeadset,
  PhBooks,
  PhSignOut,
  PhChatCircleDots,
  PhBuildings,
} from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';

export default {
  components: { BrandMark, PhSignOut, PhChatCircleDots },
  computed: {
    me() {
      return this.$store.getters['auth/me'];
    },
    email() {
      return this.me ? this.me.email : '';
    },
    isAdmin() {
      return this.$store.getters['auth/isAdmin'];
    },
    // The Your agent page already has the chat beside it on wide screens.
    onAgentPage() {
      return this.$route.path === '/agent';
    },
    roleLabel() {
      return this.isAdmin ? 'HeyDesk admin' : 'Owner';
    },
    businessName() {
      const business = this.$store.getters['auth/business'];
      return business ? business.name : 'All businesses';
    },
    initial() {
      return this.email.charAt(0).toUpperCase();
    },
    items() {
      if (this.isAdmin) {
        return [{ to: '/admin', label: 'Businesses', icon: PhBuildings }];
      }
      return [
        {
          to: '/inbox',
          label: 'Inbox',
          icon: PhTray,
          count: this.$store.getters['inbox/waitingTotal'],
        },
        {
          to: '/conversations',
          label: 'Conversations',
          icon: PhChatsCircle,
          count: this.$store.getters['inbox/needsHuman'],
          attention: true,
        },
        { to: '/menu', label: this.$store.getters['agent/itemsLabel'], icon: PhForkKnife },
        { to: '/knowledge', label: 'Knowledge', icon: PhBooks },
        { to: '/agent', label: 'Your agent', icon: PhHeadset },
      ];
    },
  },
  created() {
    // The badges are best effort. If the API is down the pages say so; the
    // rail just shows no numbers.
    if (!this.isAdmin) {
      this.$store.dispatch('inbox/load').catch(() => {});
      this.$store.dispatch('agent/loadPresets').catch(() => {});
      this.$store.dispatch('agent/load').catch(() => {});
    }
  },
  methods: {
    signOut() {
      this.$store.dispatch('auth/logout');
      this.$router.replace('/sign-in');
    },
  },
};
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 2.75rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-control);
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(255 255 255 / 0.72);
  transition: background-color 0.2s var(--ease-settle),
    color 0.2s var(--ease-settle);
}

.nav-item:hover {
  color: #fff;
  background-color: rgb(255 255 255 / 0.06);
}

.nav-item-active {
  color: #fff;
  background-color: rgb(255 255 255 / 0.1);
}

.nav-item-active svg {
  color: var(--color-brand-glow);
}
</style>
