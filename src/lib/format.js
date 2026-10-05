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
