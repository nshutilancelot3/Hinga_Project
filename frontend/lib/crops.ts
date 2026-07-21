type CropEntry = { aliases: string[]; rw: string; en: string };

const CROPS: CropEntry[] = [
  { aliases: ['beans', 'bean'], rw: 'Ibishyimbo', en: 'Beans' },
  { aliases: ['maize', 'corn'], rw: 'Ibigori', en: 'Maize' },
  { aliases: ['potatoes', 'potato', 'irish potato', 'irish potatoes'], rw: 'Ibirayi', en: 'Irish potatoes' },
  { aliases: ['sweet potatoes', 'sweet potato'], rw: 'Ibijumba', en: 'Sweet potatoes' },
  { aliases: ['rice'], rw: 'Umuceri', en: 'Rice' },
  { aliases: ['cassava'], rw: 'Imyumbati', en: 'Cassava' },
  { aliases: ['sorghum'], rw: 'Amasaka', en: 'Sorghum' },
  { aliases: ['bananas', 'banana', 'plantain', 'plantains'], rw: 'Ibitoki', en: 'Bananas' },
  { aliases: ['tomatoes', 'tomato'], rw: 'Inyanya', en: 'Tomatoes' },
  { aliases: ['cabbage', 'cabbages'], rw: 'Ishu', en: 'Cabbage' },
  { aliases: ['carrots', 'carrot'], rw: 'Karoti', en: 'Carrots' },
  { aliases: ['onions', 'onion'], rw: 'Igitunguru', en: 'Onions' },
  { aliases: ['peas', 'pea'], rw: 'Amashaza', en: 'Peas' },
  { aliases: ['groundnuts', 'groundnut', 'peanuts', 'peanut'], rw: 'Ubunyobwa', en: 'Groundnuts' },
  { aliases: ['coffee', 'coffee cherries', 'coffee cherry'], rw: 'Ikawa', en: 'Coffee' },
  { aliases: ['tea'], rw: 'Icyayi', en: 'Tea' },
  { aliases: ['pineapple', 'pineapples'], rw: 'Inanasi', en: 'Pineapple' },
  { aliases: ['avocado', 'avocados'], rw: 'Avoka', en: 'Avocado' },
];

const LOOKUP: Record<string, CropEntry> = {};
for (const entry of CROPS) {
  for (const alias of entry.aliases) {
    LOOKUP[alias] = entry;
  }
}

export function translateCrop(rawCropName: string, locale: string) {
  const entry = LOOKUP[rawCropName.trim().toLowerCase()];
  if (!entry) return rawCropName;
  return locale === 'rw' ? entry.rw : entry.en;
}
