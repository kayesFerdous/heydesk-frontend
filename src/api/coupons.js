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
