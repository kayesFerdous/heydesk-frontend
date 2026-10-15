import { request } from './client.js';

// What every agent did today and in the last 7 days, from the saved turns (backend D72).
export function fetchOverview() {
  return request('/admin/overview');
}

export function fetchBusinesses() {
  return request('/admin/businesses');
}

// status is "active" or "suspended"; suspending needs a reason (backend D70), for
// admins only. The API answers 204.
export function setBusinessStatus(workspaceId, status, reason = '') {
  return request(`/admin/businesses/${workspaceId}`, {
    method: 'PATCH',
    body: { status, reason },
  });
}

// One business at a glance: its desk, owners, connections and counts (backend D69).
export function fetchBusiness(workspaceId) {
  return request(`/admin/businesses/${workspaceId}`);
}

export function fetchUsers() {
  return request('/admin/users');
}

// A temporary password, shown once.
export function resetPassword(userId) {
  return request(`/admin/users/${userId}/password`, { method: 'POST' });
}

// Newest first, one page: up to `limit` events before `before` (the last one's `at`);
// only one business's with `workspaceId`.
export function fetchAudit({ limit, before, workspaceId } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  if (workspaceId) params.set('workspace_id', workspaceId);
  const query = params.toString();
  return request('/admin/audit' + (query ? `?${query}` : ''));
}
