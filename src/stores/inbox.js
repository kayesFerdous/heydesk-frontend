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
  // Goes up by one each time a load finds more waiting than the one before:
  // the shell chimes, and an open Inbox or Conversations fetches its list again.
  const arrivals = ref(0);

  const waitingTotal = computed(() => jobs.value.reduce((sum, job) => sum + job.waiting, 0));

  // The sidebar and the Inbox page ask at the same moment when the Inbox opens;
  // a second ask while one is on its way waits for that one.
  let loading = null;

  // Throws when the API is unreachable; the page that asked decides what to show.
  function load() {
    if (loading) return loading;
    loading = Promise.all([fetchInbox(), fetchConversations({ status: 'needs_human' })])
      .then(([counts, waiting]) => {
        const before = { total: waitingTotal.value, needsHuman: needsHuman.value };
        const firstLoad = !loaded.value;
        jobs.value = counts;
        needsHuman.value = waiting.length;
        loaded.value = true;
        if (!firstLoad && (waitingTotal.value > before.total || needsHuman.value > before.needsHuman)) {
          arrivals.value++;
        }
      })
      .finally(() => (loading = null));
    return loading;
  }

  function clear() {
    jobs.value = [];
    needsHuman.value = 0;
    loaded.value = false;
  }

  return { jobs, needsHuman, loaded, arrivals, waitingTotal, load, clear };
});
