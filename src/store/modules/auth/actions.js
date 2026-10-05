import { login, signup, fetchMe } from '../../../api/auth.js';

const TOKEN_KEY = 'heydesk_token';

export default {
  // Called once when the app starts: pick the session back up if there is one.
  async tryLogin(context) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }
    context.commit('setToken', token);
    try {
      context.commit('setMe', await fetchMe(token));
    } catch (error) {
      // A 401 already cleared the session through the handler in main.js. Any
      // other failure (the API is down) keeps the token and shows no account.
      if (error.status !== 401) {
        throw error;
      }
    }
  },

  async login(context, { email, password }) {
    const { token } = await login(email, password);
    await context.dispatch('startSession', token);
  },

  async signup(context, { email, password, workspaceName }) {
    const { token } = await signup(email, password, workspaceName);
    await context.dispatch('startSession', token);
  },

  async startSession(context, token) {
    localStorage.setItem(TOKEN_KEY, token);
    context.commit('setToken', token);
    context.commit('setMe', await fetchMe(token));
  },

  logout(context) {
    localStorage.removeItem(TOKEN_KEY);
    context.commit('clear');
    context.commit('inbox/clear', null, { root: true });
    context.commit('agent/clear', null, { root: true });
    context.commit('ui/setTestSheet', false, { root: true });
  },
};
