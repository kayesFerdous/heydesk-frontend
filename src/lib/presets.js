import { PhForkKnife, PhPhone, PhFirstAid, PhSparkle, PhStethoscope } from '@phosphor-icons/vue';

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
// /?key=<public key>; the dev server forwards /demo/ to it (vue.config.js), so the
// link uses whatever address this page was opened from: localhost or a tunnel.
export function chatLink(publicKey) {
  return `${window.location.origin}/demo/?key=${publicKey}`;
}

// The navigation link to a desk's own list: a restaurant's menu, a clinic's
// doctors. A receptionist has none (its services are on the Agent page).
const LISTS = {
  restaurant: { label: 'Menu', icon: PhForkKnife },
  clinic: { label: 'Doctors', icon: PhStethoscope },
};

export function listLinks(presetId) {
  const list = LISTS[presetId];
  return list ? [{ to: '/menu', label: list.label, icon: list.icon }] : [];
}
