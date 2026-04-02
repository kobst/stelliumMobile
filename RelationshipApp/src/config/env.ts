import Config from 'react-native-config';

export const relationshipAppEnv = {
  apiUrl: Config.API_URL || '',
  env: Config.ENV || 'development',
  googleApiKey: Config.GOOGLE_API_KEY || '',
};
