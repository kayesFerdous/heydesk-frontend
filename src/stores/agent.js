import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { fetchAgent, fetchPresets, createAgent, updateAgent } from '../api/agent.js';

export const useAgentStore = defineStore('agent', () => {
  const info = ref(null); // { public_key, config, jobs, missing }
  const noAgent = ref(false); // the business has not created its agent yet
  const loaded = ref(false);
  const presets = ref([]);

  const hasAgent = computed(() => !!info.value);
  const config = computed(() => info.value?.config ?? null);
  const publicKey = computed(() => info.value?.public_key ?? null);
  // What this kind of agent does. HeyDesk fixes it per preset; owners cannot change it.
  const jobs = computed(() => info.value?.jobs ?? []);
  const missing = computed(() => info.value?.missing ?? []);
  // The preset this agent was made from (its label, items label, knowledge form).
  const preset = computed(() => {
    if (!info.value) return null;
    return presets.value.find((p) => p.id === info.value.config.preset) || null;
  });
  const kind = computed(() => config.value?.preset ?? null);

  function setAgent(next) {
    info.value = next;
    noAgent.value = false;
    loaded.value = true;
  }

  // The request that is on its way, if any. The sidebar and the page both ask
  // for the agent when a page opens; they share this one request.
  let loadingAgent = null;
  let loadingPresets = null;

  // Fetched once per session: every page reads it from the store after that.
  // `{ force: true }` asks again, for when something the server works out from
  // other data changed (adding the first menu item changes `missing`). A save
  // needs no force: the PATCH answers with the new agent.
  //
  // A business with no agent is a normal first-run state, not an error. Any
  // other failure (the API is down) is thrown for the page to show.
  function load({ force = false } = {}) {
    if (loaded.value && !force) return Promise.resolve();
    if (loadingAgent && !force) return loadingAgent;

    const loading = fetchAgent()
      .then(setAgent)
      .catch((error) => {
        if (error.status !== 404 || error.code !== 'not_found') throw error;
        info.value = null;
        noAgent.value = true;
        loaded.value = true;
      })
      .finally(() => {
        if (loadingAgent === loading) loadingAgent = null;
      });
    loadingAgent = loading;
    return loading;
  }

  // The kinds of business never change while the app is open.
  function loadPresets() {
    if (presets.value.length) return Promise.resolve();
    if (!loadingPresets) {
      loadingPresets = fetchPresets()
        .then((list) => (presets.value = list))
        .finally(() => (loadingPresets = null));
    }
    return loadingPresets;
  }

  async function create(body) {
    setAgent(await createAgent(body));
  }

  async function save(patch) {
    setAgent(await updateAgent(patch));
  }

  function clear() {
    info.value = null;
    noAgent.value = false;
    loaded.value = false;
  }

  return {
    info, noAgent, loaded, presets,
    hasAgent, config, publicKey, jobs, missing, preset, kind,
    load, loadPresets, create, save, clear,
  };
});
