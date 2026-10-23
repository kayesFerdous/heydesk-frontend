import { request } from './client.js';

// A shop's courier (backend D90, D113): the owner links Steadfast or Pathao
// with the shop's own merchant login, and the agent books every confirmed
// order there and follows the parcel. The secret and password never come back.

// `{kind, store_id, sandbox, problem}`, or null while none is linked.
export async function fetchCourier() {
  try {
    return await request('/agent/courier');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// The server checks the keys with the courier first; a 422 says what it said.
export function connectCourier({ kind, key, secret, username, password, sandbox }) {
  return request('/agent/courier', {
    method: 'PUT',
    body: { kind, key, secret, username, password, sandbox },
  });
}

// Books the confirmed orders and asks about the parcels now, not in a minute.
export function syncCourier() {
  return request('/agent/courier/sync', { method: 'POST' });
}

export function disconnectCourier() {
  return request('/agent/courier', { method: 'DELETE' });
}
