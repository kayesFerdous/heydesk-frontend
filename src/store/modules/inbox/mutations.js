export default {
  setCounts(state, { jobs, needsHuman }) {
    state.jobs = jobs;
    state.needsHuman = needsHuman;
    state.loaded = true;
  },
  clear(state) {
    state.jobs = [];
    state.needsHuman = 0;
    state.loaded = false;
  },
};
