export const RELATIONSHIP_CLUSTERS = [
  { key: 'harmony', label: 'Harmony' },
  { key: 'passion', label: 'Passion' },
  { key: 'connection', label: 'Connection' },
  { key: 'stability', label: 'Stability' },
  { key: 'growth', label: 'Growth' },
] as const;

export type RelationshipClusterKey = typeof RELATIONSHIP_CLUSTERS[number]['key'];
