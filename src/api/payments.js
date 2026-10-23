import { request } from './client.js';

// The business's own SSLCommerz store (backend D49): customers' payments go
// straight to it. The store password goes in once and never comes back.

// `{store_id, sandbox, connected_at}`, or null while none is connected.
export async function fetchSslcommerz() {
  try {
    return await request('/agent/sslcommerz');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// The server checks these with SSLCommerz first; a 400 says what it said.
export function connectSslcommerz({ storeId, password, sandbox }) {
  return request('/agent/sslcommerz', {
    method: 'PUT',
    body: { store_id: storeId, password, sandbox },
  });
}

export function disconnectSslcommerz() {
  return request('/agent/sslcommerz', { method: 'DELETE' });
}

// The business's own bKash merchant account (backend D109), beside or instead of
// SSLCommerz. The app secret and password go in once and never come back.

// `{username, sandbox, connected_at}`, or null while none is connected.
export async function fetchBkash() {
  try {
    return await request('/agent/bkash');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// The server asks bKash for a token with these first; a 400 says what bKash said.
export function connectBkash({ appKey, appSecret, username, password, sandbox }) {
  return request('/agent/bkash', {
    method: 'PUT',
    body: { app_key: appKey, app_secret: appSecret, username, password, sandbox },
  });
}

export function disconnectBkash() {
  return request('/agent/bkash', { method: 'DELETE' });
}
