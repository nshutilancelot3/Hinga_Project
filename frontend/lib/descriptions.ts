type DescriptionEntry = { rw: string; en: string };

const DESCRIPTIONS: DescriptionEntry[] = [
  { rw: 'Imyumbati yeza, yasaruwe vuba mu murima wanjye.', en: 'Good cassava, freshly harvested from my field.' },
  { rw: 'Imyumbati ifite ubuziranenge, iteguye kugurishwa.', en: 'Quality cassava, ready for sale.' },
  { rw: 'Imyumbati ivuye mu murima wacu, ifite ireme.', en: 'Cassava from our family field, good quality.' },
  { rw: 'Ikawa nziza, yumye neza, ifite impumuro nziza.', en: 'Good coffee, well dried, with a fine aroma.' },
  { rw: "Ikawa y'umwaka, yakuwe mu musozi wa Musanze.", en: "This season's coffee, grown on the Musanze hills." },
  { rw: 'Ibirayi bishya, byavuye mu murima uyu munsi.', en: 'Fresh Irish potatoes, harvested today.' },
  { rw: 'Ibirayi byiza, ntabwo birimo uburwayi.', en: 'Good potatoes, free of disease.' },
  { rw: 'Ibigori byumye neza, biteguye kugurishwa.', en: 'Well-dried maize, ready for sale.' },
  { rw: 'Ibigori bifite ubwiza, byakuwe mu isambu.', en: 'Quality maize, taken straight from the farm.' },
  { rw: 'Ibigori byera, biraboneka vuba.', en: 'Clean maize, available now.' },
  { rw: 'Ibishyimbo byiza, byumye neza.', en: 'Good beans, well dried.' },
  { rw: 'Ibishyimbo bishya, byasaruwe mu cyumweru gishize.', en: 'Fresh beans, harvested last week.' },
  { rw: 'Inyanya zeza, zavuye mu murima uyu munsi.', en: 'Fresh tomatoes, picked from the field today.' },
  { rw: 'Ibijumba byiza, biraboneka vuba.', en: 'Good sweet potatoes, available now.' },
  { rw: 'Ibitoki byera, biteguye kugurishwa.', en: 'Clean bananas, ready for sale.' },
];

export function translateDescription(description: string, locale: string): string {
  if (locale !== 'en') return description;
  const trimmed = description.trim();
  const match = DESCRIPTIONS.find((d) => d.rw === trimmed);
  return match ? match.en : description;
}
