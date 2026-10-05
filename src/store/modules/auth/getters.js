export default {
  token(state) {
    return state.token;
  },
  isAuthenticated(state) {
    return !!state.token;
  },
  me(state) {
    return state.me;
  },
  isAdmin(state) {
    return !!state.me && state.me.role === 'admin';
  },
  isSuspended(state) {
    return !!state.me && !!state.me.business && state.me.business.status === 'suspended';
  },
  business(state) {
    return state.me ? state.me.business : null;
  },
};
