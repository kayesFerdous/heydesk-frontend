export default {
  jobs(state) {
    return state.jobs;
  },
  waitingTotal(state) {
    return state.jobs.reduce((sum, job) => sum + job.waiting, 0);
  },
  needsHuman(state) {
    return state.needsHuman;
  },
  loaded(state) {
    return state.loaded;
  },
};
