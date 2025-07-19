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
  const [loadedTabs, setLoadedTabs] = useState<Set<HoroscopeFilter>>(new Set());
  
  // Custom horoscope specific state
  const [customTransitWindows, setCustomTransitWindows] = useState<TransitEvent[]>([]);
  const [transitWindowsLoading, setTransitWindowsLoading] = useState(false);
  const [transitWindowsError, setTransitWindowsError] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  // Transit filtering state
  const [transitFilters, setTransitFilters] = useState({
    transitingPlanet: '',
    natalPlanet: '',
    dateRange: { start: '', end: '' },
    showFilters: false
  });

  const { userData } = useStore();

  // Helper function to add timeout to promises
  const withTimeout = (promise: Promise<any>, timeoutMs: number = 30000): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
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

  // Filter transit events based on active tab and filters
  const filteredTransits = useMemo(() => {
    let transitsToFilter: TransitEvent[] = [];
    
    if (activeTab === 'custom') {
      // For custom tab, use customTransitWindows
      transitsToFilter = customTransitWindows;
    } else {
      if (!transitWindows || transitWindows.length === 0) {
        return [];
      }
      
      const dateRange = getDateRangeForPeriod(activeTab, customDateRange || undefined);
      
      transitsToFilter = transitWindows.filter(transit => {
        const transitStart = new Date(transit.start);
        const transitEnd = new Date(transit.end);
        
        return dateRangesOverlap(
          { start: transitStart, end: transitEnd },
          dateRange
        );
      });
    }

    // Apply additional filters for custom tab
    if (activeTab === 'custom') {
      transitsToFilter = transitsToFilter.filter(transit => {
        // Filter by transiting planet
        if (transitFilters.transitingPlanet && 
            transit.transitingPlanet.toLowerCase() !== transitFilters.transitingPlanet.toLowerCase()) {
          return false;
        }
        
        // Filter by natal planet (targetPlanet)
        if (transitFilters.natalPlanet && transit.targetPlanet &&
            transit.targetPlanet.toLowerCase() !== transitFilters.natalPlanet.toLowerCase()) {
          return false;
        }
        
        // Filter by date range
        if (transitFilters.dateRange.start || transitFilters.dateRange.end) {
          const transitDate = new Date(transit.exact);
          
          if (transitFilters.dateRange.start) {
            const filterStartDate = new Date(transitFilters.dateRange.start);
            if (transitDate < filterStartDate) return false;
          }
          
          if (transitFilters.dateRange.end) {
            const filterEndDate = new Date(transitFilters.dateRange.end);
            filterEndDate.setHours(23, 59, 59, 999); // End of day
            if (transitDate > filterEndDate) return false;
          }
        }
        
        return true;
      });
    }

    return transitsToFilter.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [transitWindows, customTransitWindows, activeTab, customDateRange, transitFilters]);

  // Helper function to capitalize aspect names
  const capitalizeAspect = (aspect: string): string => {
    if (!aspect) return 'N/A';
    return aspect.charAt(0).toUpperCase() + aspect.slice(1);
  };

  // Get unique planet lists for filter dropdowns
  const getUniquePlanets = (transits: TransitEvent[], type: 'transiting' | 'natal') => {
    const planets = new Set<string>();
    transits.forEach(transit => {
      if (type === 'transiting') {
        planets.add(transit.transitingPlanet);
      } else if (type === 'natal' && transit.targetPlanet) {
        planets.add(transit.targetPlanet);
      }
    });
    return Array.from(planets).sort();
  };

  // Filter management functions
  const updateFilter = (filterType: string, value: string) => {
    setTransitFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const updateDateRangeFilter = (type: 'start' | 'end', value: string) => {
    setTransitFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const clearFilters = () => {
    setTransitFilters({
      transitingPlanet: '',
      natalPlanet: '',
      dateRange: { start: '', end: '' },
      showFilters: false
    });
  };

  const toggleFilters = () => {
    setTransitFilters(prev => ({
      ...prev,
      showFilters: !prev.showFilters
    }));
  };

  // Planet selection handlers
  const showPlanetPicker = (type: 'transiting' | 'natal') => {
    const planets = getUniquePlanets(customTransitWindows, type);
    const options = ['All Planets', ...planets];
    
    Alert.alert(
      `Select ${type === 'transiting' ? 'Transiting' : 'Natal'} Planet`,
      'Choose a planet to filter by:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...options.map(planet => ({
          text: planet,
          onPress: () => {
            const filterValue = planet === 'All Planets' ? '' : planet;
            if (type === 'transiting') {
              updateFilter('transitingPlanet', filterValue);
            } else {
              updateFilter('natalPlanet', filterValue);
            }
          }
        }))
      ]
    );
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

  // Fetch horoscope for a specific tab with retry capability
  const fetchHoroscopeForTab = async (tab: HoroscopeFilter, isRetry: boolean = false) => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId || (!isRetry && loadedTabs.has(tab) && horoscopeCache[tab])) return;
    
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
        case 'tomorrow':
          startDate = getTomorrowRange().start.toISOString().split('T')[0];
          type = 'daily';
          break;
        case 'thisWeek':
          startDate = getCurrentWeekRange().start;
          type = 'weekly';
          break;
        case 'nextWeek':
          startDate = getNextWeekRange().start;
          type = 'weekly';
          break;
        case 'thisMonth':
          startDate = getCurrentMonthRange().start;
          type = 'monthly';
          break;
        case 'nextMonth':
          startDate = getNextMonthRange().start;
          type = 'monthly';
          break;
      }
      
      const horoscope = await getHoroscopeForPeriod(targetUserId, startDate, type);
      
      setHoroscopeCache(prev => ({
        ...prev,
        [tab]: horoscope
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
    if (!targetUserId) return;

    setTransitWindowsLoading(true);
    setTransitWindowsError(null);

    try {
      // Default to 6 weeks from present date
      const now = new Date();
      const fromDate = new Date(now);
      const toDate = new Date(now);
      toDate.setDate(now.getDate() + 42); // 6 weeks forward (42 days)

      const response = await withTimeout(horoscopesApi.getTransitWindows(
        targetUserId,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      ));

      if (response.transitEvents && response.transitEvents.length > 0) {
        setCustomTransitWindows(response.transitEvents);
        // Set default custom date range to 6 weeks from now if not set
        if (!customDateRange) {
          const now = new Date();
          const sixWeeksOut = new Date(now);
          sixWeeksOut.setDate(now.getDate() + 42);
          setCustomDateRange({ start: now, end: sixWeeksOut });
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
    if (activeTab === 'custom') {
      // For custom tab, fetch transit windows instead of horoscope
      if (customTransitWindows.length === 0) {
        fetchTransitWindows();
      }
    } else {
      fetchHoroscopeForTab(activeTab);
    }
  }, [activeTab, userId, userData?.id]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
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
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'nextWeek', label: 'Next Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' },
    { key: 'custom', label: 'Custom' },
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
        {activeTab === 'custom' ? (
          // Custom horoscope interface
          <View>
            {transitWindowsLoading ? (
              <View style={styles.horoscopeGenerating}>
                <ActivityIndicator size="large" color="#8b5cf6" style={styles.generatingSpinner} />
                <Text style={styles.horoscopeGeneratingTitle}>Loading Transit Data</Text>
                <Text style={styles.horoscopeGeneratingText}>
                  Fetching available transit events for custom horoscope generation...
                </Text>
              </View>
            ) : transitWindowsError ? (
              <View style={styles.horoscopeError}>
                <Text style={styles.horoscopeErrorTitle}>Unable to Load Transit Data</Text>
                <Text style={styles.horoscopeErrorText}>
                  We're experiencing issues loading transit data. Please try again.
                </Text>
                <Text style={styles.errorDetails}>Error: {transitWindowsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchTransitWindows}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customHoroscopeInterface}>
                <Text style={styles.customInterfaceTitle}>Custom Horoscope Generator</Text>
                <Text style={styles.customInterfaceSubtitle}>
                  Select specific transit events below to generate a personalized horoscope interpretation.
                </Text>
                
                {/* Date Range Info */}
                {customDateRange && (
                  <View style={styles.dateRangeInfo}>
                    <Text style={styles.dateRangeText}>
                      Showing transits for: {formatDateRange(
                        customDateRange.start.toISOString(),
                        customDateRange.end.toISOString()
                      )}
                    </Text>
                  </View>
                )}

                {/* Filter Toggle Button */}
                <TouchableOpacity
                  style={styles.filterToggleButton}
                  onPress={toggleFilters}
                >
                  <Text style={styles.filterToggleText}>
                    {transitFilters.showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : horoscopeCache[activeTab] ? (
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
        ) : (
          <View style={styles.horoscopeGenerating}>
            {horoscopeLoading ? (
              <>
                <ActivityIndicator size="large" color="#8b5cf6" style={styles.generatingSpinner} />
                <Text style={styles.horoscopeGeneratingTitle}>
                  Generating Your {activeTab === 'today' || activeTab === 'tomorrow' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
                </Text>
                <Text style={styles.horoscopeGeneratingText}>
                  We're analyzing the cosmic influences for this period...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.horoscopeErrorTitle}>
                  Unable to Load {activeTab === 'today' || activeTab === 'tomorrow' ? 'Daily' : activeTab.includes('Week') ? 'Weekly' : 'Monthly'} Horoscope
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

        {/* Transit Filters for Custom Tab */}
        {activeTab === 'custom' && transitFilters.showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filter Transit Events</Text>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Transiting Planet:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => showPlanetPicker('transiting')}
                >
                  <Text style={styles.pickerText}>
                    {transitFilters.transitingPlanet || 'All Planets'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Natal Planet:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => showPlanetPicker('natal')}
                >
                  <Text style={styles.pickerText}>
                    {transitFilters.natalPlanet || 'All Planets'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Collapsible Transit Section - Always visible for custom tab */}
        <View style={styles.transitSection}>
          {activeTab !== 'custom' && (
            <TouchableOpacity
              style={styles.transitToggle}
              onPress={() => setShowTransits(!showTransits)}
            >
              <Text style={styles.transitToggleText}>
                {showTransits ? 'Hide' : 'Show'} Transit Details
              </Text>
            </TouchableOpacity>
          )}
          
          {(showTransits || activeTab === 'custom') && (
            <View style={styles.transitDetailsContainer}>
              {filteredTransits.length === 0 ? (
                <Text style={styles.noTransitsText}>
                  {activeTab === 'custom' 
                    ? 'No transit events found for the selected date range.'
                    : `No significant transits found for ${
                        activeTab === 'thisWeek' ? 'this week' :
                        activeTab === 'nextWeek' ? 'next week' :
                        activeTab === 'thisMonth' ? 'this month' : 'next month'
                      }.`
                  }
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
  partialErrorNotice: {
    backgroundColor: '#fbbf24',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  partialErrorText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
  },
  horoscopeGenerating: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    alignItems: 'center',
  },
  generatingSpinner: {
    marginBottom: 16,
  },
  horoscopeGeneratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
    textAlign: 'center',
  },
  horoscopeGeneratingText: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 20,
  },
  horoscopeError: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  horoscopeErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  horoscopeErrorText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
  customHoroscopeInterface: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  customInterfaceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
    textAlign: 'center',
  },
  customInterfaceSubtitle: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  dateRangeInfo: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filterToggleButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  filterToggleText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 6,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  filterActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  clearFiltersButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HoroscopeContainer;