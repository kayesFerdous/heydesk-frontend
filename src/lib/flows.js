import { t } from '../i18n/index.js';

// Where a record may go next, mirrored from FLOWS in the backend's
// each table's FLOW (desks/*/models.py, models/team_message.py). The server is still the judge (409 invalid_transition); this
// only decides which button to offer, so the owner never meets a dead end.
//
// `primary` is the usual next step, `others` are the rarer ones. A `label` is a
// key under `flows.` in the language files.
export const FLOWS = {
  order: {
    // Waiting for its delivery charge online; the owner can take it another way.
    unpaid: { primary: { to: 'new', label: 'markPaid' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    new: { primary: { to: 'ready', label: 'markReady' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    ready: { primary: { to: 'collected', label: 'markCollected' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    collected: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  // A shop's order: the shop phones to confirm, then a courier takes it (backend D45).
  shop_order: {
    unpaid: { primary: { to: 'new', label: 'markPaid' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    new: { primary: { to: 'confirmed', label: 'acceptOrder' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    confirmed: { primary: { to: 'shipped', label: 'markShipped' }, others: [{ to: 'cancelled', label: 'cancelOrder' }] },
    shipped: { primary: { to: 'delivered', label: 'markDelivered' }, others: [{ to: 'returned', label: 'markReturned' }] },
    delivered: { primary: null, others: [] },
    returned: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  appointment: {
    unpaid: { primary: { to: 'new', label: 'markPaid' }, others: [{ to: 'cancelled', label: 'cancelAppointment' }] },
    new: { primary: { to: 'confirmed', label: 'confirmTime' }, others: [{ to: 'cancelled', label: 'cancelAppointment' }] },
    confirmed: { primary: { to: 'done', label: 'markDone' }, others: [{ to: 'cancelled', label: 'cancelAppointment' }] },
    done: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  message: {
    new: { primary: { to: 'handled', label: 'markHandled' }, others: [] },
    handled: { primary: { to: 'new', label: 'reopen' }, others: [] },
  },
};

// "New", "Shipped", "Needs a person": an unknown status shows as it came.
export function statusLabel(status) {
  const key = `status.${status}`;
  const label = t(key);
  return label === key ? status : label;
}

// The buttons a record offers, with their words in the chosen language.
export function nextSteps(record) {
  const kind = FLOWS[record.flow || record.job];
  const steps = (kind && kind[record.status]) || { primary: null, others: [] };
  const worded = (step) => ({ ...step, label: t(`flows.${step.label}`) });
  return {
    primary: steps.primary && worded(steps.primary),
    others: steps.others.map(worded),
  };
}
