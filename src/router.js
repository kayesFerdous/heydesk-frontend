import { createRouter, createWebHistory } from 'vue-router';

import store from './store/index.js';

// The inbox is where the owner lands, so it ships in the main bundle.
// Everything else is fetched the first time it is visited.
import InboxPage from './pages/inbox/InboxPage.vue';
const SignIn = () => import('./pages/auth/SignIn.vue');
const SetupPage = () => import('./pages/setup/SetupPage.vue');
const AgentPage = () => import('./pages/agent/AgentPage.vue');
const ConversationsPage = () => import('./pages/conversations/ConversationsPage.vue');
const MenuPage = () => import('./pages/menu/MenuPage.vue');
const KnowledgePage = () => import('./pages/knowledge/KnowledgePage.vue');
const AdminPage = () => import('./pages/admin/AdminPage.vue');
const NotFound = () => import('./pages/NotFound.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Owners land on their inbox, platform admins on the business list.
    {
      path: '/',
      redirect: () => (store.getters['auth/isAdmin'] ? '/admin' : '/inbox'),
    },
    {
      path: '/sign-in',
      component: SignIn,
      meta: { requiresUnauth: true, bare: true },
    },
    {
      path: '/inbox',
      component: InboxPage,
      meta: { requiresAuth: true, requiresOwner: true, title: 'Inbox' },
    },
    {
      path: '/setup',
      component: SetupPage,
      meta: { requiresAuth: true, requiresOwner: true, bare: true },
    },
    {
      path: '/conversations',
      component: ConversationsPage,
      meta: { requiresAuth: true, requiresOwner: true, title: 'Conversations' },
    },
    {
      path: '/menu',
      component: MenuPage,
      meta: { requiresAuth: true, requiresOwner: true, title: 'Menu' },
    },
    {
      path: '/knowledge',
      component: KnowledgePage,
      meta: { requiresAuth: true, requiresOwner: true, title: 'Knowledge' },
    },
    {
      path: '/agent',
      component: AgentPage,
      meta: { requiresAuth: true, requiresOwner: true, title: 'Your agent' },
    },
    {
      path: '/admin',
      component: AdminPage,
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin' },
    },
    { path: '/:notFound(.*)', component: NotFound, meta: { bare: true } },
  ],
});

router.beforeEach((to, _, next) => {
  const signedIn = store.getters['auth/isAuthenticated'];
  const isAdmin = store.getters['auth/isAdmin'];
  if (to.meta.requiresAuth && !signedIn) {
    next('/sign-in');
  } else if (to.meta.requiresUnauth && signedIn) {
    next('/');
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/inbox');
  } else if (to.meta.requiresOwner && isAdmin) {
    // Admins have no business of their own, so the owner screens have no data.
    next('/admin');
  } else {
    next();
  }
});

export default router;
