import { formatDay, formatTime } from './format.js';

// "Blocked by rafi@example.com" or "Blocked for flooding, until 26 Oct, 14:00" (backend I2).
export function blockedLine(visitor, t) {
  const why =
    visitor.blocked_why === 'team'
      ? t('conversations.them.byTeam', { email: visitor.blocked_by || '' })
      : t(`conversations.them.why.${visitor.blocked_why}`);
  if (!visitor.blocked_until) return why;
  const until = `${formatDay(visitor.blocked_until)}, ${formatTime(visitor.blocked_until)}`;
  return t('conversations.them.until', { why, until });
}
