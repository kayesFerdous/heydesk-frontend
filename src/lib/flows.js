// Where a record may go next, mirrored from FLOWS in the backend's
// models/record.py. The server is still the judge (409 invalid_transition); this
// only decides which button to offer, so the owner never meets a dead end.
//
// `primary` is the usual next step, `others` are the rarer ones.
export const FLOWS = {
  order: {
    new: { primary: { to: 'ready', label: 'Mark as ready' }, others: [{ to: 'cancelled', label: 'Cancel order' }] },
    ready: { primary: { to: 'collected', label: 'Mark as collected' }, others: [{ to: 'cancelled', label: 'Cancel order' }] },
    collected: { primary: null, others: [] },
    cancelled: { primary: null, others: [] },
  },
  request: {
    new: { primary: { to: 'handled', label: 'Mark as handled' }, others: [{ to: 'archived', label: 'Archive' }] },
    handled: { primary: { to: 'archived', label: 'Archive' }, others: [{ to: 'new', label: 'Reopen' }] },
    archived: { primary: { to: 'new', label: 'Reopen' }, others: [] },
  },
};

export const STATUS_LABELS = {
  new: 'New',
  ready: 'Ready',
  collected: 'Collected',
  cancelled: 'Cancelled',
  handled: 'Handled',
  archived: 'Archived',
  needs_human: 'Needs a person',
  active: 'Active',
};

export function nextSteps(record) {
  const kind = FLOWS[record.kind];
  return (kind && kind[record.status]) || { primary: null, others: [] };
}
