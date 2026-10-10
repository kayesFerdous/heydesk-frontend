import {
  fetchAgent,
  fetchPresets,
  createAgent,
  updateAgent,
} from '../../../api/agent.js';

// The request that is on its way, if any. The sidebar and the page both ask
// for the agent when a page opens; they share this one request.
let loadingAgent = null;
let loadingPresets = null;

export default {
  // Fetched once per session: every page reads it from the store after that.
  // `{ force: true }` asks again, for when something the server works out from
  // other data changed (adding the first menu item changes `missing`). A save
  // needs no force: the PATCH answers with the new agent.
  //
  // A business with no agent is a normal first-run state, not an error. Any
  // other failure (the API is down) is thrown for the page to show.
  load(context, { force = false } = {}) {
    if (context.state.loaded && !force) return Promise.resolve();
    if (loadingAgent && !force) return loadingAgent;

    const token = context.rootGetters['auth/token'];
    const loading = fetchAgent(token)
      .then((info) => context.commit('setAgent', info))
      .catch((error) => {
        if (error.status === 404 && error.code === 'not_found') {
          context.commit('setNoAgent');
        } else {
          throw error;
        }
      })
      .finally(() => {
        if (loadingAgent === loading) loadingAgent = null;
      });
    loadingAgent = loading;
    return loading;
  },

  // The kinds of business never change while the app is open.
  loadPresets(context) {
    if (context.state.presets.length) return Promise.resolve();
    if (!loadingPresets) {
      loadingPresets = fetchPresets()
        .then((presets) => context.commit('setPresets', presets))
        .finally(() => (loadingPresets = null));
    }
    return loadingPresets;
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
