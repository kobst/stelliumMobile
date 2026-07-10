import { getRomanticPlacements } from '../RelationshipApp/src/utils/placements';
import type { SubjectDocument } from '../shared/types/subject';

const subjectWithChart = {
  birthChart: {
    planets: [
      { name: 'Sun', sign: 'Leo', norm_degree: 12.4, house: 5 },
      { name: 'Moon', sign: 'Cancer', norm_degree: 3.9, house: 4 },
      { name: 'Venus', sign: 'Virgo', norm_degree: 27.1, house: 6 },
      { name: 'Mars', sign: 'Aries', norm_degree: 8.6, house: 1 },
      { name: 'Ascendant', sign: 'Aries', norm_degree: 15.2, house: 1 },
    ],
  },
} as unknown as SubjectDocument;

describe('getRomanticPlacements', () => {
  it('returns all six placements with real copy (no placeholder text)', () => {
    const placements = getRomanticPlacements(subjectWithChart);

    expect(placements.map((p) => p.key)).toEqual([
      'sun',
      'moon',
      'venus',
      'mars',
      'ascendant',
      'descendant',
    ]);

    for (const placement of placements) {
      expect(placement.interpretation.length).toBeGreaterThan(0);
      expect(placement.interpretation.toLowerCase()).not.toContain('placeholder');
      expect(placement.interpretation.toLowerCase()).not.toContain('todo');
      expect(placement.interpretation.toLowerCase()).not.toContain('stub');
    }
  });

  it('derives the descendant as the sign opposite the ascendant', () => {
    const placements = getRomanticPlacements(subjectWithChart);
    const descendant = placements.find((p) => p.key === 'descendant');

    expect(descendant?.sign).toBe('Libra');
    expect(descendant?.house).toBe(7);
  });

  it('handles a missing profile without throwing', () => {
    const placements = getRomanticPlacements(null);

    expect(placements).toHaveLength(6);
    for (const placement of placements) {
      expect(placement.sign).toBeNull();
      expect(placement.interpretation.length).toBeGreaterThan(0);
    }
  });
});
