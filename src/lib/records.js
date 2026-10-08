// How one order, appointment or message is described in a single line, the
// same way on Home and in the Inbox.
export function summarize(record) {
  if (record.kind === 'order' && record.lines) {
    return record.lines
      .map((line) => (line.quantity > 1 ? `${line.quantity} ${line.name}` : line.name))
      .join(', ');
  }
  if (record.job === 'appointment' && record.details.doctor) {
    return `${record.details.doctor}, ${record.details.time}`;
  }
  return record.note || record.details.message || 'Message for the team';
}

// The Inbox tab a record lives under, plural: "Orders", "Appointments", "Messages".
export const JOB_TABS = {
  order: 'Orders',
  appointment: 'Appointments',
  message: 'Messages',
};
