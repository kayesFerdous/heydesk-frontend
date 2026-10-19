// Small helpers for the calls that confirm a shop's orders (backend D89).

// The backend's own phone page, through the dev server's /demo proxy (vite.config.js):
// opened on a real phone, it rings like a phone when the agent calls that number.
export function phoneLink() {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/demo/phone`;
}

// What a call's chip shows: where it is while it lasts, how it went once it is done.
export function callState(call) {
  return call.status === 'done' ? call.outcome : call.status;
}

// A finished call the owner may want to try again. The server still decides (409
// when the order is not new any more).
export function canCallAgain(call) {
  return call.status === 'done' && ['no_answer', 'no_decision', 'stopped'].includes(call.outcome);
}
