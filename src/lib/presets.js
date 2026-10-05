import { PhForkKnife, PhPhone, PhFirstAid, PhSparkle } from '@phosphor-icons/vue';

// Icons are the frontend's; the words come from the API. An unknown preset
// still renders, with a neutral icon.
const ICONS = {
  restaurant: PhForkKnife,
  receptionist: PhPhone,
  clinic: PhFirstAid,
};

export function presetIcon(id) {
  return ICONS[id] || PhSparkle;
}

// What one entry in the list is called, singular.
const NOUNS = {
  restaurant: 'dish',
  receptionist: 'service',
  clinic: 'doctor',
};

export function itemNoun(presetId) {
  return NOUNS[presetId] || 'item';
}

// Where a visitor opens the agent. The backend serves a plain chat page at
// /?key=<public key>; its address is set per environment in .env files.
export function chatLink(publicKey) {
  const base = process.env.VUE_APP_CHAT_BASE || window.location.origin;
  return `${base}/?key=${publicKey}`;
}
