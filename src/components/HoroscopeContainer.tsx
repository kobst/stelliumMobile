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
import { horoscopesApi, HoroscopeResponse, CustomHoroscopeResponse } from '../api/horoscopes';
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
  dateRangesOverlap 
} from '../utils/dateHelpers';

interface HoroscopeContainerProps {
  transitWindows?: TransitEvent[];
  loading?: boolean;
  error?: string | null;
  userId?: string;
}

interface HoroscopeCache {
  today: HoroscopeResponse | null;
  tomorrow: HoroscopeResponse | null;
  thisWeek: HoroscopeResponse | null;
  nextWeek: HoroscopeResponse | null;
  thisMonth: HoroscopeResponse | null;
  nextMonth: HoroscopeResponse | null;
}

const HoroscopeContainer: React.FC<HoroscopeContainerProps> = ({
  transitWindows = [],
  loading = false,
  error = null,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<HoroscopeFilter>('today');
  const [showTransits, setShowTransits] = useState(true);
  const [selectedTransits, setSelectedTransits] = useState<Set<number>>(new Set());
  const [customHoroscope, setCustomHoroscope] = useState<CustomHoroscopeResponse | null>(null);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [customHoroscopeError, setCustomHoroscopeError] = useState<string | null>(null);
  const [horoscopeCache, setHoroscopeCache] = useState<HoroscopeCache>({
    today: null,
    tomorrow: null,
    thisWeek: null,
    nextWeek: null,
    thisMonth: null,
    nextMonth: null,
  });
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);

  const { userData } = useStore();

  // Helper function to get horoscope for a specific period
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

  // Filter transit events based on active tab
  const filteredTransits = useMemo(() => {
    if (!transitWindows || transitWindows.length === 0) {
      return [];
    }

    const dateRange = getDateRangeForPeriod(activeTab);

    const filtered = transitWindows.filter(transit => {
      const transitStart = new Date(transit.start);
      const transitEnd = new Date(transit.end);
      
      return dateRangesOverlap(
        { start: transitStart, end: transitEnd },
        dateRange
      );
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return filtered;
  }, [transitWindows, activeTab]);

  // Helper function to capitalize aspect names
  const capitalizeAspect = (aspect: string): string => {
    if (!aspect) return 'N/A';
    return aspect.charAt(0).toUpperCase() + aspect.slice(1);
  };

  // Helper function to get transit description
  const getTransitDescription = (transit: TransitEvent): string => {
    if (transit.description) {
      return transit.description;
    }
    
    let description = `${transit.transitingPlanet}`;
    
    // Add sign information
    if (transit.transitingSigns && transit.transitingSigns.length > 1) {
      description += ` (moving from ${transit.transitingSigns[0]} to ${transit.transitingSigns[transit.transitingSigns.length - 1]})`;
    } else if (transit.transitingSign) {
      description += ` in ${transit.transitingSign}`;
    }
    
    if (transit.type === 'transit-to-natal') {
      description += ` ${transit.aspect || ''} natal ${transit.targetPlanet || ''}`;
      
      // Add natal planet's sign and house
      if (transit.targetSign) {
        description += ` in ${transit.targetSign}`;
      }
      if (transit.targetHouse) {
        description += ` in ${transit.targetHouse}th house`;
      }
    } else if (transit.type === 'transit-to-transit') {
      description += ` ${transit.aspect || ''} ${transit.targetPlanet || ''}`;
      
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

  // Fetch all horoscopes when component mounts
  useEffect(() => {
    const fetchAllHoroscopes = async () => {
      const targetUserId = userId || userData?.id;
      if (!targetUserId) return;
      
      setHoroscopeLoading(true);
      setHoroscopeError(null);
      
      try {
        // Get start dates for all periods
        const todayStart = getTodayRange().start;
        const tomorrowStart = getTomorrowRange().start;
        const thisWeekStart = getCurrentWeekRange().start;
        const nextWeekStart = getNextWeekRange().start;
        const thisMonthStart = getCurrentMonthRange().start;
        const nextMonthStart = getNextMonthRange().start;

        // Fetch all horoscopes in parallel
        const [
          todayHoroscope,
          tomorrowHoroscope,
          thisWeekHoroscope,
          nextWeekHoroscope,
          thisMonthHoroscope,
          nextMonthHoroscope,
        ] = await Promise.all([
          getHoroscopeForPeriod(targetUserId, todayStart.toISOString().split('T')[0], 'daily'),
          getHoroscopeForPeriod(targetUserId, tomorrowStart.toISOString().split('T')[0], 'daily'),
          getHoroscopeForPeriod(targetUserId, thisWeekStart, 'weekly'),
          getHoroscopeForPeriod(targetUserId, nextWeekStart, 'weekly'),
          getHoroscopeForPeriod(targetUserId, thisMonthStart, 'monthly'),
          getHoroscopeForPeriod(targetUserId, nextMonthStart, 'monthly'),
        ]);

        // Update cache with all horoscopes
        setHoroscopeCache({
          today: todayHoroscope,
          tomorrow: tomorrowHoroscope,
          thisWeek: thisWeekHoroscope,
          nextWeek: nextWeekHoroscope,
          thisMonth: thisMonthHoroscope,
          nextMonth: nextMonthHoroscope,
        });
      } catch (error) {
        console.error('Error fetching horoscopes:', error);
        setHoroscopeError((error as Error).message);
      } finally {
        setHoroscopeLoading(false);
      }
    };

    fetchAllHoroscopes();
  }, [userId, userData?.id]);

  // Handle transit selection
  const handleTransitSelection = (transitIndex: number) => {
    setSelectedTransits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transitIndex)) {
        newSet.delete(transitIndex);
      } else {
        newSet.add(transitIndex);
      }
      return newSet;
    });
  };

  // Generate custom horoscope
  const handleGenerateCustomHoroscope = async () => {
    if (selectedTransits.size === 0) {
      setCustomHoroscopeError('Please select at least one transit event');
      return;
    }

    const targetUserId = userId || userData?.id;
    if (!targetUserId) return;

    setGeneratingCustom(true);
    setCustomHoroscopeError(null);

    try {
      const selectedTransitEvents = filteredTransits
        .filter((_, index) => selectedTransits.has(index))
        .map(transit => ({
          type: transit.type,
          transitingPlanet: transit.transitingPlanet,
          exact: transit.exact,
          targetPlanet: transit.targetPlanet,
          aspect: transit.aspect,
          start: transit.start,
          end: transit.end,
          description: transit.description,
          transitingSign: transit.transitingSign,
          targetSign: transit.targetSign,
          transitingHouse: transit.transitingHouse,
          targetHouse: transit.targetHouse,
          moonPhaseData: transit.moonPhaseData,
        }));

      const response = await horoscopesApi.generateCustomHoroscope(targetUserId, selectedTransitEvents);
      if (response.success) {
        setCustomHoroscope(response);
      } else {
        throw new Error('Failed to generate custom horoscope');
      }
    } catch (error) {
      console.error('Error generating custom horoscope:', error);
      setCustomHoroscopeError((error as Error).message);
    } finally {
      setGeneratingCustom(false);
    }
  };

  if (loading || horoscopeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading horoscope data...</Text>
      </View>
    );
  }

  if (error || horoscopeError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading data: {error || horoscopeError}</Text>
      </View>
    );
  }

  const tabOptions = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'nextWeek', label: 'Next Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' },
  ] as const;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Horoscope Forecast</Text>
      
      {/* Tab Navigation */}
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

      {/* Horoscope Content */}
      <View style={styles.section}>
        {horoscopeCache[activeTab] && (
          <View style={styles.horoscopeCard}>
            <Text style={styles.horoscopeTitle}>
              Your {activeTab === 'today' || activeTab === 'tomorrow' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
            </Text>
            <Text style={styles.horoscopeText}>
              {horoscopeCache[activeTab]?.horoscope.text || horoscopeCache[activeTab]?.horoscope.interpretation || 'No horoscope content available.'}
            </Text>
            <Text style={styles.horoscopeDate}>
              {formatDateRange(horoscopeCache[activeTab]!.horoscope.startDate, horoscopeCache[activeTab]!.horoscope.endDate)}
            </Text>
            
            {/* Daily horoscope key transits */}
            {(activeTab === 'today' || activeTab === 'tomorrow') && horoscopeCache[activeTab]?.horoscope.keyTransits && horoscopeCache[activeTab]!.horoscope.keyTransits!.length > 0 && (
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
            {!(activeTab === 'today' || activeTab === 'tomorrow') && horoscopeCache[activeTab]?.horoscope.analysis?.keyThemes && (
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
        )}

        {/* Custom Horoscope Section */}
        {customHoroscope && (
          <View style={styles.customHoroscopeSection}>
            <Text style={styles.customHoroscopeTitle}>Custom Horoscope</Text>
            <Text style={styles.horoscopeText}>{customHoroscope.horoscope.text}</Text>
            <Text style={styles.horoscopeDate}>
              {formatDateRange(customHoroscope.horoscope.startDate, customHoroscope.horoscope.endDate)}
            </Text>
          </View>
        )}

        {/* Collapsible Transit Section */}
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
                  No significant transits found for {
                    activeTab === 'thisWeek' ? 'this week' :
                    activeTab === 'nextWeek' ? 'next week' :
                    activeTab === 'thisMonth' ? 'this month' : 'next month'
                  }.
                </Text>
              ) : (
                <>
                  <View style={styles.transitActions}>
                    <TouchableOpacity
                      style={[
                        styles.generateCustomButton,
                        (selectedTransits.size === 0 || generatingCustom) && styles.disabledButton,
                      ]}
                      onPress={handleGenerateCustomHoroscope}
                      disabled={selectedTransits.size === 0 || generatingCustom}
                    >
                      <Text style={styles.generateCustomButtonText}>
                        {generatingCustom ? 'Generating...' : 'Generate Custom Horoscope'}
                      </Text>
                    </TouchableOpacity>
                    {customHoroscopeError && (
                      <Text style={styles.errorText}>{customHoroscopeError}</Text>
                    )}
                  </View>
                  
                  {filteredTransits.map((transit, index) => (
                    <View key={index} style={styles.transitRow}>
                      <TouchableOpacity
                        style={styles.transitCheckbox}
                        onPress={() => handleTransitSelection(index)}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedTransits.has(index) && styles.checkedCheckbox,
                        ]}>
                          {selectedTransits.has(index) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.transitInfo}>
                        <Text style={styles.transitDescription}>
                          {getTransitDescription(transit)}
                        </Text>
                        <Text style={styles.transitDateRange}>
                          {formatDateRange(transit.start, transit.end)}
                        </Text>
                        <Text style={styles.transitExactDate}>
                          Exact: {formatDate(transit.exact)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 16,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabContentContainer: {
    paddingRight: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTabButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabButtonText: {
    color: 'white',
  },
  section: {
    margin: 16,
  },
  horoscopeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  horoscopeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  horoscopeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  horoscopeDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  keyTransitsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  keyTransitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  transitItem: {
    marginBottom: 8,
  },
  transitText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  transitPlanet: {
    fontWeight: '600',
    color: '#8b5cf6',
  },
  transitDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  keyThemesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  keyThemesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  themeText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  customHoroscopeSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  customHoroscopeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  transitSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transitToggle: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transitToggleText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  transitDetailsContainer: {
    marginTop: 16,
  },
  noTransitsText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  transitActions: {
    marginBottom: 16,
  },
  generateCustomButton: {
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  generateCustomButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  transitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  transitCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transitInfo: {
    flex: 1,
  },
  transitDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  transitDateRange: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  transitExactDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default HoroscopeContainer;