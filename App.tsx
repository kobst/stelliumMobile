/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './AuthScreen';
import RootNavigator from './src/navigation';
import LoadingScreen from './src/components/LoadingScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingCarousel from './src/screens/OnboardingCarousel';
import {useStore} from './src/store';
import {usersApi, subscriptionsApi} from './src/api';
import {userTransformers} from './src/transformers/user';
import {SubjectDocument} from './src/types';
import { ThemeProvider } from './src/theme';
import { revenueCatService } from './src/services/RevenueCatService';
import { superwallService } from './src/services/SuperwallService';

const ONBOARDING_COMPLETE_KEY = '@stellium_onboarding_complete';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const { setUserData, initializeFromStorage, updateSubscriptionData } = useStore();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (!completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  // Initialize payment SDKs when user is authenticated
  const initializePaymentSDKs = async (firebaseUid: string, mongoUserId: string) => {
    try {
      console.log('App.tsx: Initializing payment SDKs for user:', { firebaseUid, mongoUserId });

      // Initialize Superwall FIRST so it's ready to receive status updates from RevenueCat
      // RevenueCat and Superwall use Firebase UID as the user identifier
      await superwallService.configure(firebaseUid);

      // Initialize RevenueCat - this will sync customer info and update Superwall status
      await revenueCatService.configure(firebaseUid);

      // Fetch subscription status from backend using MongoDB ObjectId
      try {
        const subscriptionStatus = await subscriptionsApi.getSubscriptionStatus(mongoUserId);

        // Update store with subscription data
        updateSubscriptionData({
          subscription: subscriptionStatus.subscription,
          usage: subscriptionStatus.usage,
          entitlements: subscriptionStatus.entitlements,
        });

        // Update Superwall with user attributes
        await superwallService.updateUserAttributesFromStore();
        console.log('App.tsx: Successfully loaded subscription from backend');
      } catch (backendError: any) {
        console.log('App.tsx: Failed to load subscription from backend:', backendError?.message);

        // If user doesn't have a subscription record yet, initialize it
        if (backendError?.status === 404 || backendError?.message?.includes('not found')) {
          try {
            console.log('App.tsx: No subscription found - initializing for existing user');
            await subscriptionsApi.initializeSubscription(mongoUserId, { tier: 'free' });
            console.log('App.tsx: Subscription initialized - retrying fetch');

            // Retry fetching subscription after initialization
            const subscriptionStatus = await subscriptionsApi.getSubscriptionStatus(mongoUserId);
            updateSubscriptionData({
              subscription: subscriptionStatus.subscription,
              usage: subscriptionStatus.usage,
              entitlements: subscriptionStatus.entitlements,
            });
            await superwallService.updateUserAttributesFromStore();
          } catch (retryError) {
            console.error('App.tsx: Failed to initialize/fetch subscription:', retryError);
          }
        } else {
          console.log('App.tsx: Backend subscription API error, using SDK-only mode');
        }
        // App will work with just RevenueCat/Superwall until backend is ready
      }

      console.log('App.tsx: Payment SDKs initialized successfully');
    } catch (error) {
      console.error('App.tsx: Failed to initialize payment SDKs:', error);
      // Don't block app if payment SDK init fails
    }
  };

  useEffect(() => {
    console.log('App.tsx: Initializing app...');

    // Initialize store from storage (non-auth data only)
    initializeFromStorage();

    // Enable Firebase auth
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      console.log('App.tsx: Firebase auth state changed:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
      });

      setUser(currentUser);

      // Update store with user authentication state
      if (currentUser) {
        setIsLoadingUserData(true);
        try {
          // Try to fetch existing user data from backend using Firebase UID
          console.log('Fetching user data for authenticated user:', currentUser.uid);
          const response = await usersApi.getUserByFirebaseUid(currentUser.uid);

          if (response && response.success !== false) {
            // User exists in backend, transform and use existing data
            console.log('[App.tsx] ===== getUserByFirebaseUid Response =====');
            console.log('[App.tsx] Full response:', JSON.stringify(response, null, 2));
            console.log('[App.tsx] response.user exists:', !!response.user);
            console.log('[App.tsx] response._id:', response._id);
            console.log('[App.tsx] ======================');

            // The getUserByFirebaseUid API returns SubjectDocument directly or wrapped in { user: {...} }
            const userDocument = response.user || response;
            console.log('[App.tsx] userDocument._id:', userDocument._id);
            console.log('[App.tsx] userDocument keys:', Object.keys(userDocument));

            const userData = userTransformers.subjectDocumentToUser(userDocument as SubjectDocument);
            console.log('[App.tsx] Transformed userData.id:', userData.id);
            console.log('[App.tsx] Transformed userData:', userData);
            setUserData(userData);

            // Initialize payment SDKs after user data is loaded
            // Use Firebase UID for RevenueCat/Superwall, MongoDB ObjectId for subscription API
            await initializePaymentSDKs(currentUser.uid, userData.id);
          } else {
            // User doesn't exist in backend, create placeholder data for onboarding
            console.log('User not found in backend - will show onboarding');
            const userData = {
              id: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              // Placeholder birth data - will be collected during onboarding
              birthYear: 1990,
              birthMonth: 1,
              birthDay: 1,
              birthHour: 12,
              birthMinute: 0,
              birthLocation: '',
              timezone: '',
            };
            setUserData(userData);

            // Initialize subscription record in backend for new users
            // For new users, use Firebase UID since MongoDB ObjectId doesn't exist yet
            try {
              console.log('App.tsx: Initializing subscription for new user');
              await subscriptionsApi.initializeSubscription(currentUser.uid, { tier: 'free' });
              console.log('App.tsx: Subscription initialized successfully');
            } catch (initError) {
              console.error('App.tsx: Failed to initialize subscription:', initError);
              // Continue anyway - subscription can be initialized later
            }

            // Initialize payment SDKs for new users
            // Use Firebase UID for both since MongoDB ObjectId doesn't exist yet
            await initializePaymentSDKs(currentUser.uid, currentUser.uid);
          }
        } catch (error: any) {
          console.error('Error fetching user data from backend:', error);

          // Check if it's a "user not found" error (expected for new users)
          if (error.message?.includes('User not found') || error.status === 404) {
            console.log('User not found in backend - new user will go through onboarding');
          } else {
            console.error('Unexpected API error:', error);
          }

          // Create placeholder data for onboarding (both cases)
          const userData = {
            id: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            // Placeholder birth data - will be collected during onboarding
            birthYear: 1990,
            birthMonth: 1,
            birthDay: 1,
            birthHour: 12,
            birthMinute: 0,
            birthLocation: '',
            timezone: '',
          };
          setUserData(userData);

          // Initialize subscription record in backend for new users
          // For new users during error handling, we use Firebase UID as placeholder since MongoDB ID isn't created yet
          try {
            console.log('App.tsx: Initializing subscription for new user');
            await subscriptionsApi.initializeSubscription(currentUser.uid, { tier: 'free' });
            console.log('App.tsx: Subscription initialized successfully');
          } catch (initError) {
            console.error('App.tsx: Failed to initialize subscription:', initError);
            // Continue anyway - subscription can be initialized later
          }

          // Initialize payment SDKs even for new users
          // For new users in error handler, use Firebase UID for both since MongoDB ID may not exist yet
          await initializePaymentSDKs(currentUser.uid, currentUser.uid);
        } finally {
          setIsLoadingUserData(false);
        }
      } else {
        console.log('App.tsx: User signed out, clearing store data');
        setUserData(null);
        setIsLoadingUserData(false);

        // Reset payment SDKs on sign out
        revenueCatService.reset();
        superwallService.reset();
      }
    });

    return unsubscribe;
  }, [initializeFromStorage, setUserData]);

  console.log('App.tsx: Rendering decision - user exists:', !!user, 'loading:', isLoadingUserData);

  // Show splash screen first
  if (showSplash) {
    console.log('App.tsx: Showing SplashScreen');
    return (
      <ThemeProvider>
        <SplashScreen onComplete={handleSplashComplete} />
      </ThemeProvider>
    );
  }

  // Show onboarding if not completed and still checking
  if (isCheckingOnboarding) {
    console.log('App.tsx: Checking onboarding status...');
    return (
      <ThemeProvider>
        <LoadingScreen message="Loading..." />
      </ThemeProvider>
    );
  }

  // Show onboarding carousel if first time user
  if (showOnboarding && !user) {
    console.log('App.tsx: Showing OnboardingCarousel');
    return (
      <ThemeProvider>
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      </ThemeProvider>
    );
  }

  if (!user) {
    console.log('App.tsx: Showing AuthScreen (user not authenticated)');
    return (
      <ThemeProvider>
        <AuthScreen />
      </ThemeProvider>
    );
  }

  if (isLoadingUserData) {
    console.log('App.tsx: Showing LoadingScreen (fetching user data)');
    return (
      <ThemeProvider>
        <LoadingScreen message="Loading your profile..." />
      </ThemeProvider>
    );
  }

  console.log('App.tsx: Showing RootNavigator (user authenticated)');
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
};

export default App;
