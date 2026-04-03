import React, {useCallback, useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from '../../AuthScreen';
import RootNavigator from '../navigation';
import LoadingScreen from '../components/LoadingScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingCarousel from '../screens/OnboardingCarousel';
import {useStore} from '../store';
import {usersApi, subscriptionsApi} from '../api';
import {userTransformers} from '../transformers/user';
import {SubjectDocument} from '../types';
import { ThemeProvider } from '../theme';
import { revenueCatService } from '../services/RevenueCatService';
import { superwallService } from '../services/SuperwallService';

const ONBOARDING_COMPLETE_KEY = '@stellium_onboarding_complete';

const ClassicApp: React.FC = () => {
  console.log('🚀 APP STARTED - Console logging is working!');

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const { setUserData, initializeFromStorage, updateSubscriptionData } = useStore();

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

  const initializePaymentSDKs = useCallback(async (firebaseUid: string, mongoUserId: string) => {
    try {
      console.log('App.tsx: Initializing payment SDKs for user:', { firebaseUid, mongoUserId });

      await superwallService.configure(firebaseUid);
      await revenueCatService.configure(firebaseUid);

      try {
        const subscriptionStatus = await subscriptionsApi.getSubscriptionStatus(mongoUserId);

        updateSubscriptionData({
          subscription: subscriptionStatus.subscription,
          usage: subscriptionStatus.usage,
          entitlements: subscriptionStatus.entitlements,
        });

        await superwallService.updateUserAttributesFromStore();
        console.log('App.tsx: Successfully loaded subscription from backend');
      } catch (backendError: any) {
        console.log('App.tsx: Failed to load subscription from backend:', backendError?.message);

        if (backendError?.status === 404 || backendError?.message?.includes('not found')) {
          try {
            console.log('App.tsx: No subscription found - initializing for existing user');
            await subscriptionsApi.initializeSubscription(mongoUserId, { tier: 'free' });
            console.log('App.tsx: Subscription initialized - retrying fetch');

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
      }

      console.log('App.tsx: Payment SDKs initialized successfully');
    } catch (error) {
      console.error('App.tsx: Failed to initialize payment SDKs:', error);
    }
  }, [updateSubscriptionData]);

  useEffect(() => {
    console.log('App.tsx: Initializing app...');

    initializeFromStorage();

    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      console.log('App.tsx: Firebase auth state changed:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
      });

      setUser(currentUser);

      if (currentUser) {
        setIsLoadingUserData(true);
        try {
          console.log('Fetching user data for authenticated user:', currentUser.uid);
          const response = await usersApi.getUserByFirebaseUid(currentUser.uid);

          if (response && response.success !== false) {
            console.log('[App.tsx] ===== getUserByFirebaseUid Response =====');
            console.log('[App.tsx] Full response:', JSON.stringify(response, null, 2));
            console.log('[App.tsx] response.user exists:', !!response.user);
            console.log('[App.tsx] response._id:', response._id);
            console.log('[App.tsx] ======================');

            const userDocument = response.user || response;
            console.log('[App.tsx] userDocument._id:', userDocument._id);
            console.log('[App.tsx] userDocument keys:', Object.keys(userDocument));

            const userData = userTransformers.subjectDocumentToUser(userDocument as SubjectDocument);
            console.log('[App.tsx] Transformed userData.id:', userData.id);
            console.log('[App.tsx] Transformed userData:', userData);
            setUserData(userData);

            await initializePaymentSDKs(currentUser.uid, userData.id);
          } else {
            console.log('User not found in backend - will show onboarding');
            const userData = {
              id: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              birthYear: 1990,
              birthMonth: 1,
              birthDay: 1,
              birthHour: 12,
              birthMinute: 0,
              birthLocation: '',
              timezone: '',
            };
            setUserData(userData);

            try {
              console.log('App.tsx: Initializing subscription for new user');
              await subscriptionsApi.initializeSubscription(currentUser.uid, { tier: 'free' });
              console.log('App.tsx: Subscription initialized successfully');
            } catch (initError) {
              console.error('App.tsx: Failed to initialize subscription:', initError);
            }

            await initializePaymentSDKs(currentUser.uid, currentUser.uid);
          }
        } catch (error: any) {
          console.error('Error fetching user data from backend:', error);

          if (error.message?.includes('User not found') || error.status === 404) {
            console.log('User not found in backend - new user will go through onboarding');
          } else {
            console.error('Unexpected API error:', error);
          }

          const userData = {
            id: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            birthYear: 1990,
            birthMonth: 1,
            birthDay: 1,
            birthHour: 12,
            birthMinute: 0,
            birthLocation: '',
            timezone: '',
          };
          setUserData(userData);

          try {
            console.log('App.tsx: Initializing subscription for new user');
            await subscriptionsApi.initializeSubscription(currentUser.uid, { tier: 'free' });
            console.log('App.tsx: Subscription initialized successfully');
          } catch (initError) {
            console.error('App.tsx: Failed to initialize subscription:', initError);
          }

          await initializePaymentSDKs(currentUser.uid, currentUser.uid);
        } finally {
          setIsLoadingUserData(false);
        }
      } else {
        console.log('App.tsx: User signed out, clearing store data');
        setUserData(null);
        setIsLoadingUserData(false);
        revenueCatService.reset();
        superwallService.reset();
      }
    });

    return unsubscribe;
  }, [initializeFromStorage, initializePaymentSDKs, setUserData]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (isCheckingOnboarding) {
    return <LoadingScreen message="Loading..." />;
  }

  if (showOnboarding) {
    return <OnboardingCarousel onComplete={handleOnboardingComplete} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (isLoadingUserData) {
    return <LoadingScreen message="Loading your chart..." />;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
};

export default ClassicApp;
