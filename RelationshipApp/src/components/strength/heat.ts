// Relationship heat scale — the single source of truth for score → colour.
// Mirrors the Iris design (iris-relationships.jsx `scoreColor` / heat key).
//
// The whole point: a shape's colour mix alone signals where a relationship runs
// hot or cool, no reading required.
//   85+   blazing rose      70–84  amber/gold      55–69  lilac
//   40–54 cyan              <40    cool periwinkle

export const HEAT_STOPS = ['#6E7CEC', '#36E0D8', '#C3A8FF', '#FFB13C', '#FF6E84'] as const;

export function scoreColor(value: number): string {
  if (value >= 85) {
    return '#FF6E84';
  }
  if (value >= 70) {
    return '#FFB13C';
  }
  if (value >= 55) {
    return '#C3A8FF';
  }
  if (value >= 40) {
    return '#36E0D8';
  }
  return '#6E7CEC';
}
