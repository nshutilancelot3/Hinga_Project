// Common crop disease names, for the diagnosis result screen. Free-text
// disease names from the backend fall back to showing the raw text
// unchanged, same pattern as crops.ts and weatherConditions.ts.
const DISEASES: Record<string, { rw: string; en: string }> = {
  'late blight': { rw: 'Indwara ya Late Blight', en: 'Late blight' },
  'early blight': { rw: 'Indwara ya Early Blight', en: 'Early blight' },
  'powdery mildew': { rw: 'Ubwoya bw\'ibihingwa', en: 'Powdery mildew' },
  'leaf rust': { rw: 'Igihumyo cy\'amababi', en: 'Leaf rust' },
  'leaf spot': { rw: 'Uducumu ku mababi', en: 'Leaf spot' },
  'bacterial wilt': { rw: 'Indwara ya bagiteri iyisha ibihingwa', en: 'Bacterial wilt' },
  'root rot': { rw: 'Kubora kw\'imizi', en: 'Root rot' },
  'mosaic virus': { rw: 'Virusi ya Mosaic', en: 'Mosaic virus' },
  anthracnose: { rw: 'Indwara ya Anthracnose', en: 'Anthracnose' },
  healthy: { rw: 'Igihingwa kimeze neza', en: 'Healthy' },
};

export function translateDisease(rawDiseaseName: string, locale: string) {
  const entry = DISEASES[rawDiseaseName.trim().toLowerCase()];
  if (!entry) return rawDiseaseName;
  return locale === 'rw' ? entry.rw : entry.en;
}
