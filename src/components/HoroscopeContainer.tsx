import React, { useState, useMemo, useEffect } from 'react';
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
} from '../utils/dateHelpers';
import { useTheme } from '../theme';
import { AstroIcon } from '../../utils/astrologyIcons';
import HoroscopeChatTab from './HoroscopeChatTab';

interface HoroscopeContainerProps {
  transitWindows?: TransitEvent[];
  loading?: boolean;
  error?: string | null;
  userId?: string;
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
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<HoroscopeFilter>('today');
  const [showTransits, setShowTransits] = useState(true);
  const [horoscopeCache, setHoroscopeCache] = useState<HoroscopeCache>({
    today: null,
    thisWeek: null,
    thisMonth: null,
  });
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);
  const [loadedTabs, setLoadedTabs] = useState<Set<HoroscopeFilter>>(new Set());

  // Chat tab specific state
  const [customTransitWindows, setCustomTransitWindows] = useState<TransitEvent[]>([]);
  const [transitWindowsLoading, setTransitWindowsLoading] = useState(false);
  const [transitWindowsError, setTransitWindowsError] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const { userData } = useStore();

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

  // Filter transit events based on active tab (excluding chat tab)
  const filteredTransits = useMemo(() => {
    if (activeTab === 'chat') {
      return []; // Chat tab doesn't use this filtered list
    }

    if (!transitWindows || transitWindows.length === 0) {
      return [];
    }

    const dateRange = getDateRangeForPeriod(activeTab, customDateRange || undefined);

    const transitsToFilter = transitWindows.filter(transit => {
      const transitStart = new Date(transit.start);
      const transitEnd = new Date(transit.end);

      return dateRangesOverlap(
        { start: transitStart, end: transitEnd },
        dateRange
      );
    });

    return transitsToFilter.sort((a, b) => {
      // Sort by priority (high to low), then by start date
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }, [transitWindows, activeTab, customDateRange]);

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
    if (!targetUserId || (!isRetry && loadedTabs.has(tab) && horoscopeCache[tab])) {return;}

    setHoroscopeLoading(true);
    if (isRetry) {
      setHoroscopeError(null);
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

      setHoroscopeCache(prev => ({
        ...prev,
        [tab]: horoscope,
      }));

      setLoadedTabs(prev => new Set([...prev, tab]));
      if (isRetry) {
        setHoroscopeError(null);
      }
    } catch (error) {
      console.error(`Error fetching ${tab} horoscope:`, error);
      setHoroscopeError(`Failed to load ${tab} horoscope: ${(error as Error).message}`);
      setLoadedTabs(prev => new Set([...prev, tab])); // Mark as loaded even if failed
    } finally {
      setHoroscopeLoading(false);
    }
  };

  // Retry function for failed horoscopes
  const retryHoroscope = () => {
    fetchHoroscopeForTab(activeTab, true);
  };

  // Fetch transit windows for custom horoscope
  const fetchTransitWindows = async () => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {return;}

    setTransitWindowsLoading(true);
    setTransitWindowsError(null);

    try {
      // Query range: 3 days ago to 6 weeks forward (45 days total)
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 3); // Start 3 days ago
      const toDate = new Date(now);
      toDate.setDate(now.getDate() + 42); // 6 weeks forward (42 days)

      const response = await withTimeout(horoscopesApi.getTransitWindows(
        targetUserId,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      ));

      // Combine both transit-to-natal and transit-to-transit events
      const allTransitEvents = [
        ...(response.transitEvents || []),
        ...(response.transitToTransitEvents || [])
      ];

      if (allTransitEvents.length > 0) {
        // Filter out transits that ended before today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const activeTransits = allTransitEvents.filter(transit => {
          const transitEnd = new Date(transit.end);
          return transitEnd >= today; // Keep transits ending today or later
        });

        setCustomTransitWindows(activeTransits);
        // Set default custom date range to 6 weeks from today (for display purposes)
        if (!customDateRange) {
          const displayStart = new Date(); // Always start display range from today
          const sixWeeksOut = new Date(displayStart);
          sixWeeksOut.setDate(displayStart.getDate() + 42);
          setCustomDateRange({ start: displayStart, end: sixWeeksOut });
        }
      } else {
        throw new Error('No transit data received');
      }
    } catch (error) {
      console.error('Error fetching transit windows:', error);
      setTransitWindowsError(`Failed to load transit data: ${(error as Error).message}`);
    } finally {
      setTransitWindowsLoading(false);
    }
  };

  // Load horoscope when active tab changes
  useEffect(() => {
    if (activeTab === 'chat') {
      // For chat tab, fetch transit windows instead of horoscope
      if (customTransitWindows.length === 0) {
        fetchTransitWindows();
      }
    } else {
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
  if ((error || horoscopeError) && !hasAnyData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading data: {error || horoscopeError}</Text>
      </View>
    );
  }

  const tabOptions = [
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'chat', label: 'Chat' },
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
          {tabOptions.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.activeTabButtonText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable Content */}
      {activeTab === 'chat' ? (
        // Avoid nested vertical ScrollViews so the chat can control its own scrolling
        // Give the chat a full-height container with padding
        <View style={[styles.scrollContent, { padding: 16 }] }>
          <HoroscopeChatTab
            userId={userId || userData?.id || ''}
            transitWindows={customTransitWindows}
            transitWindowsLoading={transitWindowsLoading}
            transitWindowsError={transitWindowsError}
            onRetryTransitWindows={fetchTransitWindows}
          />
        </View>
      ) : (
        <ScrollView style={styles.scrollContent}>

        {/* Partial Error Indicator */}
        {horoscopeError && hasAnyData && (
          <View style={styles.partialErrorNotice}>
            <Text style={styles.partialErrorText}>
              ⚠️ Some horoscopes couldn't be loaded. Switch to other tabs to see available content.
            </Text>
          </View>
        )}

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
                  <Text style={styles.keyTransitsTitle}>Key Planetary Influences</Text>
                  {horoscopeCache[activeTab]!.horoscope.keyTransits!.map((transit, index) => (
                    <View key={index} style={styles.transitItem}>
                      <Text style={styles.transitText}>
                        <Text style={styles.transitPlanet}>{transit.transitingPlanet}</Text> {transit.aspect} {transit.targetPlanet}
                      </Text>
                      <Text style={styles.transitDate}>
                        (exact: {formatDate(transit.exactDate)})
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Weekly/Monthly horoscope key themes */}
              {activeTab !== 'today' && horoscopeCache[activeTab]?.horoscope.analysis?.keyThemes && (
                <View style={styles.keyThemesSection}>
                  <Text style={styles.keyThemesTitle}>Key Themes</Text>
                  {horoscopeCache[activeTab]!.horoscope.analysis!.keyThemes!.map((theme, index) => (
                    <Text key={index} style={styles.themeText}>
                      {theme.transitingPlanet} {theme.aspect} {theme.targetPlanet || ''}
                      {theme.exactDate && ` (${formatDate(theme.exactDate)})`}
                    </Text>
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
                  {horoscopeError && (
                    <Text style={styles.errorDetails}>Error: {horoscopeError}</Text>
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

          {/* Collapsible Transit Section - Only visible for non-chat tabs */}
          {activeTab !== 'chat' && (
            <View style={styles.transitSection}>
              <TouchableOpacity
                style={styles.transitToggle}
                onPress={() => setShowTransits(!showTransits)}
              >
                <Text style={styles.transitToggleText}>
                  {showTransits ? 'Hide' : 'Show'} Transit Details
                </Text>
              </TouchableOpacity>

              {showTransits && (
                <View style={styles.transitDetailsContainer}>
                  {filteredTransits.length === 0 ? (
                    <Text style={styles.noTransitsText}>
                      {`No significant transits found for ${
                          activeTab === 'today' ? 'today' :
                          activeTab === 'thisWeek' ? 'this week' :
                          activeTab === 'thisMonth' ? 'this month' : 'this period'
                        }.`
                      }
                    </Text>
                  ) : (
                    filteredTransits.map((transit, index) => (
                      <View key={index} style={styles.transitRow}>
                        <View style={styles.transitInfo}>
                          <TransitDescriptionWithSymbols
                            transit={transit}
                            textStyle={styles.transitDescription}
                            iconSize={16}
                            iconColor={colors.onSurface}
                          />
                          <Text style={styles.transitDateRange}>
                            {formatDateRange(transit.start, transit.end)}
                          </Text>
                          {transit.isExactInRange && transit.exact && (
                            <Text style={styles.transitExactDate}>
                              Exact: {formatDate(transit.exact)}
                            </Text>
                          )}
                          {transit.orbAtStart !== undefined && transit.orbAtEnd !== undefined && (
                            <Text style={styles.transitOrbInfo}>
                              Orb: {transit.orbAtStart.toFixed(1)}° → {transit.orbAtEnd.toFixed(1)}° ({transit.orbDirection})
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
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
    marginBottom: 8,
  },
  transitItem: {
    marginBottom: 8,
  },
  transitText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  transitPlanet: {
    fontWeight: '600',
    color: colors.primary,
  },
  transitDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
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
    marginBottom: 8,
  },
  themeText: {
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 4,
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
  transitSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transitToggle: {
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transitToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  transitDetailsContainer: {
    marginTop: 16,
  },
  noTransitsText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  transitRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transitInfo: {
    flex: 1,
  },
  transitDescription: {
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 4,
  },
  transitDateRange: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  transitExactDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  transitOrbInfo: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});

export default HoroscopeContainer;
