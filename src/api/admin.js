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

export function fetchAudit(token) {
  return request('/admin/audit', { token });
}
