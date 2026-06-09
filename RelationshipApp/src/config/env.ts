import Config from 'react-native-config';

function sanitizeKey(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, '');
}

export const relationshipAppEnv = {
  apiUrl: Config.API_URL || '',
  env: Config.ENV || 'development',
  googleApiKey: sanitizeKey(Config.GOOGLE_API_KEY || ''),
  revenueCatApiKey: sanitizeKey(Config.IRIS_REVENUECAT_API_KEY || ''),
  appVariant: Config.APP_VARIANT || '',
  enableLocalUxMode: false,
};
