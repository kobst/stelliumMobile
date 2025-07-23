import { TransitEvent, HoroscopeFilter } from '../types';

export interface RawTransitData {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  exactDate: string;
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  intensity?: number;
  category?: string;
}

export interface RawHoroscopeData {
  content: string;
  type: string;
  date: string;
  createdAt: string;
  metadata?: {
    transitsUsed?: string[];
    keywords?: string[];
    intensity?: number;
  };
}

export const horoscopeTransformers = {
  // Transform raw transit data to UI format
  transformTransits: (rawTransits: RawTransitData[]): TransitEvent[] => {
    return rawTransits.map(transit => ({
      id: transit.id,
      type: 'transit-to-natal' as const,
      description: transit.description,
      start: transit.startDate,
      end: transit.endDate,
      exact: transit.exactDate,
      transitingPlanet: transit.transitingPlanet,
      targetPlanet: transit.natalPlanet,
      aspect: transit.aspect,
    }));
  },

  // Format horoscope content for display
  formatHoroscopeContent: (rawContent: string): string => {
    // Remove excessive line breaks and format paragraphs
    return rawContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  },

  // Filter transits by time period
  filterTransitsByPeriod: (
    transits: TransitEvent[],
    period: HoroscopeFilter
  ): TransitEvent[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'today':
        startDate = today;
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        break;

      case 'tomorrow':
        startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
        break;

      case 'thisWeek':
        startDate = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;

      case 'nextWeek':
        startDate = new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;

      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case 'nextMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;

      default:
        return transits;
    }

    return transits.filter(transit => {
      const transitStart = new Date(transit.start);
      const transitEnd = new Date(transit.end);

      // Transit overlaps with period if it starts before period ends and ends after period starts
      return transitStart <= endDate && transitEnd >= startDate;
    });
  },

  // Get transit intensity level
  getTransitIntensity: (transit: TransitEvent): 'low' | 'medium' | 'high' => {
    const majorPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
    const outerPlanets = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const majorAspects = ['conjunction', 'opposition', 'square', 'trine'];

    let intensity = 0;

    // Planet weight
    if (majorPlanets.includes(transit.transitingPlanet)) {
      intensity += 2;
    } else if (outerPlanets.includes(transit.transitingPlanet)) {
      intensity += 3;
    } else {
      intensity += 1;
    }

    // Target planet weight
    if (['Sun', 'Moon', 'Ascendant'].includes(transit.targetPlanet || '')) {
      intensity += 3;
    } else if (majorPlanets.includes(transit.targetPlanet || '')) {
      intensity += 2;
    } else {
      intensity += 1;
    }

    // Aspect weight
    if (majorAspects.includes(transit.aspect)) {
      intensity += 2;
    } else {
      intensity += 1;
    }

    if (intensity >= 7) {return 'high';}
    if (intensity >= 4) {return 'medium';}
    return 'low';
  },

  // Sort transits by relevance
  sortTransitsByRelevance: (transits: TransitEvent[]): TransitEvent[] => {
    return [...transits].sort((a, b) => {
      const intensityA = horoscopeTransformers.getTransitIntensity(a);
      const intensityB = horoscopeTransformers.getTransitIntensity(b);

      const intensityWeight = { high: 3, medium: 2, low: 1 };

      const weightA = intensityWeight[intensityA];
      const weightB = intensityWeight[intensityB];

      if (weightA !== weightB) {
        return weightB - weightA; // Higher intensity first
      }

      // If same intensity, sort by exact date (sooner first)
      return new Date(a.exact).getTime() - new Date(b.exact).getTime();
    });
  },

  // Generate horoscope preview text
  generatePreview: (content: string, maxLength: number = 150): string => {
    const cleaned = horoscopeTransformers.formatHoroscopeContent(content);

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  },

  // Format date for display
  formatDate: (dateString: string, format: 'short' | 'long' = 'short'): string => {
    const date = new Date(dateString);

    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  // Get period display name
  getPeriodDisplayName: (period: HoroscopeFilter): string => {
    const names: Record<HoroscopeFilter, string> = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      nextWeek: 'Next Week',
      thisMonth: 'This Month',
      nextMonth: 'Next Month',
    };

    return names[period] || period;
  },
};
