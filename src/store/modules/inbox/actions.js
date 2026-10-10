import { fetchInbox } from '../../../api/records.js';
import { fetchConversations } from '../../../api/conversations.js';

// The sidebar and the Inbox page ask for the counts at the same moment when the
// Inbox opens; a second ask while one is on its way waits for that one.
let loading = null;

export default {
  // Throws when the API is unreachable; the page that asked decides what to show.
  load(context) {
    if (loading) return loading;
    const token = context.rootGetters['auth/token'];
    loading = Promise.all([
      fetchInbox(token),
      fetchConversations(token, { status: 'needs_human' }),
    ])
      .then(([jobs, waiting]) => context.commit('setCounts', { jobs, needsHuman: waiting.length }))
      .finally(() => (loading = null));
    return loading;
  },
};
