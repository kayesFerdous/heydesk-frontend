// How the backend's raw values are shown to an owner. Money arrives in minor
// units (45000 means ৳450) and times arrive in UTC.
export function formatMoney(minorUnits) {
  const whole = Math.round(minorUnits) / 100;
  return '৳' + whole.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatTime(isoString, timeZone = 'Asia/Dhaka') {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

export function formatDay(isoString, timeZone = 'Asia/Dhaka') {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone,
  });
}

// A message split into plain text and web links, so a page can make the links
// clickable without v-html: [{ text }, { text, url }, …]. Trailing punctuation
// stays text: "Pay here: https://x/pay/1." links https://x/pay/1.
export function linkParts(text) {
  return text.split(/(https?:\/\/[^\s]+[^\s.,;:!?)])/).filter(Boolean).map((part) =>
    /^https?:\/\//.test(part) ? { text: part, url: part } : { text: part },
  );
}

// "Good morning" by the clock where the business is, not where the browser is.
export function greeting(timeZone = 'Asia/Dhaka') {
  const hour = Number(
    new Date().toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone })
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// "5 min ago", "2 h ago", else the day: for rows where recency matters more than the clock.
export function formatAgo(isoString, timeZone = 'Asia/Dhaka') {
  const minutes = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 12) return `${Math.round(minutes / 60)} h ago`;
  return formatDay(isoString, timeZone);
}
