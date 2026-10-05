import {
  fetchAgent,
  fetchPresets,
  createAgent,
  updateAgent,
} from '../../../api/agent.js';

export default {
  // A business with no agent is a normal first-run state, not an error. Any
  // other failure (the API is down) is thrown for the page to show.
  async load(context) {
    const token = context.rootGetters['auth/token'];
    try {
      context.commit('setAgent', await fetchAgent(token));
    } catch (error) {
      if (error.status === 404 && error.code === 'not_found') {
        context.commit('setNoAgent');
      } else {
        throw error;
      }
    }
  },

  async loadPresets(context) {
    if (context.state.presets.length) return;
    context.commit('setPresets', await fetchPresets());
  },

  async create(context, body) {
    const token = context.rootGetters['auth/token'];
    context.commit('setAgent', await createAgent(token, body));
  },

  async save(context, patch) {
    const token = context.rootGetters['auth/token'];
    context.commit('setAgent', await updateAgent(token, patch));
  },
};
