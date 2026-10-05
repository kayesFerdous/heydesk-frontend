// Lists read as a timeline (Today, Yesterday, ...) rather than one long pile,
// the way ChatGPT groups its history. Days are decided in the agent's timezone.
function dayKey(isoString, timeZone) {
  return new Date(isoString).toLocaleDateString('en-CA', { timeZone });
}

export function groupByDay(items, field = 'created_at', timeZone = 'Asia/Dhaka') {
  const now = new Date();
  const today = dayKey(now.toISOString(), timeZone);
  const yesterday = dayKey(new Date(now.getTime() - 86400000).toISOString(), timeZone);

  const groups = [];
  items.forEach((item) => {
    const key = dayKey(item[field], timeZone);
    let label;
    if (key === today) label = 'Today';
    else if (key === yesterday) label = 'Yesterday';
    else
      label = new Date(item[field]).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        timeZone,
      });

    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  });
  return groups;
}

// A fixed set of brand-family tints so a list has rhythm without photos. The
// same name always gets the same tint.
const AVATAR_TINTS = [
  'bg-brand-tint text-brand',
  'bg-success-tint text-success',
  'bg-wash text-navy',
  'bg-attention-tint text-attention',
];

export function avatarTint(name) {
  let sum = 0;
  for (const char of name || '?') sum += char.charCodeAt(0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export function initials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
