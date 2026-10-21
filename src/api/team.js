import { request } from './client.js';

// The business's team (backend D97): the owner and the moderators they added.
// `[{id, email, role: owner/moderator, status: active/invited, invited_at, joined_at}]`.
export function fetchMembers() {
  return request('/team/members');
}

// A moderator by email: they get a code and join from "Forgot password?" on the sign-in page.
export function inviteMember(email) {
  return request('/team/members', { method: 'POST', body: { email } });
}

export function resendInvite(userId) {
  return request(`/team/members/${userId}/invite`, { method: 'POST' });
}

// Out at once: their next request signs them out.
export function removeMember(userId) {
  return request(`/team/members/${userId}`, { method: 'DELETE' });
}

// What the team changed, newest first; the next page is `before` the last one's `at`.
export function fetchActivity({ limit, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  const query = params.toString();
  return request('/team/activity' + (query ? `?${query}` : ''));
}
