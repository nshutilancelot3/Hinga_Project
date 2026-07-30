// Chrome and most browsers have no built-in Kinyarwanda date data at all
// (Intl.DateTimeFormat.supportedLocalesOf(['rw']) returns an empty array),
// so toLocaleDateString('rw', ...) silently falls back to English instead
// of erroring. These tables format dates by hand instead of relying on it.

const WEEKDAYS_RW = ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Short forms for compact UI (e.g. a 5-day forecast row), distinct enough at a
// glance despite three of the full names all starting with "Gatan-/Gatat-".
const WEEKDAYS_SHORT_RW = ['Cyu', 'Mbe', 'Kab', 'Gtu', 'Kan', 'Gnu', 'Gtd'];
const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS_RW = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatLongDate(date: Date, locale: string) {
  const weekday = locale === 'rw' ? WEEKDAYS_RW[date.getDay()] : WEEKDAYS_EN[date.getDay()];
  const month = locale === 'rw' ? MONTHS_RW[date.getMonth()] : MONTHS_EN[date.getMonth()];
  return locale === 'rw'
    ? `${weekday}, ${date.getDate()} ${month}`
    : `${weekday}, ${month} ${date.getDate()}`;
}

export function formatShortWeekday(date: Date, locale: string) {
  return locale === 'rw' ? WEEKDAYS_SHORT_RW[date.getDay()] : WEEKDAYS_SHORT_EN[date.getDay()];
}

// Sunday-first list of {short, full} pairs so a UI can render a legend mapping
// the Kinyarwanda short form back to the full English weekday name.
export function weekdayKey() {
  return WEEKDAYS_SHORT_RW.map((short, i) => ({ short, full: WEEKDAYS_EN[i] }));
}

export function formatShortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
