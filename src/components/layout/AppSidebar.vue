<template>
  <aside class="flex min-h-0 flex-col bg-sidebar">
    <!-- One header, one logo: the HeyDesk mark, then whose desk this is and
         whether it is answering customers. -->
    <router-link
      to="/"
      class="mx-3 mt-3 flex shrink-0 items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-hover"
      :aria-label="t('shell.homeLink', { name: businessName })"
    >
      <BrandMark mark-only></BrandMark>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ businessName }}</span>
        <LiveStatus v-if="showStatus" :paused="auth.isSuspended" :label="t('shell.agentLive')" :breathe="false"></LiveStatus>
        <span v-else class="block text-xs text-ink-soft">{{ auth.isAdmin ? t('shell.platformAdmin') : t('shell.noAgentYet') }}</span>
      </span>
    </router-link>

    <nav class="mt-5 min-h-0 flex-1 overflow-y-auto px-3" :aria-label="t('shell.mainNav')">
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
                {{ formatNumber(item.count) }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="shrink-0 px-3 pt-3 pb-3">
      <!-- The key check an owner makes: what does a customer see? -->
      <button
        v-if="!auth.isAdmin"
        type="button"
        class="btn btn-secondary w-full"
        @click="openTestChat"
      >
        <PhChatCircleDots :size="18" class="text-brand"></PhChatCircleDots>
        {{ t('common.tryYourAgent') }}
      </button>

      <LanguageSwitch class="mt-3 w-full"></LanguageSwitch>

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
:aria-label="t('common.signOut')"
          :title="t('common.signOut')"
          @click="signOut"
        >
          <PhSignOut :size="18"></PhSignOut>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhSignOut, PhChatCircleDots } from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import LiveStatus from '../ui/LiveStatus.vue';
import LanguageSwitch from '../ui/LanguageSwitch.vue';
import { navGroups, isActive } from '../../lib/navigation.js';
import { formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

const emit = defineEmits(['navigate']);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();
const inbox = useInboxStore();
const ui = useUiStore();

const email = computed(() => auth.me?.email ?? '');
const initial = computed(() => email.value.charAt(0).toUpperCase());
const showStatus = computed(() => !auth.isAdmin && agent.hasAgent);
const roleLabel = computed(() => (auth.isAdmin ? t('shell.heyDeskAdmin') : t('shell.owner')));
// The name customers know (from the agent), else the account's name.
const businessName = computed(
  () => agent.config?.business_name || auth.business?.name || 'HeyDesk',
);
const groups = computed(() =>
  navGroups({
    isAdmin: auth.isAdmin,
    preset: agent.kind,
    waitingTotal: inbox.waitingTotal,
    needsHuman: inbox.needsHuman,
  }),
);

// The badges are best effort. If the API is down the pages say so; the
// sidebar just shows no numbers.
if (!auth.isAdmin) {
  inbox.load().catch(() => {});
  agent.loadPresets().catch(() => {});
  agent.load().catch(() => {});
}

function active(item) {
  return isActive(item, route.path);
}

function openTestChat() {
  emit('navigate');
  ui.testSheetOpen = true;
}

function signOut() {
  auth.logout();
  router.replace('/sign-in');
}
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
