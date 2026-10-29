import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

const COLLAPSED_KEY = 'heydesk.sidebarCollapsed';
const SUMMARY_KEY = 'heydesk.summaryHidden';

// Storage can be blocked (private windows); the sidebar then just starts open.
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function readSummaryHidden() {
  try {
    return localStorage.getItem(SUMMARY_KEY) === '1';
  } catch (error) {
    return false;
  }
}

// Small bits of shell state that more than one component needs.
export const useUiStore = defineStore('ui', () => {
  const testSheetOpen = ref(false);
  const navOpen = ref(false); // the sidebar as a drawer, on phones
  // The desktop sidebar folded down to icons. Remembered in this browser.
  const sidebarCollapsed = ref(readCollapsed());

  // A chat's summary folded away. Remembered in this browser.
  const summaryHidden = ref(readSummaryHidden());

  watch(summaryHidden, (hidden) => {
    try {
      localStorage.setItem(SUMMARY_KEY, hidden ? '1' : '0');
    } catch (error) {
      // Not remembered this time; nothing else depends on it.
    }
  });

  watch(sidebarCollapsed, (collapsed) => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch (error) {
      // Not remembered this time; nothing else depends on it.
    }
  });

  return { testSheetOpen, navOpen, sidebarCollapsed, summaryHidden };
});
