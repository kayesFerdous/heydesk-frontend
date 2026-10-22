<template>
  <aside class="group/sidebar relative flex min-h-0 flex-col bg-night text-white">
    <!-- Fold or unfold: a small handle sitting on the sidebar's edge, shown
         while the pointer is over the sidebar (or the handle has focus). -->
    <button
      v-if="collapsible"
      type="button"
      class="edge-toggle"
      :aria-label="collapsed ? t('shell.expand') : t('shell.collapse')"
      :title="collapsed ? t('shell.expand') : t('shell.collapse')"
      :aria-expanded="!collapsed"
      @click="ui.sidebarCollapsed = !collapsed"
    >
      <component :is="collapsed ? PhCaretRight : PhCaretLeft" :size="12" weight="bold"></component>
    </button>

    <!-- One header, one logo: the HeyDesk mark, then whose desk this is and
         whether it is answering customers. Folded, only the mark stays. -->
    <div class="shrink-0 px-3 pt-4">
      <router-link
        to="/"
        class="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] p-1.5 transition-colors hover:bg-night-tile"
        :class="{ 'justify-center': collapsed }"
        :aria-label="t('shell.homeLink', { name: businessName })"
        :title="collapsed ? businessName : undefined"
      >
        <BrandMark mark-only class="!h-10 !w-10"></BrandMark>
        <span v-if="!collapsed" class="min-w-0 flex-1">
          <span class="block truncate text-[0.9375rem] font-bold">{{ businessName }}</span>
          <span v-if="showStatus" class="flex items-center gap-1.5 text-xs font-medium text-night-soft">
            <span class="h-2 w-2 shrink-0 rounded-full" :class="auth.isSuspended ? 'bg-attention-bright' : 'bg-lime'" aria-hidden="true"></span>
            {{ auth.isSuspended ? t('common.pausedByHeyDesk') : t('shell.agentLive') }}
          </span>
          <span v-else class="block text-xs text-night-soft">{{ auth.seesBusiness ? t('shell.noAgentYet') : t('shell.platformAdmin') }}</span>
        </span>
      </router-link>
    </div>

    <!-- What is waiting, one tile per job plus the customers who asked for a
         person: the first thing an owner looks for, one click from its list. -->
    <!-- On a short screen the nav needs the room; its counts say the same. -->
    <ul v-if="tiles.length && !collapsed" class="mt-4 grid shrink-0 grid-cols-2 gap-2 px-3 [@media(max-height:50rem)]:hidden">
      <li v-for="(tile, index) in tiles" :key="tile.to" :class="{ 'col-span-2': tiles.length % 2 && index === tiles.length - 1 }">
        <router-link :to="tile.to" class="tile" @click="$emit('navigate')">
          <span class="flex items-start justify-between gap-2">
            <component :is="tile.icon" :size="20" class="mt-0.5 text-night-soft"></component>
            <span class="text-[1.625rem] leading-none font-bold" :class="{ 'text-attention-bright': tile.attention && tile.count }">
              {{ formatNumber(tile.count) }}
            </span>
          </span>
          <span class="mt-2 block truncate text-xs font-medium text-night-soft">{{ tile.label }}</span>
        </router-link>
      </li>
    </ul>

    <nav class="mt-4 min-h-0 flex-1 overflow-y-auto px-3" :aria-label="t('shell.mainNav')">
      <div v-for="(group, index) in groups" :key="index" :class="{ 'mt-5': index > 0 }">
        <p v-if="group.label && !collapsed" class="mb-1 px-3 text-xs font-medium text-night-soft">{{ group.label }}</p>
        <hr v-else-if="group.label" class="mx-3 mb-3 border-night-tile" />
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in group.items" :key="item.to">
            <router-link
              :to="item.to"
              class="nav-item"
              :class="{ 'nav-item-active': active(item), 'nav-item-folded': collapsed }"
              :aria-current="active(item) ? 'page' : undefined"
              :aria-label="collapsed ? item.label : undefined"
              :title="collapsed ? item.label : undefined"
              @click="$emit('navigate')"
            >
              <span class="relative grid place-items-center">
                <component :is="item.icon" :size="20" :weight="active(item) ? 'fill' : 'regular'" class="nav-icon"></component>
                <span v-if="collapsed && item.count" class="badge" :class="{ 'badge-attention': item.attention }">{{ formatNumber(item.count) }}</span>
              </span>
              <template v-if="!collapsed">
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span v-if="item.count" class="nav-count" :class="{ 'nav-count-attention': item.attention }">
                  {{ formatNumber(item.count) }}
                </span>
              </template>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="shrink-0 p-3">
      <!-- The key check an owner makes: what does a customer see? -->
      <button
        v-if="auth.seesBusiness"
        type="button"
        class="btn w-full bg-night-tile text-white hover:bg-[color-mix(in_srgb,var(--color-night-tile),white_8%)]"
        :class="{ 'btn-icon': collapsed }"
        :aria-label="collapsed ? t('common.tryYourAgent') : undefined"
        :title="collapsed ? t('common.tryYourAgent') : undefined"
        @click="openTestChat"
      >
        <PhChatCircleDots :size="18" weight="fill" class="text-lime"></PhChatCircleDots>
        <template v-if="!collapsed">{{ t('common.tryYourAgent') }}</template>
      </button>

      <!-- The account: who is signed in. It opens a small menu with the
           language, the account page and signing out. -->
      <div ref="accountMenu" class="relative mt-3 border-t border-night-tile pt-3">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-full p-1 text-left transition-colors hover:bg-night-tile"
          :class="{ 'justify-center': collapsed, 'bg-night-tile': route.path === '/account' }"
          :aria-label="collapsed ? t('shell.account') : undefined"
          :title="collapsed ? email : undefined"
          aria-haspopup="menu"
          :aria-expanded="accountOpen"
          @click="accountOpen = !accountOpen"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-tile text-sm font-bold text-white" aria-hidden="true">
            {{ initial }}
          </span>
          <template v-if="!collapsed">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[0.8125rem] font-semibold">{{ email }}</span>
              <span class="block text-xs text-night-soft">{{ roleLabel }}</span>
            </span>
            <PhCaretUpDown :size="16" class="shrink-0 text-night-soft"></PhCaretUpDown>
          </template>
        </button>

        <transition name="menu">
          <div
            v-if="accountOpen"
            class="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-[var(--radius-card)] border border-hairline bg-surface p-3 text-ink shadow-[var(--shadow-float)]"
            role="menu"
          >
            <p class="truncate text-sm font-semibold">{{ email }}</p>
            <p class="text-xs text-ink-soft">{{ roleLabel }}</p>
            <router-link to="/account" class="menu-item mt-3 -mx-1 !w-[calc(100%+0.5rem)]" role="menuitem">
              <PhUserCircle :size="18" class="text-ink-soft"></PhUserCircle>
              {{ t('shell.accountSettings') }}
            </router-link>
            <button type="button" class="menu-item -mx-1 mt-1 !w-[calc(100%+0.5rem)]" role="menuitem" @click="signOut">
              <PhSignOut :size="18" class="text-ink-soft"></PhSignOut>
              {{ t('common.signOut') }}
            </button>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhSignOut,
  PhChatCircleDots,
  PhCaretLeft,
  PhCaretRight,
  PhCaretUpDown,
  PhUserCircle,
  PhUserSound,
} from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import { navGroups, isActive } from '../../lib/navigation.js';
import { jobIcon, jobTab } from '../../lib/records.js';
import { formatNumber } from '../../lib/format.js';
import { roleName } from '../../lib/team.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';
import { usePopover } from '../../composables/usePopover.js';

const props = defineProps({
  // The desktop sidebar can fold to icons; the phone drawer cannot.
  collapsible: { type: Boolean, default: false },
});
const emit = defineEmits(['navigate']);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();
const inbox = useInboxStore();
const ui = useUiStore();

const collapsed = computed(() => props.collapsible && ui.sidebarCollapsed);
const email = computed(() => auth.me?.email ?? '');
const initial = computed(() => email.value.charAt(0).toUpperCase());
const showStatus = computed(() => auth.seesBusiness && agent.hasAgent);
const roleLabel = computed(() => roleName(auth.me?.role));
// The name customers know (from the agent), else the account's name.
const businessName = computed(
  () => (auth.seesBusiness && (agent.config?.business_name || auth.business?.name)) || 'HeyDesk',
);
const groups = computed(() =>
  navGroups({
    isAdmin: !auth.seesBusiness,
    canManage: auth.canManage,
    preset: agent.kind,
    waitingTotal: inbox.waitingTotal,
    needsHuman: inbox.needsHuman,
  }),
);

// One tile per job ("Orders 4") and one for customers waiting for a person.
const tiles = computed(() => {
  if (!showStatus.value || !inbox.loaded) return [];
  return [
    ...inbox.jobs.map((job) => ({ to: `/inbox?job=${job.job}`, label: jobTab(job.job), count: job.waiting, icon: jobIcon(job.job) })),
    {
      to: '/conversations?filter=needs_human',
      label: t('status.needs_human'),
      count: inbox.needsHuman,
      icon: PhUserSound,
      attention: true,
    },
  ];
});

// The badges are best effort. If the API is down the pages say so; the
// sidebar just shows no numbers. Loaded for the business on screen, and again
// when an admin opens another one.
watch(
  () => auth.seesBusiness && (auth.viewing?.id ?? 'own'),
  (business) => {
    if (!business) return;
    inbox.load().catch(() => {});
    agent.loadPresets().catch(() => {});
    agent.load().catch(() => {});
  },
  { immediate: true },
);

function active(item) {
  return isActive(item, route.path);
}

function openTestChat() {
  emit('navigate');
  ui.testSheetOpen = true;
}

// The account menu; going to another page closes it too.
const { open: accountOpen, root: accountMenu } = usePopover();
watch(() => route.fullPath, () => (accountOpen.value = false));

function signOut() {
  auth.logout();
  router.replace('/sign-in');
}
</script>

<style scoped>
/* The fold handle: a small round button straddling the sidebar's right rule. */
.edge-toggle {
  position: absolute;
  top: 1.75rem;
  right: -0.75rem;
  z-index: 20;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background-color: var(--color-surface);
  color: var(--color-ink-soft);
  box-shadow: var(--shadow-lift);
  opacity: 0;
  transition: opacity 0.15s var(--ease-settle), color 0.15s var(--ease-settle), border-color 0.15s var(--ease-settle);
}

.group\/sidebar:hover .edge-toggle,
.edge-toggle:focus-visible {
  opacity: 1;
}

.edge-toggle:hover {
  color: var(--color-ink);
  border-color: var(--color-ink);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s var(--ease-settle), transform 0.15s var(--ease-settle);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active,
  .menu-leave-active {
    transition: none;
  }
}

/* Touch screens have no hover: the handle stays visible. */
@media (hover: none) {
  .edge-toggle {
    opacity: 1;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 2.75rem;
  padding: 0 0.875rem;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-night-soft);
  transition: background-color 0.15s var(--ease-settle), color 0.15s var(--ease-settle);
}

.nav-item-folded {
  justify-content: center;
  padding: 0;
}

.nav-icon {
  flex-shrink: 0;
  transition: color 0.15s var(--ease-settle);
}

.nav-item:hover {
  color: #fff;
  background-color: var(--color-night-tile);
}

/* The page you are on: a lime pill, black words, a filled icon. */
.nav-item-active,
.nav-item-active:hover {
  color: var(--color-ink);
  font-weight: 700;
  background-color: var(--color-lime);
}

.nav-count {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background-color: var(--color-night-tile);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.nav-item-active .nav-count {
  background-color: var(--color-ink);
}

.nav-count-attention,
.nav-item-active .nav-count-attention {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}

/* A count tile: what waits in one list, the number big and bottom right. */
.tile {
  display: block;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-card);
  background-color: var(--color-night-tile);
  transition: background-color 0.15s var(--ease-settle);
}

.tile:hover {
  background-color: color-mix(in srgb, var(--color-night-tile), white 8%);
}

/* A count on a folded item sits on the icon's corner. */
.badge {
  position: absolute;
  top: -0.5rem;
  right: -0.625rem;
  display: grid;
  place-items: center;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border: 2px solid var(--color-night);
  border-radius: 999px;
  background-color: var(--color-night-tile);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  box-sizing: content-box;
}

.nav-item-active .badge {
  border-color: var(--color-lime);
  background-color: var(--color-ink);
}

.badge-attention,
.nav-item-active .badge-attention {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}
</style>
