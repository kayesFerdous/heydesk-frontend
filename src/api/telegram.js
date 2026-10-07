import { request } from './client.js';

// The business's own Telegram bot (backend D42). The bot's token from
// @BotFather goes in once and never comes back: the server keeps it.

// `{username, link}`, or null while no bot is connected.
export async function fetchTelegram(token) {
  try {
    return await request('/agent/telegram', { token });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Checks the token with Telegram and starts answering the bot's messages.
export function connectTelegram(token, botToken) {
  return request('/agent/telegram', { method: 'PUT', body: { token: botToken }, token });
}

export function disconnectTelegram(token) {
  return request('/agent/telegram', { method: 'DELETE', token });
}

// BotFather's reply is a paragraph with the token in the middle, so the owner
// can paste all of it. A token is the bot's number, a colon and 35 characters.
const BOT_TOKEN = /\d{5,}:[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/;

export function findBotToken(text) {
  const match = text.match(BOT_TOKEN);
  return match ? match[0] : null;
}

// A username BotFather will likely accept: "Spice Garden" -> "spice_garden_bot".
// Telegram wants 5 to 32 letters, digits or underscores, ending in "bot".
export function suggestUsername(businessName) {
  const base = (businessName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28);
  return `${base || 'my_business'}_bot`;
}
