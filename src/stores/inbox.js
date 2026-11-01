import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { fetchCounts } from '../api/conversations.js';

// The server's frames for chats that changed at about the same moment (a visitor's
// turn commits more than once) become one fetch of the counts and the list.
const CHANGES_MS = 500;

// What the sidebar badges and the Inbox page both need: how many things are
// waiting per job, and how many customers are waiting for a person (of them,
// how many are the signed-in person's, and how many nobody has: backend I1).
export const useInboxStore = defineStore('inbox', () => {
  const jobs = ref([]);
  const needsHuman = ref(0);
  const mineWaiting = ref(0);
  const unassignedWaiting = ref(0);
  const loaded = ref(false);
  // Goes up by one each time a load finds more waiting than the one before:
  // the shell chimes, and an open Inbox fetches its list again.
  const arrivals = ref(0);
  // Goes up by one when an open Conversations page should fetch its list again:
  // the server said chats changed (backend D158), or the poll found more waiting.
  const changes = ref(0);

  const waitingTotal = computed(() => jobs.value.reduce((sum, job) => sum + job.waiting, 0));

  // The sidebar and the Inbox page ask at the same moment when the Inbox opens;
  // a second ask while one is on its way waits for that one.
  let loading = null;

  // Throws when the API is unreachable; the page that asked decides what to show.
  // One request: the server counts the new orders and messages too (backend D167).
  function load({ afterChange = false } = {}) {
    if (loading) return loading;
    loading = fetchCounts()
      .then((counts) => {
        const before = { total: waitingTotal.value, needsHuman: needsHuman.value };
        const firstLoad = !loaded.value;
        jobs.value = [
          { job: 'order', kind: 'order', waiting: counts.orders_new },
          { job: 'message', kind: 'request', waiting: counts.messages_new },
        ];
        needsHuman.value = counts.needs_human;
        mineWaiting.value = counts.mine;
        unassignedWaiting.value = counts.unassigned;
        loaded.value = true;
        if (!firstLoad && (waitingTotal.value > before.total || needsHuman.value > before.needsHuman)) {
          arrivals.value++;
          if (!afterChange) changes.value++; // a change already asked for the list
        }
      })
      .finally(() => (loading = null));
    return loading;
  }

  let changeTimer = null;

  function changed() {
    if (changeTimer) return;
    changeTimer = setTimeout(() => {
      changeTimer = null;
      changes.value++;
      load({ afterChange: true }).catch(() => {});
    }, CHANGES_MS);
  }

  function clear() {
    jobs.value = [];
    needsHuman.value = 0;
    mineWaiting.value = 0;
    unassignedWaiting.value = 0;
    loaded.value = false;
  }

  return { jobs, needsHuman, mineWaiting, unassignedWaiting, loaded, arrivals, changes, waitingTotal, load, changed, clear };
});
