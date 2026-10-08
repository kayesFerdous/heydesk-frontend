<template>
  <aside class="flex min-h-0 flex-col bg-sidebar">
    <!-- One header, one logo: the HeyDesk mark, then whose desk this is and
         whether it is answering customers. -->
    <router-link
      to="/"
      class="mx-3 mt-3 flex shrink-0 items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-hover"
      :aria-label="`${businessName}, home`"
    >
      <brand-mark mark-only></brand-mark>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ businessName }}</span>
        <live-status v-if="showStatus" :paused="suspended" label="Agent live" :breathe="false"></live-status>
        <span v-else class="block text-xs text-ink-soft">{{ isAdmin ? 'Platform admin' : 'No agent yet' }}</span>
      </span>
    </router-link>

    <nav class="mt-5min-h-0 flex-1 overflow-y-auto px-3" aria-label="Main">
      <div v-for="(group, index) in groups" :key="index" :class="{ 'mt-6': index > 0 }">
        <p v-if="group.label" class="mb-1 px-2.5 text-xs font-medium text-ink-soft">{{ group.label }}</p>
        <ul class="flex flex-col gap-px">
          <li v-for="item in group.items" :key="item.to">
            <router-link
              :to="item.to"
              class="nav-item"
              :class="{ 'nav-item-active': active(item) }"
              :aria-current="active(item) ? 'page' : undefined"
              @click="$emit('navigate')"
            >
              <component :is="item.icon" :size="18" class="nav-icon"></component>
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span v-if="item.count" class="count" :class="{ 'count-attention': item.attention }">
                {{ item.count }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="shrink-0 px-3 pt-3 pb-3">
      <!-- The key check an owner makes: what does a customer see? -->
      <button
        v-if="!isAdmin"
        type="button"
        class="btn btn-secondary w-full"
        @click="openTestChat"
      >
        <ph-chat-circle-dots :size="18" class="text-brand"></ph-chat-circle-dots>
        Try your agent
      </button>

      <div class="mt-3 flex items-center gap-2.5 border-t border-hairline px-1 pt-3">
        <span
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover text-xs font-semibold text-ink-soft"
          aria-hidden="true"
        >
          {{ initial }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[0.8125rem] font-medium">{{ email }}</p>
          <p class="text-xs text-ink-soft">{{ roleLabel }}</p>
        </div>
        <button
          type="button"
          class="btn btn-quiet btn-icon !h-8 !w-8"
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
import { PhSignOut, PhChatCircleDots } from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import LiveStatus from '../ui/LiveStatus.vue';
import { navGroups, isActive } from '../../lib/navigation.js';

export default {
  components: { BrandMark, LiveStatus, PhSignOut, PhChatCircleDots },
  emits: ['navigate'],
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
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
    showStatus() {
      return !this.isAdmin && this.$store.getters['agent/hasAgent'];
    },
    roleLabel() {
      return this.isAdmin ? 'HeyDesk admin' : 'Owner';
    },
    // The name customers know (from the agent), else the account's name.
    businessName() {
      const config = this.$store.getters['agent/config'];
      const business = this.$store.getters['auth/business'];
      if (config && config.business_name) return config.business_name;
      return business ? business.name : 'HeyDesk';
    },
    initial() {
      return this.email.charAt(0).toUpperCase();
    },
    groups() {
      return navGroups(this.$store.getters);
    },
  },
  created() {
    // The badges are best effort. If the API is down the pages say so; the
    // sidebar just shows no numbers.
    if (!this.isAdmin) {
      this.$store.dispatch('inbox/load').catch(() => {});
      this.$store.dispatch('agent/loadPresets').catch(() => {});
      this.$store.dispatch('agent/load').catch(() => {});
    }
  },
  methods: {
    active(item) {
      return isActive(item, this.$route.path);
    },
    openTestChat() {
      this.$emit('navigate');
      this.$store.commit('ui/setTestSheet', true);
    },
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
  gap: 0.625rem;
  height: 2.25rem;
  padding: 0 0.625rem;
  border-radius: var(--radius-control);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-soft);
  transition: background-color 0.15s var(--ease-settle), color 0.15s var(--ease-settle);
}

.nav-icon {
  flex-shrink: 0;
  color: var(--color-ink-faint);
  transition: color 0.15s var(--ease-settle);
}

.nav-item:hover {
  color: var(--color-ink);
  background-color: var(--color-hover);
}

/* The page you are on sits on white, lifted off the paper, with a cobalt icon. */
.nav-item-active,
.nav-item-active:hover {
  color: var(--color-ink);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lift), 0 0 0 1px var(--color-hairline);
}

.nav-item-active .nav-icon {
  color: var(--color-brand);
}

@media (pointer: coarse) {
  .nav-item {
    height: 2.75rem;
  }
}
</style>
