import { request } from './client.js';

// A shop's coupon codes (backend D133): the buyer says one in the chat, the
// backend checks it and takes it off the bill.
// `[{code, kind: percent/amount/free_delivery, value, ends_at, max_uses, used}]`;
// `value` is a percent, or minor units for an amount; `used`: orders placed with it.
export function fetchCoupons() {
  return request('/shop/coupons');
}

export function addCoupon(coupon) {
  return request('/shop/coupons', { method: 'POST', body: coupon });
}

// The code stops working; orders placed with it keep their discount.
export function deleteCoupon(code) {
  return request(`/shop/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

// An offer (backend D140): `{text, kind, value, ends_at}` sent to every chat that wrote in
// the last 24 hours, and saved as a coupon only they may use until it ends (`OFFER1`, ...).
// → `{code, sent_to}`: its code and how many chats got it.
export function sendOffer(offer) {
  return request('/shop/offers', { method: 'POST', body: offer });
}
