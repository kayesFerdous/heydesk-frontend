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
const BubbleSection = () => import('./pages/agent/BubbleSection.vue');
const CallsSection = () => import('./pages/agent/CallsSection.vue');
const CallsPage = () => import('./pages/calls/CallsPage.vue');
const MenuPage = () => import('./pages/menu/MenuPage.vue');
const KnowledgePage = () => import('./pages/knowledge/KnowledgePage.vue');
const ChannelsPage = () => import('./pages/channels/ChannelsPage.vue');
const ChatPage = () => import('./pages/chat/ChatPage.vue');
const EmbedPage = () => import('./pages/chat/EmbedPage.vue');
const AdminPage = () => import('./pages/admin/AdminPage.vue');
const BusinessPage = () => import('./pages/admin/BusinessPage.vue');
const AccountPage = () => import('./pages/account/AccountPage.vue');
const TeamPage = () => import('./pages/team/TeamPage.vue');
const BillingPage = () => import('./pages/billing/BillingPage.vue');
const NotFound = () => import('./pages/NotFound.vue');

// Every owner page needs a signed-in owner, or an admin who opened a business.
const owner = { requiresAuth: true, requiresOwner: true };
// The agent's settings, channels and team: not for a moderator (backend D97).
const manager = { ...owner, requiresManager: true };

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
    // The same chat in the window public/widget.js opens on a business's website (backend D82).
    { path: '/embed/:key', component: EmbedPage, meta: { bare: true } },
    { path: '/setup', component: SetupPage, meta: { ...manager, bare: true } },

    // Daily work
    { path: '/home', component: HomePage, meta: owner },
    { path: '/inbox', component: InboxPage, meta: owner },
    { path: '/conversations', component: ConversationsPage, meta: owner },
    { path: '/calls', component: CallsPage, meta: owner },

    // Your agent. The settings are sections with one page around them
    // (title, section tabs, the test chat); each section saves on its own.
    {
      path: '/agent',
      component: AgentPage,
      meta: manager,
      redirect: '/agent/profile',
      children: [
        { path: 'profile', component: ProfileSection, meta: manager },
        { path: 'hours', component: HoursSection, meta: manager },
        { path: 'answers', component: AnswersSection, meta: manager },
        { path: 'payments', component: PaymentsSection, meta: manager },
        { path: 'bubble', component: BubbleSection, meta: manager },
        { path: 'calls', component: CallsSection, meta: manager },
      ],
    },
    { path: '/menu', component: MenuPage, meta: owner },
    { path: '/knowledge', component: KnowledgePage, meta: manager },
    { path: '/channels', component: ChannelsPage, meta: manager },
    // The owner's team: moderators and what everyone changed (backend D97).
    { path: '/team', component: TeamPage, meta: manager },
    // The plan and paying for it (backend D106); the owner's, like the team.
    { path: '/billing', component: BillingPage, meta: manager },

    // The person's own settings (language, sign-in), reached from the account
    // menu. Owners and admins both have one.
    { path: '/account', component: AccountPage, meta: { requiresAuth: true } },

    {
      path: '/admin',
      component: AdminPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/businesses/:id',
      component: BusinessPage,
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
  if (to.meta.requiresManager && !auth.canManage) return '/home';
});

export default router;
