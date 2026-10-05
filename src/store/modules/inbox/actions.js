import { fetchInbox } from '../../../api/records.js';
import { fetchConversations } from '../../../api/conversations.js';

export default {
  // Throws when the API is unreachable; the page that asked decides what to show.
  async load(context) {
    const token = context.rootGetters['auth/token'];
    const [jobs, waiting] = await Promise.all([
      fetchInbox(token),
      fetchConversations(token, { status: 'needs_human' }),
    ]);
    context.commit('setCounts', { jobs, needsHuman: waiting.length });
  },
};
