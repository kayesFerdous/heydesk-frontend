import { request } from './client.js';

// Paying HeyDesk for a plan (backend D106). Owners only.

// `{plan, paid_until, active, replies_used, replies, moderators, plans: [{key, name, price,
// year_price, replies, moderators}]}`. Prices are in poisha.
export function fetchBilling() {
  return request('/billing');
}

// `{url}`: our SSLCommerz page. A 400 says why it can't start (no store set up yet).
export function startCheckout(plan, months) {
  return request('/billing/checkout', { method: 'POST', body: { plan, months } });
}
