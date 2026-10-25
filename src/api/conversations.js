import { request } from './client.js';

// status is "active", "needs_human" or "human" (the team is answering on Telegram); leave it out for every conversation.
// channel is web, voice, telegram, messenger or whatsapp; leave it out for every channel.
// assigned is "me" (the caller's) or "none" (no one has it, backend I1); leave it out for all.
// Done and snoozed chats are left out; done: true lists only the done ones. q searches every
// chat's name and what was said, a phone or an order code too (backend I3).
// Newest activity first, one page: up to `limit` before `before` (the last one's updated_at).
export function fetchConversations({ status, channel, assigned, q, done, limit, before } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (assigned) params.set('assigned', assigned);
  if (q) params.set('q', q);
  if (done) params.set('done', 'true');
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

// Who has the chat (backend I1): a team member's id, or null for no one. The owner gives any
// chat to anyone; a moderator takes a free one (their own id) and gives back their own (null).
export function assignConversation(conversationId, userId) {
  return request(`/conversations/${conversationId}/assignee`, { method: 'PUT', body: { user_id: userId } });
}

// Block or unblock a visitor, or turn the AI off or on for them (backend I2): { blocked } or
// { ai_off }. Owners and moderators. Returns the visitor as it is now.
export function changeVisitor(visitorId, change) {
  return request(`/visitors/${visitorId}`, { method: 'PATCH', body: change });
}

// Who is blocked now, with their latest chat, newest block first (backend I2).
export function fetchBlocked() {
  return request('/visitors/blocked');
}

// Done hides the chat until the buyer writes again; false shows it again (backend I3).
export function markDone(conversationId, done) {
  return request(`/conversations/${conversationId}/done`, { method: 'PUT', body: { done } });
}

// Hides the chat until `until` (an ISO time in the next 30 days), when it comes back with an
// alert; null brings it back now (backend I3).
export function snoozeConversation(conversationId, until) {
  return request(`/conversations/${conversationId}/snooze`, { method: 'PUT', body: { until } });
}
