import { request } from './client.js';

export function fetchBusinesses(token) {
  return request('/admin/businesses', { token });
}

// status is "active" or "suspended"; the API answers 204.
export function setBusinessStatus(token, workspaceId, status) {
  return request(`/admin/businesses/${workspaceId}`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export function fetchUsers(token) {
  return request('/admin/users', { token });
}

// A temporary password, shown once.
export function resetPassword(token, userId) {
  return request(`/admin/users/${userId}/password`, { method: 'POST', token });
}

// Newest first, one page: up to `limit` events before `before` (the last one's `at`).
export function fetchAudit(token, { limit, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  const query = params.toString();
  return request('/admin/audit' + (query ? `?${query}` : ''), { token });
}
