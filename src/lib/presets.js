import { PhForkKnife, PhPhone, PhFirstAid, PhSparkle, PhStethoscope, PhStorefront, PhTShirt } from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';

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

const KNOWN = ['restaurant', 'receptionist', 'clinic', 'shop'];

// What one entry in the list is called: "dish" for one, "dishes" for `count`.
export function itemNoun(presetId, count = 1) {
  return t(`presets.noun.${KNOWN.includes(presetId) ? presetId : 'other'}`, count);
}

// A kind of business in the chosen language. The API's own words are kept for
// a kind the frontend has not heard of yet.
export function presetLabel(preset) {
  return KNOWN.includes(preset.id) ? t(`presets.label.${preset.id}`) : preset.label;
}

export function presetDescription(preset) {
  return KNOWN.includes(preset.id) ? t(`presets.description.${preset.id}`) : preset.description;
}

// What the preset calls the list the owner keeps: Menu, Services, Doctors.
export function itemsLabel(presetId) {
  return t(`presets.items.${KNOWN.includes(presetId) ? presetId : 'other'}`);
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
const LIST_ICONS = {
  restaurant: PhForkKnife,
  clinic: PhStethoscope,
  shop: PhTShirt,
};

export function listLinks(presetId) {
  const icon = LIST_ICONS[presetId];
  return icon ? [{ to: '/menu', label: itemsLabel(presetId), icon }] : [];
}
