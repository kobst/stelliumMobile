# Stellium Mobile App - React Native Starter Brief

## Project Overview

This document provides a comprehensive technical specification for creating a React Native mobile app based on the existing Stellium web application. The mobile app will focus on providing astrology chart analysis, horoscope features, and relationship compatibility in a mobile-optimized experience.

## App Structure & Navigation

### Bottom Tab Navigation (4 Primary Tabs):

1. **Horoscope Tab (Default/Home)**
   - Daily, weekly, monthly horoscopes
   - Transit calculations and astrological events
   - **Custom transit selection and personalized horoscope generation**
   - Time-based transit filtering (today, tomorrow, this week, next week, this month, next month)
   - Interactive transit selection with checkbox interface
   - Personalized forecasts based on user's birth chart and selected transits

2. **Chart Tab**
   - User's personal birth chart analysis
   - Guest chart management (create/view additional charts)
   - Chart visualization with ephemeris diagrams
   - Multi-stage analysis workflow (overview → full analysis)

3. **Relationships Tab**
   - Existing relationship analysis between user and others
   - Create new relationships (user + guest chart or celebrity)
   - Synastry and composite chart analysis
   - Compatibility scoring system

4. **Celebrity Tab**
   - Browse celebrity birth charts
   - Celebrity relationship analysis
   - Filter celebrities by various criteria
   - Compare user's chart with celebrity charts

### Key Differences from Web App:
- No admin functionality (web app is primarily for testing)
- Mobile-first UI/UX design
- Payment gate integration for premium features
- Enhanced touch interactions and mobile-specific features

## Technical Stack Recommendations

### Core Framework:
```bash
# Recommended setup
npx create-expo-app --template
# OR
npx react-native init SteliumMobile
```

### Essential Libraries:
```json
{
  "dependencies": {
    "react-navigation": "^6.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-svg": "^13.x",
    "react-native-chart-kit": "^6.x",
    "react-native-async-storage": "^1.x",
    "react-native-keychain": "^8.x",
    "react-native-maps": "^1.x",
    "react-native-date-picker": "^4.x",
    "zustand": "^4.x",
    "react-native-tab-view": "^3.x"
  }
}
```

### Navigation Structure:
```javascript
// Main Stack Navigator
- Auth Stack (Sign In/Sign Up) 
- Tab Navigator (Main App)
  - Horoscope Stack
  - Chart Stack  
  - Relationships Stack
  - Celebrity Stack
- Modal Stack (overlays)
  - Chat Interface
  - Analysis Details
  - Chart Creation
```

## API Integration Guide

### Base Configuration:
```javascript
const API_BASE_URL = 'https://your-backend-api.com';
const GOOGLE_API_KEY = 'your-google-api-key';

// Environment variables
REACT_APP_SERVER_URL=<backend API URL>
REACT_APP_GOOGLE_API_KEY=<Google Maps API key>
```

### Core API Endpoints:

#### User Management:
```javascript
// User creation and retrieval
POST /createUser
POST /createUserUnknownTime
POST /getUser
POST /getUserSubjects

// Example request structure:
{
  name: "John Doe",
  birthYear: 1990,
  birthMonth: 5,
  birthDay: 15,
  birthHour: 14,
  birthMinute: 30,
  birthLocation: "New York, NY, USA",
  timezone: "America/New_York"
}
```

#### Analysis Workflow System:
```javascript
// Two-stage workflow
POST /analysis/start-full          // Stage 2: Trigger full analysis
POST /analysis/full-status         // Poll for completion
POST /analysis/complete-data       // Get final results

// Workflow status polling pattern:
const pollAnalysisStatus = async (workflowId) => {
  const response = await fetch(`/analysis/full-status`, {
    method: 'POST',
    body: JSON.stringify({ workflowId })
  });
  return response.json();
};
```

#### Celebrity System:
```javascript
POST /createCeleb
POST /createCelebUnknownTime  
POST /getCelebs               // Browse celebrities
POST /getCelebrityRelationships
```

#### Relationship Analysis:
```javascript
POST /enhanced-relationship-analysis
POST /workflow/relationship/start
POST /workflow/relationship/status

// Relationship scoring system (7 categories):
{
  OVERALL_ATTRACTION_CHEMISTRY: { score: 85, analysis: "..." },
  EMOTIONAL_SECURITY_CONNECTION: { score: 78, analysis: "..." },
  COMMUNICATION_LEARNING: { score: 92, analysis: "..." },
  VALUES_GOALS_DIRECTION: { score: 71, analysis: "..." },
  INTIMACY_SEXUALITY: { score: 88, analysis: "..." },
  LONG_TERM_STABILITY: { score: 79, analysis: "..." },
  SPIRITUAL_GROWTH: { score: 83, analysis: "..." }
}
```

#### Chat System:
```javascript
POST /userChatBirthChartAnalysis      // Chat with birth chart data
POST /userChatRelationshipAnalysis    // Chat with relationship data  
POST /handleUserQuery                 // General queries
```

#### Horoscope System:
```javascript
POST /users/{userId}/horoscope/daily
POST /users/{userId}/horoscope/weekly  
POST /users/{userId}/horoscope/monthly
GET /users/{userId}/horoscope/latest
POST /getTransitWindows               // Astrological transits
POST /generateCustomHoroscope         // Custom horoscope from selected transits

// Custom transit horoscope generation
const generateCustomHoroscope = async (userId, selectedTransits) => {
  return await fetch('/generateCustomHoroscope', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      transitEvents: selectedTransits  // Array of selected transit objects
    })
  });
};
```

### Authentication Patterns:
```javascript
// Session-based auth with secure storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeAuthData = async (userData) => {
  await AsyncStorage.setItem('userData', JSON.stringify(userData));
  await AsyncStorage.setItem('userId', userData.id);
};

const getAuthData = async () => {
  const userData = await AsyncStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};
```

## State Management Structure (Zustand)

### Core Store Structure:
```javascript
import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // User & Authentication
  userData: null,
  userId: '',
  isAuthenticated: false,
  
  // Birth Chart Data
  userPlanets: [],
  userHouses: [],
  userAspects: [],
  userElements: {},
  userModalities: {},
  userQuadrants: {},
  userPatterns: {},
  
  // Context Management (for viewing different charts)
  currentUserContext: null,    // Account owner
  activeUserContext: null,     // Currently viewed user  
  previousUserContext: null,   // Navigation breadcrumb
  
  // Workflow States
  creationWorkflowState: {
    workflowId: null,
    status: null,
    isCompleted: false,
    progress: null
  },
  
  analysisWorkflowState: {
    isPaused: false,
    hasOverview: false,
    hasFullAnalysis: false,
    overviewContent: '',
    analysisContent: {}
  },
  
  relationshipWorkflowState: {
    isPaused: false,
    hasScores: false,
    scores: {},
    scoreAnalysis: {},
    currentRelationship: null
  },
  
  // UI States
  loading: false,
  error: null,
  activeTab: 'horoscope',
  
  // Transit & Horoscope States
  transitData: [],
  selectedTransits: new Set(),
  customHoroscope: null,
  horoscopeFilter: 'today', // today, tomorrow, thisWeek, nextWeek, thisMonth, nextMonth
  
  // Actions
  setUserData: (userData) => set({ userData, isAuthenticated: !!userData }),
  setWorkflowState: (workflowState) => set({ creationWorkflowState: workflowState }),
  setActiveUserContext: (context) => set({ activeUserContext: context }),
  clearError: () => set({ error: null }),
  
  // Transit & Horoscope Actions
  setTransitData: (transitData) => set({ transitData }),
  toggleTransitSelection: (transitId) => set((state) => {
    const newSelected = new Set(state.selectedTransits);
    if (newSelected.has(transitId)) {
      newSelected.delete(transitId);
    } else {
      newSelected.add(transitId);
    }
    return { selectedTransits: newSelected };
  }),
  setCustomHoroscope: (horoscope) => set({ customHoroscope: horoscope }),
  setHoroscopeFilter: (filter) => set({ horoscopeFilter: filter }),
}));
```

### Context Management Pattern:
```javascript
// Support for viewing multiple user profiles
const switchUserContext = (newUser) => {
  const { activeUserContext } = get();
  set({
    previousUserContext: activeUserContext,
    activeUserContext: newUser
  });
};

const navigateBack = () => {
  const { previousUserContext } = get();
  if (previousUserContext) {
    set({
      activeUserContext: previousUserContext,
      previousUserContext: null
    });
  }
};
```

## Essential Constants & Enumerations

### Astrological Data:
```javascript
// Planet definitions
export const PlanetEnum = {
  SUN: "Sun",
  MOON: "Moon", 
  ASCENDANT: "Ascendant",
  MERCURY: "Mercury",
  VENUS: "Venus",
  MARS: "Mars",
  SATURN: "Saturn", 
  JUPITER: "Jupiter",
  URANUS: "Uranus",
  NEPTUNE: "Neptune",
  PLUTO: "Pluto",
  MIDHEAVEN: "Midheaven"
};

// Zodiac signs
export const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", 
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Elements and modalities  
export const elements = {
  'Fire': ["Leo", "Aries", "Sagittarius"],
  'Earth': ["Taurus", "Virgo", "Capricorn"], 
  'Air': ["Gemini", "Libra", "Aquarius"],
  'Water': ["Cancer", "Scorpio", "Pisces"]
};

export const modalities = {
  'Cardinal': ["Aries", "Cancer", "Libra", "Capricorn"],
  'Fixed': ["Taurus", "Leo", "Scorpio", "Aquarius"],
  'Mutable': ["Gemini", "Virgo", "Sagittarius", "Pisces"]
};

// Astrological aspects
export const AspectEnum = {
  CONJUNCTION: "conjunction",
  SEXTILE: "sextile", 
  SQUARE: "square",
  TRINE: "trine",
  OPPOSITION: "opposition",
  QUINCUNX: "quincunx"
};
```

### Analysis Topic Structure:
```javascript
export const BroadTopicsEnum = {
  PERSONALITY_IDENTITY: {
    label: "Self-Expression and Identity",
    subtopics: {
      PERSONAL_IDENTITY: "Personal Identity and Self-Image",
      OUTWARD_EXPRESSION: "Outward Expression and Appearance", 
      CORE_SELF_TRAITS: "Core Self and Personality Traits",
      SELF_DEVELOPMENT: "Self-Development and Personal Growth"
    }
  },
  COMMUNICATION_BELIEFS: {
    label: "Communication, Learning, and Belief Systems", 
    subtopics: {
      COMMUNICATION_STYLES: "Communication Styles",
      MENTAL_GROWTH_CHALLENGES: "Mental Growth and Challenges",
      PHILOSOPHICAL_BELIEFS: "Philosophical Beliefs",
      TRAVEL_EXPERIENCES: "Travel Experiences"
    }
  },
  RELATIONSHIPS_SOCIAL: {
    label: "Relationships and Social Connections",
    subtopics: {
      ROMANTIC_RELATIONSHIPS: "Romantic Relationships",
      FRIENDSHIPS_SOCIAL: "Friendships and Social Connections", 
      FAMILY_RELATIONSHIPS: "Family Relationships",
      PARTNERSHIP_MARRIAGE: "Partnership and Marriage"
    }
  },
  CAREER_LIFE_PURPOSE: {
    label: "Career and Life Purpose",
    subtopics: {
      CAREER_PROFESSIONAL: "Career and Professional Life",
      LIFE_PURPOSE_CALLING: "Life Purpose and Calling",
      FINANCIAL_SECURITY: "Financial Security", 
      PUBLIC_REPUTATION: "Public Image and Reputation"
    }
  },
  PERSONAL_TRANSFORMATION: {
    label: "Personal Transformation and Growth",
    subtopics: {
      EMOTIONAL_TRANSFORMATION: "Emotional Transformation",
      SPIRITUAL_GROWTH: "Spiritual Growth and Development",
      PSYCHOLOGICAL_PATTERNS: "Psychological Patterns",
      LIFE_TRANSITIONS: "Life Transitions and Changes"
    }
  },
  CREATIVITY_VALUES: {
    label: "Creativity, Values, and Self-Expression", 
    subtopics: {
      CREATIVE_EXPRESSION: "Creative Expression",
      PERSONAL_VALUES: "Personal Values and Ethics",
      RECREATIONAL_INTERESTS: "Recreational Interests", 
      ROMANTIC_CREATIVITY: "Romantic and Creative Expression"
    }
  }
};
```

### Relationship Categories:
```javascript
export const RelationshipCategoriesEnum = {
  OVERALL_ATTRACTION_CHEMISTRY: {
    label: "Overall Attraction & Chemistry",
    order: 1,
    description: "Physical and energetic attraction between partners"
  },
  EMOTIONAL_SECURITY_CONNECTION: {
    label: "Emotional Security & Connection", 
    order: 2,
    description: "Emotional safety and deep bonding capacity"
  },
  COMMUNICATION_LEARNING: {
    label: "Communication & Learning",
    order: 3, 
    description: "How well partners communicate and learn together"
  },
  VALUES_GOALS_DIRECTION: {
    label: "Values, Goals & Life Direction",
    order: 4,
    description: "Alignment in life purpose and shared values"
  },
  INTIMACY_SEXUALITY: {
    label: "Intimacy & Sexuality",
    order: 5,
    description: "Sexual chemistry and intimate connection"
  },
  LONG_TERM_STABILITY: {
    label: "Long-term Stability & Commitment", 
    order: 6,
    description: "Potential for lasting partnership"
  },
  SPIRITUAL_GROWTH: {
    label: "Spiritual Growth & Transformation",
    order: 7,
    description: "Mutual spiritual development and awakening"
  }
};
```

## Key Components & Implementation

### 1. Birth Chart Visualization (Mobile-Optimized):
```javascript
import Svg, { Circle, Line, Text, G } from 'react-native-svg';

const BirthChartWheel = ({ planets, houses, aspects, size = 300 }) => {
  const center = size / 2;
  const radius = size * 0.4;
  
  // Convert astrological degrees to screen coordinates
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  return (
    <Svg width={size} height={size}>
      {/* Zodiac wheel */}
      <Circle cx={center} cy={center} r={radius} stroke="#333" strokeWidth={2} fill="transparent" />
      
      {/* House divisions */}
      {houses.map((house, index) => {
        const start = polarToCartesian(center, center, radius, house.startDegree);
        const end = polarToCartesian(center, center, radius * 0.8, house.startDegree);
        return (
          <Line key={index} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#666" />
        );
      })}
      
      {/* Planet positions */}
      {planets.map((planet, index) => {
        const pos = polarToCartesian(center, center, radius * 0.9, planet.degree);
        return (
          <G key={index}>
            <Circle cx={pos.x} cy={pos.y} r={8} fill={planet.color} />
            <Text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={12} fill="white">
              {planet.symbol}
            </Text>
          </G>
        );
      })}
      
      {/* Aspects */}
      {aspects.map((aspect, index) => {
        const planet1Pos = polarToCartesian(center, center, radius * 0.7, aspect.planet1Degree);
        const planet2Pos = polarToCartesian(center, center, radius * 0.7, aspect.planet2Degree);
        return (
          <Line 
            key={index}
            x1={planet1Pos.x} y1={planet1Pos.y}
            x2={planet2Pos.x} y2={planet2Pos.y}
            stroke={aspect.color}
            strokeWidth={aspect.type === 'major' ? 2 : 1}
            strokeDasharray={aspect.type === 'minor' ? '5,5' : '0'}
          />
        );
      })}
    </Svg>
  );
};
```

### 2. Analysis Workflow Management:
```javascript
import { useStore } from '../store';

const useAnalysisWorkflow = () => {
  const { 
    creationWorkflowState, 
    setWorkflowState,
    analysisWorkflowState,
    setAnalysisState 
  } = useStore();
  
  const startFullAnalysis = async (userId) => {
    try {
      const response = await fetch('/analysis/start-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const { workflowId } = await response.json();
      setWorkflowState({ workflowId, status: 'started', isCompleted: false });
      
      // Start polling for completion
      return pollAnalysisStatus(workflowId);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };
  
  const pollAnalysisStatus = async (workflowId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/analysis/full-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId })
        });
        
        const statusData = await response.json();
        
        if (statusData.isCompleted) {
          clearInterval(pollInterval);
          setWorkflowState({ ...statusData, isCompleted: true });
          
          // Fetch completed analysis data
          await fetchAnalysisData(workflowId);
        } else {
          setWorkflowState({ ...statusData });
        }
      } catch (error) {
        clearInterval(pollInterval);
        console.error('Status polling failed:', error);
      }
    }, 3000);
    
    return pollInterval;
  };
  
  const fetchAnalysisData = async (workflowId) => {
    try {
      const response = await fetch('/analysis/complete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId })
      });
      
      const analysisData = await response.json();
      setAnalysisState({ 
        hasFullAnalysis: true,
        analysisContent: analysisData
      });
    } catch (error) {
      console.error('Failed to fetch analysis data:', error);
    }
  };
  
  return {
    startFullAnalysis,
    pollAnalysisStatus,
    fetchAnalysisData,
    workflowState: creationWorkflowState,
    analysisState: analysisWorkflowState
  };
};
```

### 3. Tab Navigation Component:
```javascript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Horoscope':
              iconName = 'wb-sunny';
              break;
            case 'Chart':
              iconName = 'donut-large';
              break;
            case 'Relationships':
              iconName = 'favorite';
              break;
            case 'Celebrity':
              iconName = 'star';
              break;
          }
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      <Tab.Screen name="Horoscope" component={HoroscopeStack} />
      <Tab.Screen name="Chart" component={ChartStack} />
      <Tab.Screen name="Relationships" component={RelationshipsStack} />
      <Tab.Screen name="Celebrity" component={CelebrityStack} />
    </Tab.Navigator>
  );
};
```

### 4. Custom Transit Horoscope Component:
```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useStore } from '../store';

const CustomTransitHoroscope = ({ userId }) => {
  const {
    transitData,
    selectedTransits,
    customHoroscope,
    horoscopeFilter,
    setTransitData,
    toggleTransitSelection,
    setCustomHoroscope,
    setHoroscopeFilter
  } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  
  // Filter options for different time periods
  const filterOptions = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'nextWeek', label: 'Next Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' }
  ];
  
  // Load transit data on component mount
  useEffect(() => {
    loadTransitData();
  }, [userId]);
  
  const loadTransitData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/getTransitWindows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const transits = await response.json();
      setTransitData(transits);
    } catch (error) {
      console.error('Failed to load transit data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter transits based on selected time period
  const filteredTransits = useMemo(() => {
    if (!transitData.length) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return transitData.filter(transit => {
      const startDate = new Date(transit.startDate);
      const endDate = new Date(transit.endDate);
      
      switch (horoscopeFilter) {
        case 'today':
          return startDate <= today && endDate >= today;
        case 'tomorrow':
          return startDate <= tomorrow && endDate >= tomorrow;
        case 'thisWeek':
          const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
          return (startDate <= weekEnd && endDate >= weekStart);
        case 'nextWeek':
          const nextWeekStart = new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000);
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
          return (startDate <= nextWeekEnd && endDate >= nextWeekStart);
        case 'thisMonth':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return (startDate <= monthEnd && endDate >= monthStart);
        case 'nextMonth':
          const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          return (startDate <= nextMonthEnd && endDate >= nextMonthStart);
        default:
          return true;
      }
    });
  }, [transitData, horoscopeFilter]);
  
  // Generate custom horoscope from selected transits
  const generateCustomHoroscope = async () => {
    if (selectedTransits.size === 0) {
      Alert.alert('No Transits Selected', 'Please select at least one transit to generate a custom horoscope.');
      return;
    }
    
    setGeneratingCustom(true);
    try {
      const selectedTransitObjects = filteredTransits.filter(transit => 
        selectedTransits.has(transit.id)
      );
      
      const response = await fetch('/generateCustomHoroscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transitEvents: selectedTransitObjects
        })
      });
      
      const customHoroscopeData = await response.json();
      setCustomHoroscope(customHoroscopeData);
    } catch (error) {
      console.error('Failed to generate custom horoscope:', error);
      Alert.alert('Error', 'Failed to generate custom horoscope. Please try again.');
    } finally {
      setGeneratingCustom(false);
    }
  };
  
  const renderTransitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.transitItem,
        selectedTransits.has(item.id) && styles.selectedTransit
      ]}
      onPress={() => toggleTransitSelection(item.id)}
    >
      <View style={styles.transitHeader}>
        <Text style={styles.transitTitle}>{item.description}</Text>
        <View style={[
          styles.checkbox,
          selectedTransits.has(item.id) && styles.checkedBox
        ]}>
          {selectedTransits.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <Text style={styles.transitDate}>
        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
      </Text>
      <Text style={styles.transitExact}>Exact: {new Date(item.exactDate).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );
  
  const renderFilterTab = (filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterTab,
        horoscopeFilter === filter.key && styles.activeFilterTab
      ]}
      onPress={() => setHoroscopeFilter(filter.key)}
    >
      <Text style={[
        styles.filterTabText,
        horoscopeFilter === filter.key && styles.activeFilterTabText
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <ScrollView style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filterOptions.map(renderFilterTab)}
      </ScrollView>
      
      {/* Transit Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Transits for Custom Horoscope</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the planetary transits you'd like included in your personalized horoscope
        </Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading transits...</Text>
        ) : (
          <FlatList
            data={filteredTransits}
            renderItem={renderTransitItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
        
        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (selectedTransits.size === 0 || generatingCustom) && styles.disabledButton
          ]}
          onPress={generateCustomHoroscope}
          disabled={selectedTransits.size === 0 || generatingCustom}
        >
          <Text style={styles.generateButtonText}>
            {generatingCustom ? 'Generating...' : `Generate Custom Horoscope (${selectedTransits.size} selected)`}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Custom Horoscope Display */}
      {customHoroscope && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Custom Horoscope</Text>
          <View style={styles.horoscopeCard}>
            <Text style={styles.horoscopeText}>{customHoroscope.content}</Text>
            <Text style={styles.horoscopeDate}>
              Generated on {new Date(customHoroscope.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#8b5cf6',
  },
  filterTabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: 'white',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  transitItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedTransit: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3f0ff',
  },
  transitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transitTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  transitDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transitExact: {
    fontSize: 12,
    color: '#999',
  },
  generateButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  horoscopeCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  horoscopeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  horoscopeDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

export default CustomTransitHoroscope;
```

### 5. Chat Interface:
```javascript
import { GiftedChat } from 'react-native-gifted-chat';

const ChatAnalysisScreen = ({ userId, contextType = 'birth_chart' }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const onSend = async (newMessages = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    setLoading(true);
    
    const userMessage = newMessages[0].text;
    
    try {
      const endpoint = contextType === 'birth_chart' 
        ? '/userChatBirthChartAnalysis'
        : '/userChatRelationshipAnalysis';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage,
          ...(contextType === 'relationship' && { relationshipId: relationshipId })
        })
      });
      
      const responseData = await response.json();
      
      const aiMessage = {
        _id: Math.random().toString(),
        text: responseData.response,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Stellium AI',
          avatar: require('../assets/stellium-ai-avatar.png')
        }
      };
      
      setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{
        _id: 1,
      }}
      isTyping={loading}
      placeholder="Ask me about your chart..."
    />
  );
};
```

## Mobile-Specific Considerations

### Performance Optimizations:
```javascript
// 1. Lazy loading for large datasets
const CelebrityList = () => {
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  const loadMoreCelebrities = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/getCelebs?page=${page}&limit=20`);
      const newCelebrities = await response.json();
      
      setCelebrities(prev => [...prev, ...newCelebrities]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load celebrities:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading]);
  
  return (
    <FlatList
      data={celebrities}
      onEndReached={loadMoreCelebrities}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => <CelebrityCard celebrity={item} />}
    />
  );
};

// 2. Image optimization
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ source, ...props }) => (
  <FastImage
    source={{
      uri: source,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable
    }}
    {...props}
  />
);

// 3. Memoization for expensive calculations
const MemoizedBirthChart = React.memo(BirthChartWheel, (prevProps, nextProps) => {
  return (
    prevProps.planets === nextProps.planets &&
    prevProps.houses === nextProps.houses &&
    prevProps.aspects === nextProps.aspects
  );
});
```

### Native Features Integration:
```javascript
// Push notifications for horoscope updates
import PushNotification from 'react-native-push-notification';

const setupHoroscopeNotifications = () => {
  PushNotification.configure({
    onNotification: (notification) => {
      if (notification.data?.type === 'horoscope') {
        // Navigate to horoscope tab
      }
    },
  });
  
  // Schedule daily horoscope notifications
  PushNotification.localNotificationSchedule({
    title: 'Your Daily Horoscope is Ready',
    message: 'Check out what the stars have in store for you today!',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    repeatType: 'day',
  });
};

// Location services for birth place selection
import Geolocation from '@react-native-community/geolocation';

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

// Biometric authentication
import TouchID from 'react-native-touch-id';

const authenticateWithBiometrics = async () => {
  try {
    const biometryType = await TouchID.isSupported();
    if (biometryType) {
      const authenticated = await TouchID.authenticate('Use your fingerprint to access your charts');
      return authenticated;
    }
  } catch (error) {
    console.error('Biometric authentication failed:', error);
  }
  return false;
};
```

### Offline Support:
```javascript
import NetInfo from '@react-native-netinfo/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOfflineSupport = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      if (state.isConnected && offlineQueue.length > 0) {
        // Process offline queue
        processOfflineQueue();
      }
    });
    
    return unsubscribe;
  }, []);
  
  const cacheUserData = async (userData) => {
    await AsyncStorage.setItem('cached_user_data', JSON.stringify(userData));
  };
  
  const getCachedUserData = async () => {
    const cached = await AsyncStorage.getItem('cached_user_data');
    return cached ? JSON.parse(cached) : null;
  };
  
  const queueOfflineAction = async (action) => {
    const newQueue = [...offlineQueue, action];
    setOfflineQueue(newQueue);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(newQueue));
  };
  
  const processOfflineQueue = async () => {
    for (const action of offlineQueue) {
      try {
        await fetch(action.endpoint, action.options);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
    
    setOfflineQueue([]);
    await AsyncStorage.removeItem('offline_queue');
  };
  
  return { isConnected, cacheUserData, getCachedUserData, queueOfflineAction };
};
```

## Development Roadmap & Implementation Priorities

### Phase 1: Core Foundation (Weeks 1-2)
**Priority: Critical**
- [ ] Project setup and navigation structure
- [ ] Authentication flow (excluding login/signup forms)
- [ ] Basic state management with Zustand
- [ ] API integration setup
- [ ] User context management

### Phase 2: Essential Features (Weeks 3-4)
**Priority: High**
- [ ] Basic birth chart display
- [ ] User dashboard/chart tab
- [ ] Analysis workflow implementation  
- [ ] Horoscope tab with daily/weekly/monthly views
- [ ] **Custom transit selection and horoscope generation**
- [ ] Transit filtering by time periods (today through next month)
- [ ] Simple celebrity browsing

### Phase 3: Advanced Chart Features (Weeks 5-6)
**Priority: High**
- [ ] Interactive birth chart visualization
- [ ] Guest chart creation and management
- [ ] Multi-stage analysis display
- [ ] Topic-based analysis navigation
- [ ] Chart sharing capabilities

### Phase 4: Relationship Features (Weeks 7-8)
**Priority: Medium**
- [ ] Relationship creation flow
- [ ] Synastry chart visualization
- [ ] Compatibility scoring display
- [ ] Relationship analysis workflow
- [ ] Celebrity relationship comparisons

### Phase 5: Chat & AI Integration (Weeks 9-10)
**Priority: Medium**
- [ ] Chat interface implementation
- [ ] Context-aware AI responses
- [ ] Chat history persistence
- [ ] Analysis-specific chat modes
- [ ] Voice input integration (optional)

### Phase 6: Premium Features (Weeks 11-12)
**Priority: Low**
- [ ] Payment gate integration
- [ ] Premium feature unlocking
- [ ] Advanced chart analysis features
- [ ] Enhanced celebrity content
- [ ] Social sharing features

### Phase 7: Polish & Optimization (Weeks 13-14)
**Priority: Medium**
- [ ] Performance optimization
- [ ] Native feature integration
- [ ] Push notification setup
- [ ] Offline support implementation
- [ ] Analytics integration

### Phase 8: Testing & Deployment (Weeks 15-16)
**Priority: Critical**
- [ ] Comprehensive testing
- [ ] Beta testing with real users
- [ ] App store preparation
- [ ] Documentation completion
- [ ] Production deployment

## Payment Gate Integration Points

### Feature Gating Strategy:
```javascript
const FeatureGate = ({ feature, children, fallback = null }) => {
  const { userSubscription } = useStore();
  
  const hasAccess = useMemo(() => {
    switch (feature) {
      case 'advanced_analysis':
        return userSubscription?.plan === 'premium' || userSubscription?.plan === 'pro';
      case 'unlimited_relationships':
        return userSubscription?.plan === 'pro';
      case 'celebrity_relationships':
        return userSubscription?.plan !== 'free';
      case 'chat_unlimited':
        return userSubscription?.plan === 'premium' || userSubscription?.plan === 'pro';
      default:
        return true;
    }
  }, [userSubscription, feature]);
  
  if (hasAccess) {
    return children;
  }
  
  return fallback || <PremiumUpsellCard feature={feature} />;
};

// Usage example:
<FeatureGate feature="advanced_analysis">
  <AdvancedAnalysisComponent />
</FeatureGate>
```

### Premium Features:
- **Advanced Analysis**: Full topic breakdowns, detailed insights
- **Unlimited Relationships**: More than 3 relationship analyses
- **Celebrity Relationships**: Premium celebrity chart access
- **Unlimited Chat**: No message limits with AI
- **Premium Horoscopes**: Extended forecasts and transit details
- **Chart Sharing**: Social sharing and export features

## Security Considerations

### Data Protection:
```javascript
// Secure storage for sensitive data
import { Keychain } from 'react-native-keychain';

const secureStorage = {
  setItem: async (key, value) => {
    await Keychain.setInternetCredentials(key, 'user', value);
  },
  
  getItem: async (key) => {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials ? credentials.password : null;
    } catch (error) {
      return null;
    }
  },
  
  removeItem: async (key) => {
    await Keychain.resetInternetCredentials(key);
  }
};

// API request authentication
const authenticatedFetch = async (url, options = {}) => {
  const token = await secureStorage.getItem('auth_token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};
```

### Input Validation:
```javascript
// Birth data validation
const validateBirthData = (birthData) => {
  const errors = {};
  
  if (!birthData.name || birthData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!birthData.birthYear || birthData.birthYear < 1900 || birthData.birthYear > new Date().getFullYear()) {
    errors.birthYear = 'Please enter a valid birth year';
  }
  
  if (!birthData.birthLocation || birthData.birthLocation.trim().length < 3) {
    errors.birthLocation = 'Please enter a valid birth location';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## Conclusion

This comprehensive starter brief provides all the technical specifications, architectural patterns, and implementation guidance needed to create a React Native mobile app that replicates and enhances the core functionality of the Stellium web application. The mobile app will offer a streamlined, touch-optimized experience while maintaining the sophisticated astrological analysis capabilities of the original platform.

The phased development approach ensures a solid foundation while allowing for iterative improvements and feature additions. Payment gating provides a clear monetization strategy, while native mobile features enhance the user experience beyond what's possible in a web browser.

Key success factors:
- Maintain data parity with the web application
- Optimize for mobile performance and user experience
- Implement robust offline support
- Provide clear upgrade paths for premium features
- Ensure secure handling of user data

This brief should provide the mobile development team with everything needed to begin implementation while maintaining consistency with the existing Stellium platform architecture and business logic.