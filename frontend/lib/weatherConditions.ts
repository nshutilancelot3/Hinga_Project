// OpenWeatherMap uses a small fixed set of condition descriptions, so a
// dictionary covers this reliably instead of calling out to a translation API.
const CONDITIONS: Record<string, { rw: string; en: string }> = {
  'clear sky': { rw: 'Ikirere gisa neza', en: 'Clear sky' },
  'few clouds': { rw: 'Ibicu bike', en: 'Few clouds' },
  'scattered clouds': { rw: 'Ibicu bikwirakwiriye', en: 'Scattered clouds' },
  'broken clouds': { rw: 'Ibicu byinshi', en: 'Broken clouds' },
  'overcast clouds': { rw: 'Ikirere cyuzuye ibicu', en: 'Overcast clouds' },
  'light rain': { rw: 'Imvura nkeya', en: 'Light rain' },
  'moderate rain': { rw: 'Imvura iringaniye', en: 'Moderate rain' },
  'heavy intensity rain': { rw: 'Imvura nyinshi', en: 'Heavy rain' },
  'very heavy rain': { rw: 'Imvura nyinshi cyane', en: 'Very heavy rain' },
  'light intensity shower rain': { rw: 'Agahindu k\'imvura nkeya', en: 'Light shower rain' },
  'shower rain': { rw: 'Agahindu k\'imvura', en: 'Shower rain' },
  thunderstorm: { rw: 'Inkuba n\'umuyaga', en: 'Thunderstorm' },
  snow: { rw: 'Urubura', en: 'Snow' },
  mist: { rw: 'Igihu', en: 'Mist' },
  haze: { rw: 'Umwotsi', en: 'Haze' },
  fog: { rw: 'Igihu kinini', en: 'Fog' },
  drizzle: { rw: 'Imvura nto', en: 'Drizzle' },
  tornado: { rw: 'Umuyaga mwinshi', en: 'Tornado' },
};

export function translateCondition(rawDescription: string, locale: string) {
  const entry = CONDITIONS[rawDescription.trim().toLowerCase()];
  if (!entry) return rawDescription;
  return locale === 'rw' ? entry.rw : entry.en;
}
