// Firebase configuration for StelliumApp
// This file contains the Firebase configuration settings
import Config from 'react-native-config';

// Determine environment-specific Firebase config
const isDev = Config.ENV === 'development';

export const firebaseConfig = isDev ? {
  apiKey: 'AIzaSyBPftp0zDH2AmmEU6ajEkFmsh6CS-3-sRw',
  authDomain: 'stellium-dev.firebaseapp.com',
  projectId: 'stellium-dev',
  storageBucket: 'stellium-dev.firebasestorage.app',
  messagingSenderId: '1056285065517',
  appId: '1:1056285065517:ios:0b0c7b5212e0cf3cf8d3a4',
  measurementId: 'G-XXXXXXXXXX', // Add dev measurement ID if you have one
} : {
  apiKey: 'AIzaSyBnSYzpgghCC3c-0vdP1mvPeoy2vAz8I4E',
  authDomain: 'stellium-70a2a.firebaseapp.com',
  projectId: 'stellium-70a2a',
  storageBucket: 'stellium-70a2a.firebasestorage.app',
  messagingSenderId: '63614597334',
  appId: '1:63614597334:web:13270f94893e38fa357177',
  measurementId: 'G-TE4T0E0LRF',
};

// Google Sign-In Web Client ID (for iOS and Android)
export const GOOGLE_WEB_CLIENT_ID = isDev
  ? '1056285065517-bm65rgfa23gehv91ftjl63shphiaqe4b.apps.googleusercontent.com'
  : '63614597334-8mamegt0j0lt54p20su2orrvpbt0qeio.apps.googleusercontent.com';

// Facebook App Configuration
export const FACEBOOK_APP_ID = '561705813647639';
