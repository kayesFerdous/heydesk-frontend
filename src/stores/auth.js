import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { login, signup, fetchMe } from '../api/auth.js';
import { setAuthToken } from '../api/client.js';
import { useAgentStore } from './agent.js';
import { useInboxStore } from './inbox.js';
import { useUiStore } from './ui.js';

const TOKEN_KEY = 'heydesk_token';

// The token survives a reload; `me` is fetched again from it every time.
export const useAuthStore = defineStore('auth', () => {
  const token = ref(null);
  const me = ref(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => me.value?.role === 'admin');
  const business = computed(() => me.value?.business ?? null);
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

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    me.value = null;
    useInboxStore().clear();
    useAgentStore().clear();
    useUiStore().testSheetOpen = false;
  }

  return {
    token, me,
    isAuthenticated, isAdmin, business, isSuspended,
    tryLogin, signIn, signUp, logout,
  };
});
