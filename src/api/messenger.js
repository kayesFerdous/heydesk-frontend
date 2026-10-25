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

// Subscribes the Page (its id and access token, which Facebook checks as a pair)
// and starts answering its messages.
export function connectMessenger(pageId, pageToken) {
  return request('/agent/messenger', { method: 'PUT', body: { page_id: pageId, token: pageToken } });
}

// Connect with Facebook (backend D118): `{app_id, scope}` for Facebook's login.
export function fetchFacebookLogin() {
  return request('/agent/messenger/login');
}

// The Pages the owner's Facebook login manages: `[{id, name}]`.
export function fetchFacebookPages(userToken) {
  return request('/agent/messenger/pages', { method: 'POST', body: { user_token: userToken } });
}

// Connects one of them; the server takes its token from the login.
export function connectFacebookPage(userToken, pageId) {
  return request('/agent/messenger/facebook', {
    method: 'POST',
    body: { user_token: userToken, page_id: pageId },
  });
}

export function disconnectMessenger() {
  return request('/agent/messenger', { method: 'DELETE' });
}
