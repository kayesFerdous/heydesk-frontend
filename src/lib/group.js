import { t, localeTag } from '../i18n/index.js';

// Lists read as a timeline (Today, Yesterday, ...) rather than one long pile,
// the way ChatGPT groups its history. Days are decided in the agent's timezone.

// How many rows one page of a long list asks the server for ("Show more" asks for the next).
export const PAGE_SIZE = 30;

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
    if (key === today) label = t('format.today');
    else if (key === yesterday) label = t('format.yesterday');
    else
      label = new Date(item[field]).toLocaleDateString(localeTag(), {
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
// same name always gets the same tint. No green or amber: those mean "live"
// and "needs a person", never decoration.
const AVATAR_TINTS = [
  'bg-brand-tint text-brand',
  'bg-brand-tint-strong text-brand-hover',
  'bg-hover text-ink-soft',
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

// Whether a moment falls on today's date where the business is.
export function isToday(isoString, timeZone = 'Asia/Dhaka') {
  return dayKey(isoString, timeZone) === dayKey(new Date().toISOString(), timeZone);
}

// The hour (0 to 23) a moment falls in, where the business is.
export function hourOf(isoString, timeZone = 'Asia/Dhaka') {
  return Number(new Date(isoString).toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }));
}

// Today's items added up per hour: 24 numbers, 00:00 first. `value` says what
// one item adds (1 to count them, its total to add up money).
export function todayByHour(items, timeZone = 'Asia/Dhaka', value = () => 1) {
  const hours = Array(24).fill(0);
  for (const item of items) {
    if (isToday(item.created_at, timeZone)) hours[hourOf(item.created_at, timeZone)] += value(item);
  }
  return hours;
}
