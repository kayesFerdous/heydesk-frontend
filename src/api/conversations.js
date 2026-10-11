import { request } from './client.js';

// status is "active" or "needs_human"; leave it out for every conversation.
// Newest activity first, one page: up to `limit` before `before` (the last one's updated_at).
export function fetchConversations({ status, limit, before } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  const query = params.toString();
  return request('/conversations' + (query ? `?${query}` : ''));
}

// The transcript only. The orders, appointments or messages that came out of
// it come from the page's own records list (`byConversation` in records.js).
export function fetchConversation(conversationId) {
  return request(`/conversations/${conversationId}`);
}
