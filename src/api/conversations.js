import { request } from './client.js';

// status is "active" or "needs_human"; leave it out for every conversation.
export function fetchConversations(token, { status } = {}) {
  return request('/conversations' + (status ? `?status=${status}` : ''), {
    token,
  });
}

// The transcript, plus the orders or messages that came out of it.
export function fetchConversation(token, conversationId) {
  return request(`/conversations/${conversationId}`, { token });
}
