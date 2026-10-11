// Opening hours as the API stores them: { mon: ["11:00", "22:00"], tue: null, ... }
// where a day that is null (or left out) is closed. A day's name is `days.<key>`
// in the language files.
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Every day present, times cut to HH:MM (the API answers "11:00:00").
export function normalizeHours(hours) {
  const result = {};
  DAYS.forEach((key) => {
    const day = hours && hours[key];
    result[key] = day ? [day[0].slice(0, 5), day[1].slice(0, 5)] : null;
  });
  return result;
}
