// Where a record may go next, mirrored from FLOWS in the backend's
// each table's FLOW (desks/*/models.py, models/team_message.py). The server is still the judge (409 invalid_transition); this
// only decides which button to offer, so the owner never meets a dead end.
//
// `primary` is the usual next step, `others` are the rarer ones.
export const FLOWS = {
  order: {
    // Waiting for its delivery charge online; the owner can take it another way.
    unpaid: { primary: { to: 'new', label: 'Mark as paid' }, others: [{ to: 'cancelled', label: 'Cancel order' }] },
    new: { primary: { to: 'ready', label: 'Mark as ready' }, others: [{ to: 'cancelled', label: 'Cancel order' }] },
    ready: { primary: { to: 'collected', label: 'Mark as collected' }, others: [{ to: 'cancelled', label: 'Cancel order' }] },
    collected: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  appointment: {
    unpaid: { primary: { to: 'new', label: 'Mark as paid' }, others: [{ to: 'cancelled', label: 'Cancel appointment' }] },
    new: { primary: { to: 'confirmed', label: 'Mark as confirmed' }, others: [{ to: 'cancelled', label: 'Cancel appointment' }] },
    confirmed: { primary: { to: 'done', label: 'Mark as done' }, others: [{ to: 'cancelled', label: 'Cancel appointment' }] },
    done: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  message: {
    new: { primary: { to: 'handled', label: 'Mark as handled' }, others: [] },
    handled: { primary: { to: 'new', label: 'Reopen' }, others: [] },
  },
};

export const STATUS_LABELS = {
  unpaid: 'Waiting for payment',
  new: 'New',
  ready: 'Ready',
  collected: 'Collected',
  cancelled: 'Cancelled',
  handled: 'Handled',
  confirmed: 'Confirmed',
  done: 'Done',
  needs_human: 'Needs a person',
  active: 'Active',
};

export function nextSteps(record) {
  const kind = FLOWS[record.job];
  return (kind && kind[record.status]) || { primary: null, others: [] };
}
