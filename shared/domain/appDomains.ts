export const APP_DOMAINS = {
  stelliumClassic: 'stellium-classic',
  relationshipApp: 'relationship-app',
} as const;

export type AppDomain = typeof APP_DOMAINS[keyof typeof APP_DOMAINS];
