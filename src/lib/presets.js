import { PhForkKnife, PhPhone, PhFirstAid, PhSparkle, PhStethoscope, PhStorefront, PhTShirt } from '@phosphor-icons/vue';

// Icons are the frontend's; the words come from the API. An unknown preset
// still renders, with a neutral icon.
const ICONS = {
  restaurant: PhForkKnife,
  receptionist: PhPhone,
  clinic: PhFirstAid,
  shop: PhStorefront,
};

export function presetIcon(id) {
  return ICONS[id] || PhSparkle;
}

// What one entry in the list is called, singular.
const NOUNS = {
  restaurant: 'dish',
  receptionist: 'service',
  clinic: 'doctor',
  shop: 'product',
};

export function itemNoun(presetId) {
  return NOUNS[presetId] || 'item';
}

// Where a visitor opens the agent: this app's own chat page, /chat/<public key>
// (pages/chat/ChatPage.vue). The link is on PUBLIC_URL when scripts/dev.sh passes
// one, so a link copied on localhost still opens on a customer's phone; else on
// this page's own address.
export function chatLink(publicKey) {
  const base = process.env.VUE_APP_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/chat/${publicKey}`;
}

// The navigation link to a desk's own list: a restaurant's menu, a clinic's
// doctors, a shop's products. A receptionist has none (its services are on the Agent page).
const LISTS = {
  restaurant: { label: 'Menu', icon: PhForkKnife },
  clinic: { label: 'Doctors', icon: PhStethoscope },
  shop: { label: 'Products', icon: PhTShirt },
};

export function listLinks(presetId) {
  const list = LISTS[presetId];
  return list ? [{ to: '/menu', label: list.label, icon: list.icon }] : [];
}
