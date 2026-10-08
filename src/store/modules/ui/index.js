// Small bits of shell state that more than one component needs.
export default {
  namespaced: true,
  state() {
    return {
      testSheetOpen: false,
      navOpen: false, // the sidebar as a drawer, on phones
    };
  },
  getters: {
    testSheetOpen(state) {
      return state.testSheetOpen;
    },
    navOpen(state) {
      return state.navOpen;
    },
  },
  mutations: {
    setTestSheet(state, open) {
      state.testSheetOpen = open;
    },
    setNav(state, open) {
      state.navOpen = open;
    },
  },
};
