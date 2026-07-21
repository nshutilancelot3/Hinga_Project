const CROPS: Record<string, { rw: string; en: string }> = {
  beans: { rw: 'Ibishyimbo', en: 'Beans' },
  maize: { rw: 'Ibigori', en: 'Maize' },
  potatoes: { rw: 'Ibirayi', en: 'Potatoes' },
  rice: { rw: 'Umuceri', en: 'Rice' },
  cassava: { rw: 'Imyumbati', en: 'Cassava' },
  sorghum: { rw: 'Amasaka', en: 'Sorghum' },
  bananas: { rw: 'Ibitoki', en: 'Bananas' },
  tomatoes: { rw: 'Inyanya', en: 'Tomatoes' },
  cabbage: { rw: 'Ishu', en: 'Cabbage' },
  carrots: { rw: 'Karoti', en: 'Carrots' },
  onions: { rw: 'Igitunguru', en: 'Onions' },
  peas: { rw: 'Amashaza', en: 'Peas' },
  groundnuts: { rw: 'Ubunyobwa', en: 'Groundnuts' },
  coffee: { rw: 'Ikawa', en: 'Coffee' },
  tea: { rw: 'Icyayi', en: 'Tea' },
  pineapple: { rw: 'Inanasi', en: 'Pineapple' },
  avocado: { rw: 'Avoka', en: 'Avocado' },
};

export function translateCrop(rawCropName: string, locale: string) {
  const entry = CROPS[rawCropName.trim().toLowerCase()];
  if (!entry) return rawCropName;
  return locale === 'rw' ? entry.rw : entry.en;
}
