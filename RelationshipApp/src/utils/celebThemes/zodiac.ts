import type { Element, Modality, ZodiacSign } from './types';

const ZODIAC_ORDER: readonly ZodiacSign[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const ELEMENT_BY_SIGN: Record<ZodiacSign, Element> = {
  Aries: 'fire',
  Leo: 'fire',
  Sagittarius: 'fire',
  Taurus: 'earth',
  Virgo: 'earth',
  Capricorn: 'earth',
  Gemini: 'air',
  Libra: 'air',
  Aquarius: 'air',
  Cancer: 'water',
  Scorpio: 'water',
  Pisces: 'water',
};

const MODALITY_BY_SIGN: Record<ZodiacSign, Modality> = {
  Aries: 'cardinal',
  Cancer: 'cardinal',
  Libra: 'cardinal',
  Capricorn: 'cardinal',
  Taurus: 'fixed',
  Leo: 'fixed',
  Scorpio: 'fixed',
  Aquarius: 'fixed',
  Gemini: 'mutable',
  Virgo: 'mutable',
  Sagittarius: 'mutable',
  Pisces: 'mutable',
};

export function isZodiacSign(value: unknown): value is ZodiacSign {
  return typeof value === 'string' && ZODIAC_ORDER.includes(value as ZodiacSign);
}

export function elementOf(sign: ZodiacSign): Element {
  return ELEMENT_BY_SIGN[sign];
}

export function modalityOf(sign: ZodiacSign): Modality {
  return MODALITY_BY_SIGN[sign];
}

export function oppositeSign(sign: ZodiacSign): ZodiacSign {
  const idx = ZODIAC_ORDER.indexOf(sign);
  return ZODIAC_ORDER[(idx + 6) % 12];
}

export function sameElement(a: ZodiacSign, b: ZodiacSign): boolean {
  return ELEMENT_BY_SIGN[a] === ELEMENT_BY_SIGN[b];
}

/**
 * Sign-based sextile check. In the four-element model fire and air pair as
 * complementary, as do earth and water. Same element is excluded so this
 * returns true only for the cross-element compatibility cases.
 */
export function isSextileElement(a: Element, b: Element): boolean {
  if (a === b) return false;
  return (
    (a === 'fire' && b === 'air') ||
    (a === 'air' && b === 'fire') ||
    (a === 'earth' && b === 'water') ||
    (a === 'water' && b === 'earth')
  );
}

const ELEMENT_DISPLAY: Record<Element, string> = {
  fire: 'Fire',
  earth: 'Earth',
  air: 'Air',
  water: 'Water',
};

export function elementDisplayName(e: Element): string {
  return ELEMENT_DISPLAY[e];
}
