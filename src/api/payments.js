import { request } from './client.js';

// The business's own SSLCommerz store (backend D49): customers' payments go
// straight to it. The store password goes in once and never comes back.

// `{store_id, sandbox, connected_at}`, or null while none is connected.
export async function fetchSslcommerz(token) {
  try {
    return await request('/agent/sslcommerz', { token });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// The server checks these with SSLCommerz first; a 400 says what it said.
export function connectSslcommerz(token, { storeId, password, sandbox }) {
  return request('/agent/sslcommerz', {
    method: 'PUT',
    body: { store_id: storeId, password, sandbox },
    token,
  });
}

export function disconnectSslcommerz(token) {
  return request('/agent/sslcommerz', { method: 'DELETE', token });
}
