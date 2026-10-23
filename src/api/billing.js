import { request } from './client.js';

// Paying HeyDesk for a plan (backend D106). Owners only.

// `{plan, paid_until, active, replies_used, replies, moderators, plans: [{key, name, price,
// year_price, replies, moderators}], gateways}`. Prices are in poisha. `gateways`: the ones
// HeyDesk has set up, "sslcommerz" and/or "bkash" (backend D109).
export function fetchBilling() {
  return request('/billing');
}

// `{url}`: the gateway's page, SSLCommerz or bKash. A 400 says why it can't start.
export function startCheckout(plan, months, gateway) {
  return request('/billing/checkout', { method: 'POST', body: { plan, months, gateway } });
}
