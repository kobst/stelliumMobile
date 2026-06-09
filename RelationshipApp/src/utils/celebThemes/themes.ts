import type { RelationshipTheme, ZodiacSign } from './types';
import {
  elementDisplayName,
  elementOf,
  isSextileElement,
  modalityOf,
  oppositeSign,
  sameElement,
} from './zodiac';

/**
 * Static catalog of rotating themes for the Add Celebrity surface.
 *
 * Edit-time concerns:
 * - Don't change `id` after a theme has shipped — it's the rotation key.
 * - Subtitles read sign-agnostic so they work for any substitution.
 * - User-facing copy never uses clinical aspect names (trine, square,
 *   sextile, opposition). The themes can be about squares without ever
 *   using the word; the editorial tone translates the feeling instead.
 *
 * Migration note: this file can later be replaced with a JSON fetch + a
 * predicate registry keyed by `id`. The screen consuming this catalog is
 * intentionally agnostic about how the array was built.
 */

const INNER_PLANET_ELEMENT_THRESHOLD = 3;

function venusElementForBadge(celebVenus: ZodiacSign | null): string | null {
  return celebVenus ? `Venus in ${celebVenus}` : null;
}

function moonElementForBadge(celebMoon: ZodiacSign | null): string | null {
  return celebMoon ? `Moon in ${celebMoon}` : null;
}

function sunElementForBadge(celebSun: ZodiacSign | null): string | null {
  return celebSun ? `Sun in ${celebSun}` : null;
}

function marsElementForBadge(celebMars: ZodiacSign | null): string | null {
  return celebMars ? `Mars in ${celebMars}` : null;
}

export const RELATIONSHIP_THEMES: readonly RelationshipTheme[] = [
  // 1. Share-sign anchor — the safest entry point.
  {
    id: 'share-sun',
    subtitle: 'Same core energy as you',
    minMatches: 4,
    title: (chart) => (chart.sun ? `Share your Sun in ${chart.sun}` : null),
    match: (celeb, chart) =>
      celeb.sun !== null && chart.sun !== null && celeb.sun === chart.sun,
    badge: (_chart, celeb) => sunElementForBadge(celeb.sun),
  },

  // 2. Their Mars in your Venus's element.
  {
    id: 'their-mars-in-your-venus-element',
    subtitle: 'Their drive moves toward what you love',
    minMatches: 4,
    title: (chart) =>
      chart.venus ? `Mars in your ${elementDisplayName(elementOf(chart.venus))}` : null,
    match: (celeb, chart) =>
      celeb.mars !== null &&
      chart.venus !== null &&
      elementOf(celeb.mars) === elementOf(chart.venus),
    badge: (_chart, celeb) => marsElementForBadge(celeb.mars),
  },

  // 3. Their Venus shares your Moon's element (sign-based trine + conjunction).
  {
    id: 'their-venus-in-your-moon-element',
    subtitle: 'Their affection meets your feelings',
    minMatches: 4,
    title: (chart) =>
      chart.moon ? `Venus in your ${elementDisplayName(elementOf(chart.moon))}` : null,
    match: (celeb, chart) =>
      celeb.venus !== null &&
      chart.moon !== null &&
      elementOf(celeb.venus) === elementOf(chart.moon),
    badge: (_chart, celeb) => venusElementForBadge(celeb.venus),
  },

  // 4. Their Sun squares your Sun (sign-based: same modality, different element).
  {
    id: 'their-sun-squares-your-sun',
    subtitle: 'Productive friction at your tempo',
    minMatches: 4,
    title: () => 'Same gear, different element',
    match: (celeb, chart) =>
      celeb.sun !== null &&
      chart.sun !== null &&
      modalityOf(celeb.sun) === modalityOf(chart.sun) &&
      elementOf(celeb.sun) !== elementOf(chart.sun),
    badge: (_chart, celeb) => sunElementForBadge(celeb.sun),
  },

  // 5. Their Moon sextiles your Venus (cross-element compatibility).
  {
    id: 'their-moon-sextiles-your-venus',
    subtitle: 'Comfortable chemistry, low-key',
    minMatches: 4,
    title: () => 'Easy alongside your Venus',
    match: (celeb, chart) =>
      celeb.moon !== null &&
      chart.venus !== null &&
      isSextileElement(elementOf(celeb.moon), elementOf(chart.venus)),
    badge: (_chart, celeb) => moonElementForBadge(celeb.moon),
  },

  // 6. Their Sun matches your Moon's sign.
  {
    id: 'their-sun-is-your-moon',
    subtitle: 'Their Sun mirrors what you feel',
    minMatches: 3,
    title: (chart) => (chart.moon ? `They live your ${chart.moon} Moon` : null),
    match: (celeb, chart) =>
      celeb.sun !== null && chart.moon !== null && celeb.sun === chart.moon,
    badge: (_chart, celeb) => sunElementForBadge(celeb.sun),
  },

  // 7. Their Venus on your Mars (same sign).
  {
    id: 'their-venus-on-your-mars',
    subtitle: 'Their pull, your push — instant chemistry',
    minMatches: 3,
    title: (chart) => (chart.mars ? `Drawn to your ${chart.mars} Mars` : null),
    match: (celeb, chart) =>
      celeb.venus !== null && chart.mars !== null && celeb.venus === chart.mars,
    badge: (_chart, celeb) => venusElementForBadge(celeb.venus),
  },

  // 8. Their Moon opposes your Sun.
  {
    id: 'their-moon-opposes-your-sun',
    subtitle: 'Magnetic across the wheel',
    minMatches: 3,
    title: () => 'Moon opposite your Sun',
    match: (celeb, chart) =>
      celeb.moon !== null &&
      chart.sun !== null &&
      celeb.moon === oppositeSign(chart.sun),
    badge: (_chart, celeb) => moonElementForBadge(celeb.moon),
  },

  // 9. Their Mars and Venus share an element (no user dependency — universal fallback).
  {
    id: 'celeb-mars-venus-share-element',
    subtitle: 'Their wanting and their loving point the same direction',
    minMatches: 4,
    title: () => 'Mars and Venus in step',
    match: (celeb) =>
      celeb.mars !== null &&
      celeb.venus !== null &&
      sameElement(celeb.mars, celeb.venus),
    badge: (_chart, celeb) =>
      celeb.mars
        ? `${elementDisplayName(elementOf(celeb.mars))} energy`
        : null,
  },

  // 10. Fellow {element} Moons (wider yield than share-sign Moon).
  {
    id: 'fellow-element-moon',
    subtitle: 'The same emotional climate',
    minMatches: 4,
    title: (chart) =>
      chart.moon
        ? `Fellow ${elementDisplayName(elementOf(chart.moon))} Moons`
        : null,
    match: (celeb, chart) =>
      celeb.moon !== null &&
      chart.moon !== null &&
      elementOf(celeb.moon) === elementOf(chart.moon),
    badge: (_chart, celeb) => moonElementForBadge(celeb.moon),
  },

  // 11. Their Sun shares your Mars's element.
  {
    id: 'their-sun-in-your-mars-element',
    subtitle: 'Their presence fuels your drive',
    minMatches: 4,
    title: (chart) =>
      chart.mars ? `Sun in your ${elementDisplayName(elementOf(chart.mars))}` : null,
    match: (celeb, chart) =>
      celeb.sun !== null &&
      chart.mars !== null &&
      elementOf(celeb.sun) === elementOf(chart.mars),
    badge: (_chart, celeb) => sunElementForBadge(celeb.sun),
  },

  // 12. Inner planets stacked in your Sun's element (lower yield, special slot).
  {
    id: 'stellium-in-your-element',
    subtitle: 'Charts that mirror your nature',
    minMatches: 3,
    title: (chart) =>
      chart.sun ? `Heavy in ${elementDisplayName(elementOf(chart.sun))}` : null,
    match: (celeb, chart) => {
      if (!chart.sun) return false;
      const targetElement = elementOf(chart.sun);
      const inner: (ZodiacSign | null)[] = [
        celeb.sun,
        celeb.moon,
        celeb.mercury,
        celeb.venus,
        celeb.mars,
      ];
      let count = 0;
      for (const sign of inner) {
        if (sign && elementOf(sign) === targetElement) count += 1;
        if (count >= INNER_PLANET_ELEMENT_THRESHOLD) return true;
      }
      return false;
    },
    badge: (chart) =>
      chart.sun
        ? `${elementDisplayName(elementOf(chart.sun))}-heavy`
        : null,
  },

  // 13. Wildcard: their Moon squares your Moon (complicated kinship).
  {
    id: 'their-moon-squares-your-moon',
    subtitle: 'Right angles, same currents',
    minMatches: 4,
    title: () => 'Same Moon mode, different feel',
    match: (celeb, chart) =>
      celeb.moon !== null &&
      chart.moon !== null &&
      modalityOf(celeb.moon) === modalityOf(chart.moon) &&
      elementOf(celeb.moon) !== elementOf(chart.moon),
    badge: (_chart, celeb) => moonElementForBadge(celeb.moon),
  },
];
