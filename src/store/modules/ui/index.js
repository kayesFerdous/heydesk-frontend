// Small bits of shell state that more than one component needs.
export default {
  namespaced: true,
  state() {
    return {
      testSheetOpen: false,
    };
  },
  getters: {
    testSheetOpen(state) {
      return state.testSheetOpen;
    },
  },
  mutations: {
    setTestSheet(state, open) {
      state.testSheetOpen = open;
    },
  },
};
