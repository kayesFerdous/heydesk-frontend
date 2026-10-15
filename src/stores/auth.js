import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { login, signup, fetchMe } from '../api/auth.js';
import { setAuthToken, setViewedBusiness } from '../api/client.js';
import { useAgentStore } from './agent.js';
import { useInboxStore } from './inbox.js';
import { useUiStore } from './ui.js';

const TOKEN_KEY = 'heydesk_token';
// The business an admin is viewing lasts as long as the browser tab, not longer.
const VIEWING_KEY = 'heydesk_viewing';

// The token survives a reload; `me` is fetched again from it every time.
export const useAuthStore = defineStore('auth', () => {
  const token = ref(null);
  const me = ref(null);
  const viewing = ref(null); // { id, name, status }: the business an admin opened

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => me.value?.role === 'admin');
  const isViewing = computed(() => isAdmin.value && !!viewing.value);
  // Whether the owner's pages are what this person sees: an owner, or an admin inside a business.
  const seesBusiness = computed(() => !isAdmin.value || isViewing.value);
  const business = computed(() => me.value?.business ?? (isViewing.value ? viewing.value : null));
  const isSuspended = computed(() => business.value?.status === 'suspended');

  function setToken(next) {
    token.value = next;
    setAuthToken(next);
  }

  // Called once when the app starts: pick the session back up if there is one.
  async function tryLogin() {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    setToken(saved);
    try {
      me.value = await fetchMe();
      // A reload while an admin was inside a business keeps them there.
      const opened = JSON.parse(sessionStorage.getItem(VIEWING_KEY) || 'null');
      if (opened && isAdmin.value) setViewing(opened);
    } catch (error) {
      // A 401 already cleared the session through the handler in main.js. Any
      // other failure (the API is down) keeps the token and shows no account.
      if (error.status !== 401) throw error;
    }
  }

  async function startSession(next) {
    localStorage.setItem(TOKEN_KEY, next);
    setToken(next);
    me.value = await fetchMe();
  }

  async function signIn({ email, password }) {
    const { token: next } = await login(email, password);
    await startSession(next);
  }

  async function signUp({ email, password, workspaceName }) {
    const { token: next } = await signup(email, password, workspaceName);
    await startSession(next);
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

  function stopViewing() {
    if (!viewing.value) return;
    clearBusinessData();
    setViewing(null);
    sessionStorage.removeItem(VIEWING_KEY);
  }

  function logout() {
    stopViewing();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    me.value = null;
    clearBusinessData();
  }

  return {
    token, me, viewing,
    isAuthenticated, isAdmin, isViewing, seesBusiness, business, isSuspended,
    tryLogin, signIn, signUp, logout, view, stopViewing,
  };
});
