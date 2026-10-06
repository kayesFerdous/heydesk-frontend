import { request } from './client.js';
import { fetchRecordsOf } from './records.js';

// status is "active" or "needs_human"; leave it out for every conversation.
export function fetchConversations(token, { status } = {}) {
  return request('/conversations' + (status ? `?status=${status}` : ''), {
    token,
  });
}

// The transcript, plus the orders, appointments or messages that came out of it.
export async function fetchConversation(token, conversationId) {
  const [conversation, records] = await Promise.all([
    request(`/conversations/${conversationId}`, { token }),
    fetchRecordsOf(token, conversationId),
  ]);
  return { ...conversation, records };
}
