import { PhForkKnife, PhPhone, PhFirstAid, PhStorefront, PhTShirt } from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';

// The services HeyDesk offers, in the order the first page shows them. Only the
// shop is live (backend D164); the others show "Coming soon" and cannot be picked.
export const SERVICES = [
  { id: 'shop', icon: PhStorefront, live: true },
  { id: 'restaurant', icon: PhForkKnife, live: false },
  { id: 'clinic', icon: PhFirstAid, live: false },
  { id: 'receptionist', icon: PhPhone, live: false },
];

export function serviceLabel(id) {
  return SERVICES.some((service) => service.id === id) ? t(`presets.label.${id}`) : id;
}

export function serviceDescription(id) {
  return t(`presets.description.${id}`);
}

// What one product is called: "product" for one, "products" for `count`.
export function itemNoun(count = 1) {
  return t('presets.noun.shop', count);
}

// What the list the owner keeps is called, in the nav and on its page.
export function itemsLabel() {
  return t('presets.items.shop');
}

// Where a visitor opens the agent: this app's own chat page, /chat/<public key>
// (pages/chat/ChatPage.vue). The link is on PUBLIC_URL when scripts/dev.sh passes
// one, so a link copied on localhost still opens on a customer's phone; else on
// this page's own address.
export function chatLink(publicKey) {
  return `${publicBase()}/chat/${publicKey}`;
}

function publicBase() {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return base.replace(/\/$/, '');
}

// A product's public page, on the backend (D121) and forwarded to it from here, so the
// link the team copies is on this app's address: /p/<key>/<code>, nothing after it (D162).
export function productLink(publicKey, code) {
  return `${publicBase()}/p/${publicKey}/${encodeURIComponent(code)}`;
}

// The navigation link to the shop's own list: its products.
export function listLinks() {
  return [{ to: '/menu', label: itemsLabel(), icon: PhTShirt }];
}
