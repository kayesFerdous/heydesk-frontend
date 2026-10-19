import { request } from './client.js';

// The calls that confirm a shop's new orders (backend D88, D89): a queue the
// agent works through, one call at a time, inside the shop's calling hours.

// view "waiting": ringing or talking first, then the queue in the order it is
// called (each queued call has its `place`, 1 is next). view "done": the last
// 100, newest first. With orderId: that order's calls, newest first.
export function fetchCalls({ view = 'waiting', orderId } = {}) {
  const params = new URLSearchParams({ view });
  if (orderId) params.set('order_id', orderId);
  return request(`/calls?${params}`);
}

// Call a new order now, first in the queue. 409 while calls are off, or when the
// order is not new or already has a call waiting.
export function callOrder(orderId) {
  return request('/calls', { method: 'POST', body: { order_id: orderId } });
}

// A queued call moves to the front and is due now.
export function callNow(callId) {
  return request(`/calls/${callId}/now`, { method: 'POST' });
}

// Cancel a queued call: it is done as "stopped", and the order stays as it is.
export function stopCall(callId) {
  return request(`/calls/${callId}`, { method: 'DELETE' });
}
