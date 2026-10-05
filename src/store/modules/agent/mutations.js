export default {
  setAgent(state, info) {
    state.info = info;
    state.noAgent = false;
    state.loaded = true;
  },
  setNoAgent(state) {
    state.info = null;
    state.noAgent = true;
    state.loaded = true;
  },
  setPresets(state, presets) {
    state.presets = presets;
  },
  clear(state) {
    state.info = null;
    state.noAgent = false;
    state.loaded = false;
  },
};
