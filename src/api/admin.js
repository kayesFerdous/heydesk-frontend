import { request } from './client.js';

export function fetchBusinesses() {
  return request('/admin/businesses');
}

// status is "active" or "suspended"; the API answers 204.
export function setBusinessStatus(workspaceId, status) {
  return request(`/admin/businesses/${workspaceId}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function fetchUsers() {
  return request('/admin/users');
}

// A temporary password, shown once.
export function resetPassword(userId) {
  return request(`/admin/users/${userId}/password`, { method: 'POST' });
}

// Newest first, one page: up to `limit` events before `before` (the last one's `at`).
export function fetchAudit({ limit, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  const query = params.toString();
  return request('/admin/audit' + (query ? `?${query}` : ''));
}
