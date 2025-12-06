import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
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
import { useCreditsGate } from '../hooks/useCreditsGate';
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

  // Credit gating state for free users
  const [purchasedTabs, setPurchasedTabs] = useState<Record<string, boolean>>({});
  const [pendingHoroscopeCache, setPendingHoroscopeCache] = useState<HoroscopeCache>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });
  const [unlockingTab, setUnlockingTab] = useState<HoroscopeFilter | null>(null);

  const { userData, userSubscription } = useStore();
  const { checkAndProceed, isChecking } = useCreditsGate();

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

  // Check if user has already paid for this tab's current period
  const isTabPurchased = useCallback((tab: HoroscopeFilter): boolean => {
    const periodKey = getPeriodKey(tab);
    return purchasedTabs[periodKey] === true;
  }, [purchasedTabs, getPeriodKey]);

  // Check if tab should show credit gate UI (free users who haven't purchased)
  const shouldShowCreditGate = useCallback((tab: HoroscopeFilter): boolean => {
    return isTabCreditGated(tab) && !isTabPurchased(tab);
  }, [isTabCreditGated, isTabPurchased]);

  // Check if chat tab is subscription-locked (for free users)
  const isChatLocked = subscriptionTier === 'free';

  // Helper function to add timeout to promises
  const withTimeout = (promise: Promise<any>, timeoutMs: number = 30000): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  };

  // Helper function to get horoscope for a specific period
  const getHoroscopeForPeriod = async (targetUserId: string, startDate: Date | string, type: 'daily' | 'weekly' | 'monthly') => {
    try {
      let response;
      switch (type) {
        case 'daily':
          response = await withTimeout(horoscopesApi.generateDailyHoroscope(targetUserId, typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]));
          break;
        case 'weekly':
          response = await withTimeout(horoscopesApi.generateWeeklyHoroscope(targetUserId, typeof startDate === 'string' ? new Date(startDate) : startDate));
          break;
        case 'monthly':
          response = await withTimeout(horoscopesApi.generateMonthlyHoroscope(targetUserId, typeof startDate === 'string' ? new Date(startDate) : startDate));
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

    // Determine if this is a credit-gated tab that hasn't been purchased yet
    const isCreditGated = isTabCreditGated(tab);
    const isPurchased = isTabPurchased(tab);

    // Skip if already have data in the appropriate cache (unless retrying)
    if (!isRetry) {
      if (isCreditGated && !isPurchased && pendingHoroscopeCache[tab]) {
        return; // Already have pending data for credit-gated tab
      }
      if ((!isCreditGated || isPurchased) && horoscopeCache[tab]) {
        return; // Already have accessible data
      }
    }

    setHoroscopeLoading(true);
    if (isRetry) {
      setHoroscopeErrors(prev => ({ ...prev, [tab]: null }));
    }

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
      }

      const horoscope = await getHoroscopeForPeriod(targetUserId, startDate, type);

      // Store in appropriate cache based on credit gating status
      if (isCreditGated && !isPurchased) {
        // Store in pending cache (user hasn't paid yet)
        setPendingHoroscopeCache(prev => ({
          ...prev,
          [tab]: horoscope,
        }));
      } else {
        // Store in main cache (accessible immediately)
        setHoroscopeCache(prev => ({
          ...prev,
          [tab]: horoscope,
        }));
      }

      setLoadedTabs(prev => new Set([...prev, tab]));
      // Clear error for this tab on success
      setHoroscopeErrors(prev => ({ ...prev, [tab]: null }));
    } catch (error) {
      console.error(`Error fetching ${tab} horoscope:`, error);
      // Set error only for this specific tab
      setHoroscopeErrors(prev => ({
        ...prev,
        [tab]: `Failed to load ${tab} horoscope: ${(error as Error).message}`,
      }));
      setLoadedTabs(prev => new Set([...prev, tab])); // Mark as loaded even if failed
    } finally {
      setHoroscopeLoading(false);
    }
  };

  // Retry function for failed horoscopes
  const retryHoroscope = () => {
    fetchHoroscopeForTab(activeTab, true);
  };

  // Handle unlocking a credit-gated horoscope
  const handleUnlockHoroscope = async (tab: 'today' | 'thisWeek') => {
    const creditAction: CreditAction = tab === 'today' ? 'dailyHoroscope' : 'weeklyHoroscope';

    setUnlockingTab(tab);

    try {
      const allowed = await checkAndProceed({
        action: creditAction,
        source: `horoscope_${tab}`,
        onProceed: async () => {
          // Mark as purchased for this period
          const periodKey = getPeriodKey(tab);
          setPurchasedTabs(prev => ({
            ...prev,
            [periodKey]: true,
          }));

          // Move content from pending to main cache
          if (pendingHoroscopeCache[tab]) {
            setHoroscopeCache(prev => ({
              ...prev,
              [tab]: pendingHoroscopeCache[tab],
            }));
            setPendingHoroscopeCache(prev => ({
              ...prev,
              [tab]: null,
            }));
          }
        },
      });

      if (!allowed) {
        console.log('[HoroscopeContainer] User did not have enough credits or cancelled');
      }
    } catch (error) {
      console.error('[HoroscopeContainer] Error unlocking horoscope:', error);
    } finally {
      setUnlockingTab(null);
    }
  };

  // Load horoscope when active tab changes (but not for chat tab)
  useEffect(() => {
    if (activeTab !== 'chat') {
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
          isLoading={unlockingTab === activeTab || isChecking}
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
                    Generating Your {activeTab === 'today' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
                  </Text>
                  <Text style={styles.horoscopeGeneratingText}>
                    We're analyzing the cosmic influences for this period...
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
