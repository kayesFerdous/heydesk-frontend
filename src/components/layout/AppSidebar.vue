<template>
  <aside class="group/sidebar relative flex min-h-0 flex-col bg-surface">
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
    <div class="shrink-0 px-3 pt-3">
      <router-link
        to="/"
        class="flex min-w-0 items-center gap-2.5 rounded-[var(--radius-control)] p-2 transition-colors hover:bg-wash"
        :aria-label="t('shell.homeLink', { name: businessName })"
        :title="collapsed ? businessName : undefined"
      >
        <BrandMark mark-only></BrandMark>
        <span v-if="!collapsed" class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold">{{ businessName }}</span>
          <LiveStatus v-if="showStatus" :paused="auth.isSuspended" :label="t('shell.agentLive')"></LiveStatus>
          <span v-else class="block text-xs text-ink-soft">{{ auth.seesBusiness ? t('shell.noAgentYet') : t('shell.platformAdmin') }}</span>
        </span>
      </router-link>
    </div>

    <nav class="mt-5 min-h-0 flex-1 overflow-y-auto px-3" :aria-label="t('shell.mainNav')">
      <div v-for="(group, index) in groups" :key="index" :class="{ 'mt-6': index > 0 }">
        <p v-if="group.label && !collapsed" class="mb-1 px-2.5 text-xs font-medium text-ink-soft">{{ group.label }}</p>
        <hr v-else-if="group.label" class="mx-2 mb-3 border-hairline" />
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
                <component :is="item.icon" :size="18" :weight="active(item) ? 'fill' : 'regular'" class="nav-icon"></component>
                <span v-if="collapsed && item.count" class="badge" :class="{ 'badge-attention': item.attention }">{{ formatNumber(item.count) }}</span>
              </span>
              <template v-if="!collapsed">
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span v-if="item.count" class="count" :class="{ 'count-attention': item.attention }">
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
        class="btn btn-secondary w-full"
        :class="{ 'btn-icon': collapsed }"
        :aria-label="collapsed ? t('common.tryYourAgent') : undefined"
        :title="collapsed ? t('common.tryYourAgent') : undefined"
        @click="openTestChat"
      >
        <PhChatCircleDots :size="18" class="text-brand"></PhChatCircleDots>
        <template v-if="!collapsed">{{ t('common.tryYourAgent') }}</template>
      </button>

      <!-- The account: who is signed in. It opens a small menu with the
           language, the account page and signing out. -->
      <div ref="accountMenu" class="relative mt-3 border-t border-hairline pt-3">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] p-1 text-left transition-colors hover:bg-wash"
          :class="{ 'justify-center': collapsed, 'bg-brand-tint': route.path === '/account' }"
          :aria-label="collapsed ? t('shell.account') : undefined"
          :title="collapsed ? email : undefined"
          aria-haspopup="menu"
          :aria-expanded="accountOpen"
          @click="accountOpen = !accountOpen"
        >
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand" aria-hidden="true">
            {{ initial }}
          </span>
          <template v-if="!collapsed">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[0.8125rem] font-medium">{{ email }}</span>
              <span class="block text-xs text-ink-soft">{{ roleLabel }}</span>
            </span>
            <PhCaretUpDown :size="16" class="shrink-0 text-ink-faint"></PhCaretUpDown>
          </template>
        </button>

        <transition name="menu">
          <div
            v-if="accountOpen"
            class="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-[var(--radius-panel)] border border-hairline bg-surface p-3 shadow-[var(--shadow-float)]"
            role="menu"
          >
            <p class="truncate text-sm font-semibold">{{ email }}</p>
            <p class="text-xs text-ink-soft">{{ roleLabel }}</p>
            <router-link to="/account" class="menu-item mt-3 -mx-1 !w-[calc(100%+0.5rem)]" role="menuitem">
              <PhUserCircle :size="18" class="text-ink-soft"></PhUserCircle>
              {{ t('shell.accountSettings') }}
            </router-link>
            <button type="button" class="btn btn-quiet mt-1 w-full justify-start border-t border-hairline !rounded-none !px-1 pt-3" role="menuitem" @click="signOut">
              <PhSignOut :size="18"></PhSignOut>
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
import { PhSignOut, PhChatCircleDots, PhCaretLeft, PhCaretRight, PhCaretUpDown, PhUserCircle } from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import LiveStatus from '../ui/LiveStatus.vue';
import { navGroups, isActive } from '../../lib/navigation.js';
import { formatNumber } from '../../lib/format.js';
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
const roleLabel = computed(() => (auth.isAdmin ? t('shell.heyDeskAdmin') : t('shell.owner')));
// The name customers know (from the agent), else the account's name.
const businessName = computed(
  () => agent.config?.business_name || auth.business?.name || 'HeyDesk',
);
const groups = computed(() =>
  navGroups({
    isAdmin: !auth.seesBusiness,
    preset: agent.kind,
    waitingTotal: inbox.waitingTotal,
    needsHuman: inbox.needsHuman,
  }),
);

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
  color: var(--color-brand);
  border-color: var(--color-brand);
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
  gap: 0.625rem;
  height: 2.25rem;
  padding: 0 0.625rem;
  border-radius: var(--radius-control);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-soft);
  transition: background-color 0.15s var(--ease-settle), color 0.15s var(--ease-settle);
}

.nav-item-folded {
  justify-content: center;
  padding: 0;
}

.nav-icon {
  flex-shrink: 0;
  color: var(--color-ink-faint);
  transition: color 0.15s var(--ease-settle);
}

.nav-item:hover {
  color: var(--color-ink);
  background-color: var(--color-wash);
}

.nav-item:hover .nav-icon {
  color: var(--color-ink-soft);
}

/* The page you are on: a cobalt tint, cobalt words and a filled icon. */
.nav-item-active,
.nav-item-active:hover {
  color: var(--color-brand);
  font-weight: 600;
  background-color: var(--color-brand-tint);
}

.nav-item-active .nav-icon,
.nav-item-active:hover .nav-icon {
  color: var(--color-brand);
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
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  background-color: var(--color-ink-soft);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  box-sizing: content-box;
}

.badge-attention {
  background-color: var(--color-attention);
}

@media (pointer: coarse) {
  .nav-item {
    height: 2.75rem;
  }
}
</style>
