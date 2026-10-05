export default {
  setToken(state, token) {
    state.token = token;
  },
  setMe(state, me) {
    state.me = me;
  },
  clear(state) {
    state.token = null;
    state.me = null;
  },
};
