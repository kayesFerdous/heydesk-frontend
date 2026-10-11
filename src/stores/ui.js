import { ref } from 'vue';
import { defineStore } from 'pinia';

// Small bits of shell state that more than one component needs.
export const useUiStore = defineStore('ui', () => {
  const testSheetOpen = ref(false);
  const navOpen = ref(false); // the sidebar as a drawer, on phones

  return { testSheetOpen, navOpen };
});
