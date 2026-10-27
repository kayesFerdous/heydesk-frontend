import { request } from './client.js';

// The business's WhatsApp number (backend D103). The token goes in once and
// never comes back: the server keeps it.

// `{phone_id}`, or null while no number is connected.
export async function fetchWhatsApp() {
  try {
    return await request('/agent/whatsapp');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Subscribes the business account (Meta checks the token, account and number
// together) and starts answering the number's messages.
export function connectWhatsApp(accountId, phoneId, token) {
  return request('/agent/whatsapp', { method: 'PUT', body: { account_id: accountId, phone_id: phoneId, token } });
}

export function disconnectWhatsApp() {
  return request('/agent/whatsapp', { method: 'DELETE' });
}

// Connect with WhatsApp (backend D155): `{app_id, config_id}` for Meta's Embedded Signup window.
export function fetchWhatsAppLogin() {
  return request('/agent/whatsapp/login');
}

// Connects the number the owner added in that window; the server swaps the code for its token.
export function connectWhatsAppSignup(code, accountId, phoneId) {
  return request('/agent/whatsapp/signup', { method: 'POST', body: { code, account_id: accountId, phone_id: phoneId } });
}
