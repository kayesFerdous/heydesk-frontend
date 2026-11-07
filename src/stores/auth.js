import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { login, logout as endSession, signup, verifyEmail, resetPassword, fetchMe } from '../api/auth.js';
import { setSignedIn, setViewedBusiness } from '../api/client.js';
import { useAgentStore } from './agent.js';
import { useInboxStore } from './inbox.js';
import { useUiStore } from './ui.js';

// Not a secret: the session is in a cookie scripts can't read. This only says a
// session may exist, so a signed-out visitor's page load asks the API nothing.
const SIGNED_IN_KEY = 'heydesk_signed_in';
const OLD_TOKEN_KEY = 'heydesk_token'; // where the token used to be: removed on start
// The business an admin is viewing lasts as long as the browser tab, not longer.
const VIEWING_KEY = 'heydesk_viewing';

// The cookie survives a reload; `me` is fetched again with it every time.
export const useAuthStore = defineStore('auth', () => {
  const signedIn = ref(false);
  const me = ref(null);
  const viewing = ref(null); // { id, name, status }: the business an admin opened

  const isAuthenticated = computed(() => signedIn.value);
  const isAdmin = computed(() => me.value?.role === 'admin');
  // Someone the owner added to the team (backend D97): the inbox, the records and the
  // lists, but not the agent's settings, the channels or the team.
  const isModerator = computed(() => me.value?.role === 'moderator');
  const isViewing = computed(() => isAdmin.value && !!viewing.value);
  // Whether the owner's pages are what this person sees: an owner, or an admin inside a business.
  const seesBusiness = computed(() => !isAdmin.value || isViewing.value);
  // Whether the business's settings and team are theirs: an owner, or an admin inside a business.
  const canManage = computed(() => seesBusiness.value && !isModerator.value);
  const business = computed(() => me.value?.business ?? (isViewing.value ? viewing.value : null));
  const isSuspended = computed(() => business.value?.status === 'suspended');

  function setSession(next) {
    signedIn.value = next;
    setSignedIn(next);
  }

  // Called once when the app starts: pick the session back up if there is one.
  async function tryLogin() {
    localStorage.removeItem(OLD_TOKEN_KEY);
    if (!localStorage.getItem(SIGNED_IN_KEY)) return;
    setSession(true);
    try {
      me.value = await fetchMe();
      // A reload while an admin was inside a business keeps them there.
      const opened = JSON.parse(sessionStorage.getItem(VIEWING_KEY) || 'null');
      if (opened && isAdmin.value) setViewing(opened);
    } catch (error) {
      // A 401 already cleared the session through the handler in main.js. Any
      // other failure (the API is down) keeps the session and shows no account.
      if (error.status !== 401) throw error;
    }
  }

  async function startSession() {
    localStorage.setItem(SIGNED_IN_KEY, '1');
    setSession(true);
    me.value = await fetchMe();
  }

  async function signIn({ email, password }) {
    await login(email, password);
    await startSession();
  }

  // Signing up gives no session: the emailed code does (verify below).
  async function signUp({ email, password, workspaceName }) {
    await signup(email, password, workspaceName);
  }

  async function verify({ email, code }) {
    await verifyEmail(email, code);
    await startSession();
  }

  async function reset({ email, code, newPassword }) {
    await resetPassword(email, code, newPassword);
    await startSession();
  }

  function setViewing(next) {
    viewing.value = next;
    setViewedBusiness(next?.id ?? null);
  }

  // The stores hold one business's agent and counts; a different business starts them afresh.
  function clearBusinessData() {
    useInboxStore().clear();
    useAgentStore().clear();
    useUiStore().testSheetOpen = false;
  }

  // An admin opens a business: from now on every request is about it (X-Business).
  function view({ id, name, status }) {
    clearBusinessData();
    setViewing({ id, name, status });
    sessionStorage.setItem(VIEWING_KEY, JSON.stringify(viewing.value));
  }

  // The stores keep the closed business's data: the page being left may still draw
  // from them while it goes. Opening the next business (view) empties them first.
  function stopViewing() {
    if (!viewing.value) return;
    setViewing(null);
    sessionStorage.removeItem(VIEWING_KEY);
    useUiStore().testSheetOpen = false;
  }

  function logout() {
    // ponytail: if this request fails (offline), the cookie stays until it expires; retry it if that matters
    endSession().catch(() => {});
    stopViewing();
    localStorage.removeItem(SIGNED_IN_KEY);
    setSession(false);
    me.value = null;
    clearBusinessData();
  }

  return {
    me, viewing,
    isAuthenticated, isAdmin, isModerator, isViewing, seesBusiness, canManage, business, isSuspended,
    tryLogin, signIn, signUp, verify, reset, logout, view, stopViewing,
  };
});
