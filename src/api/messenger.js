import { request } from './client.js';

// The business's Facebook Page on Messenger (backend D60). The Page access
// token goes in once and never comes back: the server keeps it.

// `{page_id, link}`, or null while no Page is connected.
export async function fetchMessenger() {
  try {
    return await request('/agent/messenger');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Checks the token with Facebook and starts answering the Page's messages.
export function connectMessenger(pageToken) {
  return request('/agent/messenger', { method: 'PUT', body: { token: pageToken } });
}

export function disconnectMessenger() {
  return request('/agent/messenger', { method: 'DELETE' });
}
