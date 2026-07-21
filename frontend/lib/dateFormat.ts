// Chrome and most browsers have no built-in Kinyarwanda date data at all
// (Intl.DateTimeFormat.supportedLocalesOf(['rw']) returns an empty array),
// so toLocaleDateString('rw', ...) silently falls back to English instead
// of erroring. These tables format dates by hand instead of relying on it.

const WEEKDAYS_RW = ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTHS_RW = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatLongDate(date: Date, locale: string) {
  const weekday = locale === 'rw' ? WEEKDAYS_RW[date.getDay()] : WEEKDAYS_EN[date.getDay()];
  const month = locale === 'rw' ? MONTHS_RW[date.getMonth()] : MONTHS_EN[date.getMonth()];
  return locale === 'rw'
    ? `${weekday}, ${date.getDate()} ${month}`
    : `${weekday}, ${month} ${date.getDate()}`;
}

export function formatShortDate(date: Date, locale: string) {
  const month = locale === 'rw' ? MONTHS_RW[date.getMonth()].slice(0, 3) : MONTHS_EN[date.getMonth()].slice(0, 3);
  return locale === 'rw' ? `${date.getDate()} ${month} ${date.getFullYear()}` : `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
