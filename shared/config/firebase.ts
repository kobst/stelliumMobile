// Firebase configuration for the relationship app native shell.
import Config from 'react-native-config';

// Determine environment-specific Firebase config
const isDev = Config.ENV === 'development';

export const firebaseConfig = isDev ? {
  apiKey: 'AIzaSyC8p2Hd-5HmM9f4ilxwNtNBv56stBCjSlY',
  authDomain: 'stellium-relationship-dev.firebaseapp.com',
  projectId: 'stellium-relationship-dev',
  storageBucket: 'stellium-relationship-dev.firebasestorage.app',
  messagingSenderId: '763187884820',
  appId: '1:763187884820:ios:e95756d6041a27c68d0801',
  measurementId: 'G-XXXXXXXXXX',
} : {
  apiKey: 'AIzaSyC9JBoX54zurKPXKKmq_zf8xqdu0BpDN3U',
  authDomain: 'stellium-relationship-prod.firebaseapp.com',
  projectId: 'stellium-relationship-prod',
  storageBucket: 'stellium-relationship-prod.firebasestorage.app',
  messagingSenderId: '825305986047',
  appId: '1:825305986047:ios:7e814695b931796a576dca',
  measurementId: 'G-XXXXXXXXXX',
};

// Google Sign-In client IDs used by the relationship app Firebase projects.
// NOTE (prod): this should be the prod project's dedicated *Web* client ID (as
// dev is, above). It currently mirrors the iOS client because that's how prod
// was configured; swap in the real Web client ID from the Firebase console if
// Google Sign-In misbehaves in prod.
export const GOOGLE_WEB_CLIENT_ID = isDev
  ? '763187884820-oj1c00j3dn6m0158eo8fkmorpmbrh0hn.apps.googleusercontent.com'
  : '825305986047-dujf9k5ku5hubqb1a2vo7t805gjsago6.apps.googleusercontent.com';

// iOS Client ID from GoogleService-Info.plist (CLIENT_ID)
export const IOS_GOOGLE_CLIENT_ID = isDev
  ? '763187884820-8ujnq2ivctmsd4onsu8hal4t390n6ntv.apps.googleusercontent.com'
  : '825305986047-dujf9k5ku5hubqb1a2vo7t805gjsago6.apps.googleusercontent.com';

// Facebook App Configuration
export const FACEBOOK_APP_ID = '561705813647639';
