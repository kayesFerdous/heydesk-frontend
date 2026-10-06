export default {
  info(state) {
    return state.info;
  },
  loaded(state) {
    return state.loaded;
  },
  hasAgent(state) {
    return !!state.info;
  },
  noAgent(state) {
    return state.noAgent;
  },
  publicKey(state) {
    return state.info ? state.info.public_key : null;
  },
  config(state) {
    return state.info ? state.info.config : null;
  },
  // What this kind of agent does. HeyDesk fixes it per preset; owners cannot change it.
  jobs(state) {
    return state.info ? state.info.jobs : [];
  },
  missing(state) {
    return state.info ? state.info.missing : [];
  },
  presets(state) {
    return state.presets;
  },
  // The preset this agent was made from (its label, items label, knowledge form).
  preset(state) {
    if (!state.info) return null;
    return state.presets.find((p) => p.id === state.info.config.preset) || null;
  },
  // What the preset calls the list the owner keeps: Menu, Services, Doctors.
  itemsLabel(state, getters) {
    return getters.preset ? getters.preset.items_label : 'Menu';
  },
};
