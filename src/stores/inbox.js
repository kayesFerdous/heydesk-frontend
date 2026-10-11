import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { fetchInbox } from '../api/records.js';
import { fetchConversations } from '../api/conversations.js';

// What the sidebar badges and the Inbox page both need: how many things are
// waiting per job, and how many customers are waiting for a person.
export const useInboxStore = defineStore('inbox', () => {
  const jobs = ref([]);
  const needsHuman = ref(0);
  const loaded = ref(false);

  const waitingTotal = computed(() => jobs.value.reduce((sum, job) => sum + job.waiting, 0));

  // The sidebar and the Inbox page ask at the same moment when the Inbox opens;
  // a second ask while one is on its way waits for that one.
  let loading = null;

  // Throws when the API is unreachable; the page that asked decides what to show.
  function load() {
    if (loading) return loading;
    loading = Promise.all([fetchInbox(), fetchConversations({ status: 'needs_human' })])
      .then(([counts, waiting]) => {
        jobs.value = counts;
        needsHuman.value = waiting.length;
        loaded.value = true;
      })
      .finally(() => (loading = null));
    return loading;
  }

  function clear() {
    jobs.value = [];
    needsHuman.value = 0;
    loaded.value = false;
  }

  return { jobs, needsHuman, loaded, waitingTotal, load, clear };
});
