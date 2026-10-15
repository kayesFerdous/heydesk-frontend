import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from './stores/auth.js';

// Home is where the owner lands, so it ships in the main bundle. Everything
// else is fetched the first time it is visited.
import HomePage from './pages/home/HomePage.vue';
const LandingPage = () => import('./pages/landing/LandingPage.vue');
const SignIn = () => import('./pages/auth/SignIn.vue');
const SetupPage = () => import('./pages/setup/SetupPage.vue');
const InboxPage = () => import('./pages/inbox/InboxPage.vue');
const ConversationsPage = () => import('./pages/conversations/ConversationsPage.vue');
const AgentPage = () => import('./pages/agent/AgentPage.vue');
const ProfileSection = () => import('./pages/agent/ProfileSection.vue');
const HoursSection = () => import('./pages/agent/HoursSection.vue');
const AnswersSection = () => import('./pages/agent/AnswersSection.vue');
const PaymentsSection = () => import('./pages/agent/PaymentsSection.vue');
const MenuPage = () => import('./pages/menu/MenuPage.vue');
const KnowledgePage = () => import('./pages/knowledge/KnowledgePage.vue');
const ChannelsPage = () => import('./pages/channels/ChannelsPage.vue');
const ChatPage = () => import('./pages/chat/ChatPage.vue');
const AdminPage = () => import('./pages/admin/AdminPage.vue');
const AccountPage = () => import('./pages/account/AccountPage.vue');
const NotFound = () => import('./pages/NotFound.vue');

// Every owner page needs a signed-in owner, or an admin who opened a business.
const owner = { requiresAuth: true, requiresOwner: true };

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Visitors see the landing page; owners land on Home, platform admins on
    // the business list.
    {
      path: '/',
      component: LandingPage,
      meta: { bare: true },
      beforeEnter: () => {
        const auth = useAuthStore();
        if (!auth.isAuthenticated) return true;
        return auth.seesBusiness ? '/home' : '/admin';
      },
    },
    {
      path: '/sign-in',
      component: SignIn,
      meta: { requiresUnauth: true, bare: true },
    },
    // The customer's chat page: public, the key in the link is the credential.
    { path: '/chat/:key', component: ChatPage, meta: { bare: true } },
    { path: '/setup', component: SetupPage, meta: { ...owner, bare: true } },

    // Daily work
    { path: '/home', component: HomePage, meta: owner },
    { path: '/inbox', component: InboxPage, meta: owner },
    { path: '/conversations', component: ConversationsPage, meta: owner },

    // Your agent. The settings are sections with one page around them
    // (title, section tabs, the test chat); each section saves on its own.
    {
      path: '/agent',
      component: AgentPage,
      meta: owner,
      redirect: '/agent/profile',
      children: [
        { path: 'profile', component: ProfileSection, meta: owner },
        { path: 'hours', component: HoursSection, meta: owner },
        { path: 'answers', component: AnswersSection, meta: owner },
        { path: 'payments', component: PaymentsSection, meta: owner },
      ],
    },
    { path: '/menu', component: MenuPage, meta: owner },
    { path: '/knowledge', component: KnowledgePage, meta: owner },
    { path: '/channels', component: ChannelsPage, meta: owner },

    // The person's own settings (language, sign-in), reached from the account
    // menu. Owners and admins both have one.
    { path: '/account', component: AccountPage, meta: { requiresAuth: true } },

    {
      path: '/admin',
      component: AdminPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    { path: '/:notFound(.*)', component: NotFound, meta: { bare: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/sign-in';
  if (to.meta.requiresUnauth && auth.isAuthenticated) return '/';
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/home';
  // Back on the admin's own pages, the business they had open is closed.
  if (to.meta.requiresAdmin) auth.stopViewing();
  // An admin has no business of their own: the owner screens need one opened first.
  if (to.meta.requiresOwner && !auth.seesBusiness) return '/admin';
});

export default router;
