import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useStore } from '../store';
import { horoscopesApi, HoroscopeResponse, CustomHoroscopeResponse, TransitWindowsResponse } from '../api/horoscopes';
import { TransitEvent, HoroscopeFilter } from '../types';
import {
  getDateRangeForPeriod,
  formatDate,
  formatDateRange,
  getTodayRange,
  getTomorrowRange,
  getCurrentWeekRange,
  getNextWeekRange,
  getCurrentMonthRange,
  getNextMonthRange,
  dateRangesOverlap,
  getISOWeekNumber,
} from '../utils/dateHelpers';
import { useTheme } from '../theme';
import { AstroIcon } from '../../utils/astrologyIcons';
import HoroscopeChatTab from './HoroscopeChatTab';
import LockedHoroscopeTab from './LockedHoroscopeTab';
import CreditGatedHoroscopeTab from './CreditGatedHoroscopeTab';
import { useCreditBalance } from '../hooks/useCreditBalance';
import { creditFlowManager } from '../services/CreditFlowManager';
import { CREDIT_COSTS, CreditAction } from '../config/subscriptionConfig';

interface HoroscopeContainerProps {
  transitWindows?: TransitEvent[];
  loading?: boolean;
  error?: string | null;
  userId?: string;
  onRetryTransitWindows?: () => void;
}

interface HoroscopeCache {
  today: HoroscopeResponse | null;
  thisWeek: HoroscopeResponse | null;
  thisMonth: HoroscopeResponse | null;
}

const HoroscopeContainer: React.FC<HoroscopeContainerProps> = ({
  transitWindows = [],
  loading = false,
  error = null,
  userId,
  onRetryTransitWindows,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<HoroscopeFilter>('today');
  const [horoscopeCache, setHoroscopeCache] = useState<HoroscopeCache>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeErrors, setHoroscopeErrors] = useState<Record<string, string | null>>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });
  const [loadedTabs, setLoadedTabs] = useState<Set<HoroscopeFilter>>(new Set());

  // Extended loading state - tracks when loading takes longer than expected
  // Shows "Still loading..." message after 30s instead of error during API retries
  const [extendedLoading, setExtendedLoading] = useState<Record<string, boolean>>({
    today: false,
    thisWeek: false,
    thisMonth: false,
  });
  const extendedLoadingTimerRef = useRef<Record<string, NodeJS.Timeout | null>>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });

  // Credit gating state for free users - now synced with backend unlock status
  const [unlockStatus, setUnlockStatus] = useState<Record<string, boolean>>({});
  const [pendingHoroscopeCache, setPendingHoroscopeCache] = useState<HoroscopeCache>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });
  const [unlockingTab, setUnlockingTab] = useState<HoroscopeFilter | null>(null);
  const [backgroundGenerating, setBackgroundGenerating] = useState<Record<string, boolean>>({});

  // Track last known date to detect day changes
  const lastKnownDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { userData, userSubscription } = useStore();
  const { refreshBalance, total, getCost } = useCreditBalance();

  // Get subscription tier (default to 'free' if not set)
  const subscriptionTier = userSubscription?.tier || 'free';

  // Check if a tab requires credits (only for free users, only daily/weekly)
  const isTabCreditGated = useCallback((tab: HoroscopeFilter): boolean => {
    // Premium/Pro users never see credit gates
    if (subscriptionTier === 'premium' || subscriptionTier === 'pro') {
      return false;
    }
    // Monthly is always free for everyone
    if (tab === 'thisMonth') {
      return false;
    }
    // Chat tab is still subscription-locked (handled separately)
    if (tab === 'chat') {
      return false;
    }
    // Daily and weekly require credits for free users
    return tab === 'today' || tab === 'thisWeek';
  }, [subscriptionTier]);

  // Get unique period key for caching purchases (e.g., "daily-2025-12-05")
  const getPeriodKey = useCallback((tab: HoroscopeFilter): string => {
    const now = new Date();
    switch (tab) {
      case 'today':
        return `daily-${now.toISOString().split('T')[0]}`;
      case 'thisWeek':
        const weekNum = getISOWeekNumber(now);
        return `weekly-${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      case 'thisMonth':
        return `monthly-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      default:
        return `unknown-${Date.now()}`;
    }
  }, []);

  // Check if user has already unlocked this tab's current period (from backend)
  const isTabUnlocked = useCallback((tab: HoroscopeFilter): boolean => {
    const periodKey = getPeriodKey(tab);
    return unlockStatus[periodKey] === true;
  }, [unlockStatus, getPeriodKey]);

  // Check if tab should show credit gate UI (free users who haven't unlocked)
  const shouldShowCreditGate = useCallback((tab: HoroscopeFilter): boolean => {
    return isTabCreditGated(tab) && !isTabUnlocked(tab);
  }, [isTabCreditGated, isTabUnlocked]);

  // Check if chat tab is subscription-locked (for free users)
  const isChatLocked = subscriptionTier === 'free';

  // Check if a cached horoscope is stale (date range no longer contains today)
  const isHoroscopeStale = useCallback((horoscope: HoroscopeResponse | null, tab: HoroscopeFilter): boolean => {
    if (!horoscope) return false; // No cache = not stale, just empty

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startDate = new Date(horoscope.horoscope.startDate);
    const endDate = new Date(horoscope.horoscope.endDate);

    // For daily horoscope, check if it's still today
    if (tab === 'today') {
      const horoscopeDateStr = startDate.toISOString().split('T')[0];
      return horoscopeDateStr !== todayStr;
    }

    // For weekly/monthly, check if today is still within the range
    return now < startDate || now > endDate;
  }, []);

  // Invalidate stale caches and reset unlock status for new periods
  const invalidateStaleCaches = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    // Check if day has changed
    if (today !== lastKnownDateRef.current) {
      console.log('[HoroscopeContainer] Day changed, invalidating stale caches');
      lastKnownDateRef.current = today;

      // Clear caches for stale horoscopes
      const tabsToCheck: Array<'today' | 'thisWeek' | 'thisMonth'> = ['today', 'thisWeek', 'thisMonth'];

      tabsToCheck.forEach(tab => {
        if (isHoroscopeStale(horoscopeCache[tab], tab)) {
          console.log(`[HoroscopeContainer] ${tab} horoscope is stale, clearing cache`);
          setHoroscopeCache(prev => ({ ...prev, [tab]: null }));
          setPendingHoroscopeCache(prev => ({ ...prev, [tab]: null }));
        }
      });

      // Reset unlock status for new period (will be re-checked from backend)
      setUnlockStatus({});
      setLoadedTabs(new Set());
    }
  }, [horoscopeCache, isHoroscopeStale]);

  // Helper to start extended loading timer for a tab
  // After 30s of loading, show "Still loading..." message instead of error
  const startExtendedLoadingTimer = useCallback((tab: 'today' | 'thisWeek' | 'thisMonth') => {
    // Clear any existing timer
    if (extendedLoadingTimerRef.current[tab]) {
      clearTimeout(extendedLoadingTimerRef.current[tab]!);
    }
    // Set timer to show extended loading message after 30s
    extendedLoadingTimerRef.current[tab] = setTimeout(() => {
      setExtendedLoading(prev => ({ ...prev, [tab]: true }));
    }, 30000);
  }, []);

  // Helper to clear extended loading state for a tab
  const clearExtendedLoading = useCallback((tab: 'today' | 'thisWeek' | 'thisMonth') => {
    if (extendedLoadingTimerRef.current[tab]) {
      clearTimeout(extendedLoadingTimerRef.current[tab]!);
      extendedLoadingTimerRef.current[tab] = null;
    }
    setExtendedLoading(prev => ({ ...prev, [tab]: false }));
  }, []);

  // Helper function to get horoscope for a specific period (now free - no credit charge)
  // Note: Timeout and retry logic is handled by the API client (see src/api/client.ts)
  const getHoroscopeForPeriod = async (targetUserId: string, startDate: Date | string, type: 'daily' | 'weekly' | 'monthly') => {
    try {
      let response;
      switch (type) {
        case 'daily':
          response = await horoscopesApi.generateDailyHoroscope(targetUserId, typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]);
          break;
        case 'weekly':
          response = await horoscopesApi.generateWeeklyHoroscope(targetUserId, typeof startDate === 'string' ? new Date(startDate) : startDate);
          break;
        case 'monthly':
          response = await horoscopesApi.generateMonthlyHoroscope(targetUserId, typeof startDate === 'string' ? new Date(startDate) : startDate);
          break;
        default:
          throw new Error(`Unknown horoscope type: ${type}`);
      }

      if (!response.success) {
        throw new Error('Failed to fetch horoscope');
      }

      return response;
    } catch (error) {
      console.error(`Error getting ${type} horoscope:`, error);
      throw error;
    }
  };

  // Check unlock status from backend (fast ~50ms check)
  const checkUnlockStatusForTab = async (tab: 'today' | 'thisWeek', targetUserId: string): Promise<boolean> => {
    const periodKey = getPeriodKey(tab);

    // Return cached status if we already checked
    if (unlockStatus[periodKey] !== undefined) {
      return unlockStatus[periodKey];
    }

    const period = tab === 'today' ? 'daily' : 'weekly';
    const startDate = tab === 'today'
      ? getTodayRange().start.toISOString().split('T')[0]
      : getCurrentWeekRange().start.toISOString().split('T')[0];

    try {
      const response = await horoscopesApi.checkUnlockStatus(targetUserId, period, startDate);
      setUnlockStatus(prev => ({ ...prev, [periodKey]: response.isUnlocked }));
      return response.isUnlocked;
    } catch (error) {
      console.error('[HoroscopeContainer] Failed to check unlock status:', error);
      // Default to showing credit gate on error (fail-safe)
      setUnlockStatus(prev => ({ ...prev, [periodKey]: false }));
      return false;
    }
  };

  // Load credit-gated horoscope with parallel unlock check + background generation
  const loadCreditGatedHoroscope = async (
    tab: 'today' | 'thisWeek',
    targetUserId: string,
    isRetry: boolean
  ) => {
    const periodKey = getPeriodKey(tab);

    // Skip if already have unlocked content in main cache (unless retrying)
    if (!isRetry && horoscopeCache[tab]) return;

    const startDate = tab === 'today'
      ? getTodayRange().start.toISOString().split('T')[0]
      : getCurrentWeekRange().start.toISOString().split('T')[0];
    const type = tab === 'today' ? 'daily' : 'weekly';

    // 1. Check unlock status (fast ~50ms) - run in parallel with generation
    const unlockStatusPromise = checkUnlockStatusForTab(tab, targetUserId);

    // 2. Start background generation (FREE - no credit charge)
    setBackgroundGenerating(prev => ({ ...prev, [tab]: true }));
    const generatePromise = getHoroscopeForPeriod(targetUserId, startDate, type)
      .then(horoscope => {
        // Store in pending cache until unlocked
        setPendingHoroscopeCache(prev => ({ ...prev, [tab]: horoscope }));
        setLoadedTabs(prev => new Set([...prev, tab]));
        setHoroscopeErrors(prev => ({ ...prev, [tab]: null }));
        return horoscope;
      })
      .catch(error => {
        console.error(`[HoroscopeContainer] Background generation failed for ${tab}:`, error);
        setHoroscopeErrors(prev => ({
          ...prev,
          [tab]: `Failed to generate ${tab} horoscope: ${(error as Error).message}`,
        }));
        return null;
      })
      .finally(() => {
        setBackgroundGenerating(prev => ({ ...prev, [tab]: false }));
      });

    // Wait for unlock status check (fast) to determine UI
    const isUnlocked = await unlockStatusPromise;

    if (isUnlocked) {
      // User already has access - wait for generation and show content
      const horoscope = await generatePromise;
      if (horoscope) {
        setHoroscopeCache(prev => ({ ...prev, [tab]: horoscope }));
        setPendingHoroscopeCache(prev => ({ ...prev, [tab]: null }));
      }
    }
    // If not unlocked, UI will show credit gate (generation continues in background)
  };

  // Load horoscope directly (for non-credit-gated tabs or premium/pro users)
  const loadHoroscopeDirectly = async (
    tab: 'today' | 'thisWeek' | 'thisMonth',
    targetUserId: string,
    isRetry: boolean
  ) => {
    // Skip if already have data (unless retrying)
    if (!isRetry && horoscopeCache[tab]) return;

    setHoroscopeLoading(true);
    // Clear any previous error and start extended loading timer
    setHoroscopeErrors(prev => ({ ...prev, [tab]: null }));
    startExtendedLoadingTimer(tab);

    try {
      let startDate: Date | string;
      let type: 'daily' | 'weekly' | 'monthly';

      switch (tab) {
        case 'today':
          startDate = getTodayRange().start.toISOString().split('T')[0];
          type = 'daily';
          break;
        case 'thisWeek':
          startDate = getCurrentWeekRange().start;
          type = 'weekly';
          break;
        case 'thisMonth':
          startDate = getCurrentMonthRange().start;
          type = 'monthly';
          break;
        default:
          throw new Error(`Unknown tab: ${tab}`);
      }

      const horoscope = await getHoroscopeForPeriod(targetUserId, startDate, type);
      setHoroscopeCache(prev => ({ ...prev, [tab]: horoscope }));
      setLoadedTabs(prev => new Set([...prev, tab]));
      setHoroscopeErrors(prev => ({ ...prev, [tab]: null }));
    } catch (error) {
      console.error(`Error fetching ${tab} horoscope:`, error);
      setHoroscopeErrors(prev => ({
        ...prev,
        [tab]: `Failed to load ${tab} horoscope: ${(error as Error).message}`,
      }));
      setLoadedTabs(prev => new Set([...prev, tab]));
    } finally {
      setHoroscopeLoading(false);
      clearExtendedLoading(tab);
    }
  };

  // Helper function to capitalize aspect names
  const capitalizeAspect = (aspect: string): string => {
    if (!aspect) {return 'N/A';}
    return aspect.charAt(0).toUpperCase() + aspect.slice(1);
  };

  // Helper function to get aspect symbols
  const getAspectSymbol = (aspect: string): string => {
    const aspectSymbols: { [key: string]: string } = {
      'conjunction': '☌',
      'sextile': '⚹',
      'square': '□',
      'trine': '△',
      'opposition': '☍',
      'quincunx': '⚻',
      'inconjunct': '⚻', // Alternative name for quincunx
    };

    return aspectSymbols[aspect?.toLowerCase()] || aspect || '';
  };

  // Helper function to add retrograde symbol to planet names
  const getPlanetDisplayName = (planet: string, isRetrograde?: boolean): string => {
    return `${planet}${isRetrograde ? ' ℞' : ''}`;
  };


  // Component to render transit description with symbols
  const TransitDescriptionWithSymbols: React.FC<{
    transit: TransitEvent;
    textStyle: any;
    iconSize?: number;
    iconColor?: string;
  }> = ({ transit, textStyle, iconSize = 16, iconColor = colors.primary }) => {
    // If transit has a pre-written description, use it as text
    if (transit.description) {
      return <Text style={textStyle}>{transit.description}</Text>;
    }

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Transiting Planet Symbol and Name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AstroIcon type="planet" name={transit.transitingPlanet} size={iconSize} color={iconColor} />
          <Text style={textStyle}> {transit.transitingPlanet}</Text>
        </View>

        {/* Retrograde indicator if applicable */}
        {transit.isRetrograde && <Text style={textStyle}> ℞</Text>}

        {/* Sign information with symbols and names */}
        {transit.transitingSigns && transit.transitingSigns.length > 1 ? (
          <>
            <Text style={textStyle}> (moving from </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.transitingSigns[0]} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.transitingSigns[0]}</Text>
            </View>
            <Text style={textStyle}> to </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.transitingSigns[transit.transitingSigns.length - 1]} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.transitingSigns[transit.transitingSigns.length - 1]}</Text>
            </View>
            <Text style={textStyle}>)</Text>
          </>
        ) : transit.transitingSign ? (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.transitingSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.transitingSign}</Text>
            </View>
          </>
        ) : null}

        {/* Aspect symbol and name */}
        <Text style={textStyle}> {getAspectSymbol(transit.aspect)} {transit.aspect} </Text>

        {/* Target type and planet */}
        {transit.type === 'transit-to-natal' && <Text style={textStyle}>natal </Text>}
        {transit.targetPlanet && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AstroIcon type="planet" name={transit.targetPlanet} size={iconSize} color={iconColor} />
            <Text style={textStyle}> {transit.targetPlanet}</Text>
          </View>
        )}
        {transit.targetIsRetrograde && <Text style={textStyle}> ℞</Text>}

        {/* Target sign */}
        {transit.targetSign && (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.targetSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.targetSign}</Text>
            </View>
          </>
        )}

        {/* Target house */}
        {transit.targetHouse && (
          <Text style={textStyle}> in {transit.targetHouse}th house</Text>
        )}
      </View>
    );
  };

  // Helper function to get transit description (kept for backwards compatibility)
  const getTransitDescription = (transit: TransitEvent): string => {
    if (transit.description) {
      return transit.description;
    }

    let description = `${getPlanetDisplayName(transit.transitingPlanet, transit.isRetrograde)}`;

    // Add sign information
    if (transit.transitingSigns && transit.transitingSigns.length > 1) {
      description += ` (moving from ${transit.transitingSigns[0]} to ${transit.transitingSigns[transit.transitingSigns.length - 1]})`;
    } else if (transit.transitingSign) {
      description += ` in ${transit.transitingSign}`;
    }

    if (transit.type === 'transit-to-natal') {
      description += ` ${transit.aspect || ''} natal ${getPlanetDisplayName(transit.targetPlanet || '', transit.targetIsRetrograde)}`;

      // Add natal planet's sign and house
      if (transit.targetSign) {
        description += ` in ${transit.targetSign}`;
      }
      if (transit.targetHouse) {
        description += ` in ${transit.targetHouse}th house`;
      }
    } else if (transit.type === 'transit-to-transit') {
      description += ` ${transit.aspect || ''} ${getPlanetDisplayName(transit.targetPlanet || '', transit.targetIsRetrograde)}`;

      // Add target planet's sign and house
      if (transit.targetSign) {
        description += ` in ${transit.targetSign}`;
      }
      if (transit.targetHouse) {
        description += ` in ${transit.targetHouse}th house`;
      }
    }

    return description;
  };

  // Fetch horoscope for a specific tab with retry capability
  const fetchHoroscopeForTab = async (tab: HoroscopeFilter, isRetry: boolean = false) => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId || tab === 'chat') {return;}

    // For credit-gated tabs (daily/weekly for free users), use parallel loading
    if (isTabCreditGated(tab) && (tab === 'today' || tab === 'thisWeek')) {
      await loadCreditGatedHoroscope(tab, targetUserId, isRetry);
      return;
    }

    // Non-credit-gated tabs (monthly, premium/pro users) - load directly
    // Cast to proper type since we've already filtered out 'chat' above
    await loadHoroscopeDirectly(tab as 'today' | 'thisWeek' | 'thisMonth', targetUserId, isRetry);
  };

  // Retry function for failed horoscopes
  const retryHoroscope = () => {
    fetchHoroscopeForTab(activeTab, true);
  };

  // Handle unlocking a credit-gated horoscope (uses backend unlock endpoint)
  const handleUnlockHoroscope = async (tab: 'today' | 'thisWeek') => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) return;

    setUnlockingTab(tab);

    const period = tab === 'today' ? 'daily' : 'weekly';
    const startDate = tab === 'today'
      ? getTodayRange().start.toISOString().split('T')[0]
      : getCurrentWeekRange().start.toISOString().split('T')[0];

    try {
      // Call backend unlock endpoint (this deducts credits)
      const response = await horoscopesApi.unlockHoroscope(targetUserId, period, startDate);

      if (response.success) {
        // Update unlock status cache
        const periodKey = getPeriodKey(tab);
        setUnlockStatus(prev => ({ ...prev, [periodKey]: true }));

        // Move content from pending to main cache
        if (pendingHoroscopeCache[tab]) {
          setHoroscopeCache(prev => ({
            ...prev,
            [tab]: pendingHoroscopeCache[tab],
          }));
          setPendingHoroscopeCache(prev => ({ ...prev, [tab]: null }));
        }

        // Refresh credit balance from backend to sync
        refreshBalance();

        console.log('[HoroscopeContainer] Horoscope unlocked successfully:', {
          tab,
          creditsCharged: response.creditsCharged,
          alreadyUnlocked: response.alreadyUnlocked,
        });
      }
    } catch (error: any) {
      console.error('[HoroscopeContainer] Error unlocking horoscope:', error);

      // Handle 402 Insufficient Credits error
      if (error.status === 402 || error.code === 'INSUFFICIENT_CREDITS') {
        // Show credit purchase flow
        const creditAction: CreditAction = tab === 'today' ? 'dailyHoroscope' : 'weeklyHoroscope';
        await creditFlowManager.handleInsufficientCredits({
          currentTier: subscriptionTier,
          currentCredits: error.available ?? total,
          requiredCredits: error.required ?? getCost(creditAction),
          source: `horoscope_${tab}`,
        });
      } else {
        // Show generic error
        Alert.alert(
          'Unlock Failed',
          'Unable to unlock horoscope. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setUnlockingTab(null);
    }
  };

  // Listen for app state changes to refresh stale horoscopes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app comes to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[HoroscopeContainer] App returned to foreground, checking for stale data');
        invalidateStaleCaches();

        // Refetch current tab if cache was invalidated
        if (activeTab !== 'chat' && !horoscopeCache[activeTab as keyof HoroscopeCache]) {
          fetchHoroscopeForTab(activeTab);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [activeTab, invalidateStaleCaches, horoscopeCache]);

  // Load horoscope when active tab changes (but not for chat tab)
  useEffect(() => {
    if (activeTab !== 'chat') {
      // Check for stale cache before fetching
      invalidateStaleCaches();
      fetchHoroscopeForTab(activeTab);
    }
  }, [activeTab, userId, userData?.id]);


  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading horoscope data...</Text>
      </View>
    );
  }

  // Only show full error state if we have no data at all
  const hasAnyData = Object.values(horoscopeCache).some(value => value !== null);
  const hasAnyHoroscopeError = Object.values(horoscopeErrors).some(err => err !== null);
  if ((error || hasAnyHoroscopeError) && !hasAnyData) {
    const errorMessage = error || Object.values(horoscopeErrors).find(err => err !== null);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading data: {errorMessage}</Text>
      </View>
    );
  }

  const tabOptions = [
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'chat', label: 'Ask Stellium' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Sticky Tab Navigation */}
      <View style={styles.stickyTabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContentContainer}
        >
          {tabOptions.map((tab) => {
            const chatLocked = tab.key === 'chat' && isChatLocked;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.activeTabButton,
                  chatLocked && styles.lockedTabButton,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={styles.tabButtonContent}>
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab.key && styles.activeTabButtonText,
                      chatLocked && styles.lockedTabButtonText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {/* Show lock icon for subscription-locked chat tab */}
                  {chatLocked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Content or Chat */}
      {activeTab === 'chat' ? (
        isChatLocked ? (
          <LockedHoroscopeTab horoscopeType="chat" />
        ) : (
          <HoroscopeChatTab
            userId={userId!}
            transitWindows={transitWindows}
            transitWindowsLoading={loading}
            transitWindowsError={error}
            onRetryTransitWindows={onRetryTransitWindows || (() => {})}
          />
        )
      ) : shouldShowCreditGate(activeTab) ? (
        <CreditGatedHoroscopeTab
          horoscopeType={activeTab === 'today' ? 'daily' : 'weekly'}
          creditCost={activeTab === 'today' ? CREDIT_COSTS.dailyHoroscope : CREDIT_COSTS.weeklyHoroscope}
          onUnlock={() => handleUnlockHoroscope(activeTab as 'today' | 'thisWeek')}
          isLoading={unlockingTab === activeTab}
          isGenerating={backgroundGenerating[activeTab] || false}
        />
      ) : (
        <ScrollView style={styles.scrollContent}>

          {/* Partial Error Indicator - only show if OTHER tabs have errors and current tab loaded successfully */}
          {(() => {
            const otherTabsHaveErrors = Object.entries(horoscopeErrors).some(
              ([tab, err]) => tab !== activeTab && err !== null
            );
            const currentTabLoaded = horoscopeCache[activeTab] !== null;
            return otherTabsHaveErrors && currentTabLoaded && (
              <View style={styles.partialErrorNotice}>
                <Text style={styles.partialErrorText}>
                  ⚠️ Some horoscopes couldn't be loaded. Switch to other tabs to see available content.
                </Text>
              </View>
            );
          })()}

          {/* Horoscope Content */}
          <View style={styles.section}>
            {horoscopeCache[activeTab] ? (
            <View style={styles.horoscopeCard}>
              <Text style={styles.horoscopeTitle}>
                Your {activeTab === 'today' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
              </Text>
              <Text style={styles.horoscopeText}>
                {horoscopeCache[activeTab]?.horoscope.text || horoscopeCache[activeTab]?.horoscope.interpretation || 'No horoscope content available.'}
              </Text>
              <Text style={styles.horoscopeDate}>
                {formatDateRange(horoscopeCache[activeTab]!.horoscope.startDate, horoscopeCache[activeTab]!.horoscope.endDate)}
              </Text>

              {/* Daily horoscope key transits */}
              {activeTab === 'today' && horoscopeCache[activeTab]?.horoscope.keyTransits && horoscopeCache[activeTab]!.horoscope.keyTransits!.length > 0 && (
                <View style={styles.keyTransitsSection}>
                  <Text style={styles.keyTransitsTitle}>Key Influences</Text>
                  {horoscopeCache[activeTab]!.horoscope.keyTransits!.map((transit, index) => (
                    <View key={index} style={[styles.keyThemeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.keyThemeContent}>
                        {/* Transiting Planet */}
                        <View style={styles.keyThemeIconText}>
                          <AstroIcon type="planet" name={transit.transitingPlanet} size={16} color={colors.onSurface} />
                          <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                            {' '}{transit.transitingPlanet}
                          </Text>
                        </View>

                        {/* Aspect */}
                        <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                          {' '}{getAspectSymbol(transit.aspect)} {transit.aspect}{' '}
                        </Text>

                        {/* Target Planet */}
                        <View style={styles.keyThemeIconText}>
                          <AstroIcon type="planet" name={transit.targetPlanet} size={16} color={colors.onSurface} />
                          <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                            {' '}{transit.targetPlanet}
                          </Text>
                        </View>
                      </View>

                      {/* Exact Date */}
                      <Text style={[styles.keyThemeDateText, { color: colors.onSurfaceVariant }]}>
                        exact: {formatDate(transit.exactDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Weekly/Monthly horoscope key themes */}
              {activeTab !== 'today' && horoscopeCache[activeTab]?.horoscope.analysis?.keyThemes && (
                <View style={styles.keyThemesSection}>
                  <Text style={styles.keyThemesTitle}>Key Influences</Text>
                  {horoscopeCache[activeTab]!.horoscope.analysis!.keyThemes!.map((theme, index) => (
                    <View key={index} style={[styles.keyThemeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.keyThemeContent}>
                        {/* Transiting Planet */}
                        <View style={styles.keyThemeIconText}>
                          <AstroIcon type="planet" name={theme.transitingPlanet} size={16} color={colors.onSurface} />
                          <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                            {' '}{theme.transitingPlanet}
                          </Text>
                        </View>

                        {/* Aspect */}
                        <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                          {' '}{getAspectSymbol(theme.aspect)} {theme.aspect}{' '}
                        </Text>

                        {/* Target Planet */}
                        {theme.targetPlanet && (
                          <View style={styles.keyThemeIconText}>
                            <AstroIcon type="planet" name={theme.targetPlanet} size={16} color={colors.onSurface} />
                            <Text style={[styles.keyThemeDescription, { color: colors.onSurface }]}>
                              {' '}{theme.targetPlanet}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Exact Date */}
                      {theme.exactDate && (
                        <Text style={[styles.keyThemeDateText, { color: colors.onSurfaceVariant }]}>
                          {formatDate(theme.exactDate)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.horoscopeGenerating}>
              {horoscopeLoading ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} style={styles.generatingSpinner} />
                  <Text style={styles.horoscopeGeneratingTitle}>
                    {extendedLoading[activeTab as 'today' | 'thisWeek' | 'thisMonth']
                      ? 'Still Loading...'
                      : `Generating Your ${activeTab === 'today' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope`}
                  </Text>
                  <Text style={styles.horoscopeGeneratingText}>
                    {extendedLoading[activeTab as 'today' | 'thisWeek' | 'thisMonth']
                      ? 'This is taking longer than usual. Please wait while we prepare your personalized horoscope...'
                      : 'We\'re analyzing the cosmic influences for this period...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.horoscopeErrorTitle}>
                    Unable to Load {activeTab === 'today' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
                  </Text>
                  <Text style={styles.horoscopeErrorText}>
                    We're experiencing issues loading this horoscope. Please try again.
                  </Text>
                  {horoscopeErrors[activeTab] && (
                    <Text style={styles.errorDetails}>Error: {horoscopeErrors[activeTab]}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={retryHoroscope}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
        </ScrollView>
      )}
    </View>
  );
};

// Create a function to generate dynamic styles based on theme
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyTabContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    color: colors.onSurfaceVariant,
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabButtonText: {
    color: colors.onPrimary,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedTabButton: {
    opacity: 0.7,
  },
  lockedTabButtonText: {
    opacity: 0.8,
  },
  lockIcon: {
    fontSize: 12,
  },
  creditIndicator: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  activeCreditIndicator: {
    color: colors.onPrimary,
  },
  section: {
    margin: 16,
  },
  horoscopeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horoscopeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  horoscopeText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
    marginBottom: 12,
  },
  horoscopeDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
  },
  tabContentContainer: {
    paddingRight: 16,
  },
  keyTransitsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keyTransitsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  keyThemesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keyThemesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  keyThemeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  keyThemeContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  keyThemeIconText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyThemeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  keyThemeDateText: {
    fontSize: 12,
    marginTop: 8,
  },
  partialErrorNotice: {
    backgroundColor: colors.surfaceVariant,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partialErrorText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
  horoscopeGenerating: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  generatingSpinner: {
    marginBottom: 16,
  },
  horoscopeGeneratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  horoscopeGeneratingText: {
    fontSize: 14,
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 20,
  },
  horoscopeError: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  horoscopeErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  horoscopeErrorText: {
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.onError,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HoroscopeContainer;
