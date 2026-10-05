import { request } from './client.js';

// The sidebar numbers: each job the agent does, with how many are waiting.
export function fetchInbox(token) {
  return request('/inbox', { token });
}

// Orders and messages, newest first. `job` is "order" or "message".
export function fetchRecords(token, { job, status, q } = {}) {
  const params = new URLSearchParams();
  if (job) params.set('job', job);
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const query = params.toString();
  return request('/records' + (query ? `?${query}` : ''), { token });
}

export function setRecordStatus(token, recordId, status) {
  return request(`/records/${recordId}`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}
