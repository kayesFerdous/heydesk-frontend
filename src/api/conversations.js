import { request } from './client.js';

// status is "active", "needs_human" or "human" (the team is answering on Telegram); leave it out for every conversation.
// channel is web, voice, telegram, messenger or whatsapp; leave it out for every channel.
// Newest activity first, one page: up to `limit` before `before` (the last one's updated_at).
export function fetchConversations({ status, channel, limit, before } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (channel) params.set('channel', channel);
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

// A person dealt with the hand-off: the agent answers this chat again (backend D83).
// 409 invalid_transition if nobody was waiting any more.
export function markHandled(conversationId) {
  return request(`/conversations/${conversationId}`, { method: 'PATCH', body: { status: 'active' } });
}
