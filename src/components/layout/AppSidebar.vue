<template>
  <aside class="group/sidebar relative flex min-h-0 flex-col bg-night text-white">
    <!-- One header, one logo: the HeyDesk mark, then whose desk this is and
         whether it is answering customers. Folded, only the mark stays. -->
    <div class="shrink-0 px-3 pt-3">
      <router-link
        to="/"
        class="flex min-w-0 items-center gap-2.5 rounded-[var(--radius-card)] p-1 transition-colors hover:bg-night-tile"
        :class="{ 'justify-center': collapsed }"
        :aria-label="t('shell.homeLink', { name: businessName })"
        :title="collapsed ? businessName : undefined"
      >
        <BrandMark mark-only class="!h-9 !w-9"></BrandMark>
        <span v-if="!collapsed" class="min-w-0 flex-1">
          <span class="block truncate text-sm font-bold">{{ businessName }}</span>
          <span v-if="showStatus" class="flex items-center gap-1.5 text-xs font-medium text-night-soft">
            <span class="h-2 w-2 shrink-0 rounded-full" :class="auth.isSuspended ? 'bg-attention-bright' : 'bg-lime'" aria-hidden="true"></span>
            {{ auth.isSuspended ? t('common.pausedByHeyDesk') : t('shell.agentLive') }}
          </span>
          <span v-else class="block text-xs text-night-soft">{{ auth.seesBusiness ? t('shell.noAgentYet') : t('shell.platformAdmin') }}</span>
        </span>
      </router-link>
    </div>

    <!-- A customer waiting for a person is the one thing that cannot wait, so
         it gets a strip of its own, only while someone waits. The other
         counts sit beside their pages in the nav. -->
    <router-link
      v-if="showStatus && inbox.needsHuman && !collapsed"
      to="/conversations?filter=needs_human"
      class="mx-3 mt-3 flex shrink-0 items-center gap-2.5 rounded-[var(--radius-card)] bg-night-tile px-3 py-2 text-[0.8125rem] font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--color-night-tile),white_8%)]"
      @click="$emit('navigate')"
    >
      <PhUserSound :size="16" weight="fill" class="shrink-0 text-attention-bright"></PhUserSound>
      <span class="min-w-0 flex-1 truncate">{{ t('status.needs_human') }}</span>
      <span class="nav-count nav-count-attention">{{ formatNumber(inbox.needsHuman) }}</span>
    </router-link>

    <nav class="mt-2 min-h-0 flex-1 overflow-y-auto px-3" :aria-label="t('shell.mainNav')">
      <div v-for="(group, index) in groups" :key="index" :class="{ 'mt-4': index > 0 }">
        <p v-if="group.label && !collapsed" class="mb-1 px-3 text-xs font-medium text-night-soft">{{ group.label }}</p>
        <hr v-else-if="group.label && index > 0" class="mx-3 mb-3 border-night-tile" />
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in group.items" :key="item.to">
            <template v-if="item.children && !collapsed">
              <button
                type="button"
                class="nav-item w-full"
                :class="{ 'nav-item-active': active(item) && !isOpen(item) }"
                :aria-expanded="isOpen(item)"
                :aria-controls="'nav-' + item.match.slice(1)"
                @click="toggle(item)"
              >
                <component :is="item.icon" :size="18" :weight="active(item) ? 'fill' : 'regular'" class="nav-icon"></component>
                <span class="flex-1 truncate text-left">{{ item.label }}</span>
                <PhCaretDown :size="14" weight="bold" class="nav-caret" :class="{ 'nav-caret-shut': !isOpen(item) }" aria-hidden="true"></PhCaretDown>
              </button>
              <ul v-if="isOpen(item)" :id="'nav-' + item.match.slice(1)" class="nav-children">
                <li v-for="child in item.children" :key="child.to">
                  <router-link
                    :to="child.to"
                    class="nav-child"
                    :class="{ 'nav-child-active': active(child) }"
                    :aria-current="active(child) ? 'page' : undefined"
                    @click="$emit('navigate')"
                  >
                    {{ child.label }}
                  </router-link>
                </li>
              </ul>
            </template>
            <router-link
              v-else
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
                <!-- Unfolded, the orange strip above already says someone waits, so the count stays quiet. -->
                <span v-if="item.count" class="nav-count">
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
      <div ref="accountMenu" class="relative mt-2 border-t border-night-tile pt-2">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-[var(--radius-card)] p-1 text-left transition-colors hover:bg-night-tile"
          :class="{ 'justify-center': collapsed, 'bg-night-tile': route.path === '/account' }"
          :aria-label="collapsed ? t('shell.account') : undefined"
          :title="collapsed ? email : undefined"
          aria-haspopup="menu"
          :aria-expanded="accountOpen"
          @click="accountOpen = !accountOpen"
        >
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-night-tile text-[0.8125rem] font-bold text-white" aria-hidden="true">
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
import { computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhSignOut,
  PhChatCircleDots,
  PhCaretUpDown,
  PhUserCircle,
  PhUserSound,
  PhCaretDown,
} from '@phosphor-icons/vue';

import BrandMark from '../ui/BrandMark.vue';
import { navGroups, isActive } from '../../lib/navigation.js';
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
// [ folds or unfolds, unless they are typing. The button is SidebarToggle, beside each page's title.
function onKey(event) {
  if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  ui.sidebarCollapsed = !ui.sidebarCollapsed;
}
onMounted(() => props.collapsible && window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
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
    agent.load().catch(() => {});
  },
  { immediate: true },
);

function active(item) {
  return isActive(item, route.path);
}

// A row that folds open (Settings) is open while one of its pages is, until
// the owner folds it; the caret says which way it goes.
const folded = reactive({});
const isOpen = (item) => !(folded[item.to] ?? !active(item));
function toggle(item) {
  folded[item.to] = isOpen(item);
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

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-control);
  font-size: 0.875rem;
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
  background-color: color-mix(in srgb, var(--color-night-tile) 60%, var(--color-night));
}

/* The page you are on: a quiet fill, white words, and the one lime mark,
   its filled icon. */
.nav-item-active,
.nav-item-active:hover {
  color: #fff;
  font-weight: 600;
  background-color: var(--color-night-tile);
}

.nav-item-active .nav-icon {
  color: var(--color-lime);
}

/* Settings folds open: pages hang from a guide line under its icon, words only. */
.nav-caret {
  flex-shrink: 0;
  transition: transform 0.2s var(--ease-settle);
}

.nav-caret-shut {
  transform: rotate(-90deg);
}

.nav-children {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0.125rem 0 0.25rem 1.3125rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-night-tile);
}

.nav-child {
  position: relative;
  display: flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-control);
  font-size: 0.875rem;
  color: var(--color-night-soft);
  transition: background-color 0.15s var(--ease-settle), color 0.15s var(--ease-settle);
}

.nav-child:hover {
  color: #fff;
  background-color: color-mix(in srgb, var(--color-night-tile) 60%, var(--color-night));
}

.nav-child-active,
.nav-child-active:hover {
  color: #fff;
  font-weight: 600;
  background-color: var(--color-night-tile);
}

/* The one lime mark on the guide line: you are here. */
.nav-child-active::before {
  content: '';
  position: absolute;
  top: 0.375rem;
  bottom: 0.375rem;
  left: calc(-0.5rem - 1px);
  width: 2px;
  border-radius: 999px;
  background-color: var(--color-lime);
}

@media (prefers-reduced-motion: reduce) {
  .nav-caret {
    transition: none;
  }
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
  background-color: color-mix(in srgb, var(--color-night-tile), white 12%);
}

.nav-count-attention,
.nav-item-active .nav-count-attention {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
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
  border-color: var(--color-night-tile);
}

.badge-attention,
.nav-item-active .badge-attention {
  background-color: var(--color-attention-bright);
  color: var(--color-ink);
}
/* A finger needs the room a mouse does not (the phone drawer, a tablet). */
@media (pointer: coarse) {
  .nav-item,
  .nav-child {
    height: 2.75rem;
    font-size: 0.9375rem;
  }
}
</style>
