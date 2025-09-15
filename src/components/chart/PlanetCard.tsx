import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getPlanetGlyph,
  getZodiacGlyph,
  getAspectColor,
  PLANET_COLORS,
} from './ChartUtils';
import { useTheme } from '../../theme';
import { AstroIcon, getPlanetIconFromConstant, getZodiacIconFromConstant } from '../../../utils/astrologyIcons';

interface PlanetCardProps {
  planet: string;
  interpretation?: string;
  description?: string;
  astrologicalData?: string;
  hideHeader?: boolean;
  tags?: string[];
}

interface AstrologicalDataParsed {
  positions: Array<{
    planet: string;
    sign: string;
    house: number;
    isRetrograde: boolean;
    code: string;
  }>;
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspectType: string;
    orb: number;
    orbDescription: string;
    planet1Sign: string;
    planet1House: number;
    planet2Sign: string;
    planet2House: number;
    code: string;
  }>;
  houseRulers: Array<{
    sign: string;
    house: number;
    code: string;
  }>;
}

const PlanetCard: React.FC<PlanetCardProps> = ({
  planet,
  interpretation,
  description,
  astrologicalData,
  hideHeader = false,
  tags = [],
}) => {
  const { colors } = useTheme();
  // Parse the astrological data JSON
  const parseAstrologicalData = (): AstrologicalDataParsed | null => {
    if (!astrologicalData) {return null;}

    try {
      return JSON.parse(astrologicalData);
    } catch (error) {
      console.error('Failed to parse astrological data:', error);
      return null;
    }
  };

  const parsedData = parseAstrologicalData();

  // Get aspect symbol
  const getAspectSymbol = (aspectType: string): string => {
    const aspectSymbols: { [key: string]: string } = {
      conjunction: '☌',
      opposition: '☍',
      trine: '△',
      square: '□',
      sextile: '⚹',
      quincunx: '⚻',
      semisextile: '⚺',
      semisquare: '∠',
      sesquiquadrate: '⚼',
    };
    return aspectSymbols[aspectType] || '◦';
  };
  const getPlanetSymbol = (planetName: string): string => {
    const symbols: { [key: string]: string } = {
      'Sun': '☉',
      'Moon': '☽',
      'Mercury': '☿',
      'Venus': '♀',
      'Mars': '♂',
      'Jupiter': '♃',
      'Saturn': '♄',
      'Uranus': '♅',
      'Neptune': '♆',
      'Pluto': '♇',
      'Ascendant': '↑',
      'Midheaven': '⟂',
      'Node': '☊',
      'Chiron': '⚷',
    };

    return symbols[planetName] || '●';
  };

  const getPlanetColor = (planetName: string): string => {
    const colors: { [key: string]: string } = {
      'Sun': '#FFD700',      // Gold
      'Moon': '#A9A9A9',     // Silver
      'Mercury': '#FFA500',  // Orange
      'Venus': '#ADFF2F',    // Green-yellow
      'Mars': '#FF4500',     // Red-orange
      'Jupiter': '#FF8C00',  // Dark orange
      'Saturn': '#DAA520',   // Goldenrod
      'Uranus': '#40E0D0',   // Turquoise
      'Neptune': '#1E90FF',  // Blue
      'Pluto': '#8A2BE2',    // Purple
      'Ascendant': '#FFFFFF', // White
      'Midheaven': '#FFFFFF', // White
      'Chiron': '#9932CC',   // Dark orchid
      'Node': '#708090',     // Slate gray
    };

    return colors[planetName] || '#8b5cf6';
  };

  // Format tag for display
  const formatTag = (tag: string): string => {
    if (tag === 'chart_ruler') {
      return 'Chart Ruler';
    }
    
    if (tag.startsWith('rulership_modern:')) {
      const sign = tag.replace('rulership_modern:', '');
      return `Rules ${sign} (Modern)`;
    }
    
    if (tag.startsWith('rulership_traditional:')) {
      const sign = tag.replace('rulership_traditional:', '');
      return `Rules ${sign} (Traditional)`;
    }
    
    if (tag.startsWith('exaltation:')) {
      const sign = tag.replace('exaltation:', '');
      return `Exaltation in ${sign}`;
    }
    
    if (tag.startsWith('detriment:')) {
      const sign = tag.replace('detriment:', '');
      return `Detriment in ${sign}`;
    }
    
    if (tag.startsWith('fall:')) {
      const sign = tag.replace('fall:', '');
      return `Fall in ${sign}`;
    }
    
    if (tag.startsWith('mutual_reception:')) {
      // Parse mutual_reception:with=Mars;mode=sign;system=traditional;other_sign=Leo
      const parts = tag.replace('mutual_reception:', '').split(';');
      const withPlanet = parts.find(p => p.startsWith('with='))?.replace('with=', '') || 'Unknown';
      const system = parts.find(p => p.startsWith('system='))?.replace('system=', '') || '';
      const otherSign = parts.find(p => p.startsWith('other_sign='))?.replace('other_sign=', '') || '';
      
      let result = `Mutual Reception with ${withPlanet}`;
      if (otherSign) result += ` in ${otherSign}`;
      if (system) result += ` (${system})`;
      return result;
    }
    
    // Fallback: capitalize and replace underscores with spaces
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get tag color based on type
  const getTagColor = (tag: string): string => {
    if (tag === 'chart_ruler') return '#FFD700'; // Gold
    if (tag.startsWith('rulership')) return '#4CAF50'; // Green
    if (tag.startsWith('exaltation')) return '#2196F3'; // Blue
    if (tag.startsWith('detriment')) return '#FF9800'; // Orange
    if (tag.startsWith('fall')) return '#F44336'; // Red
    if (tag.startsWith('mutual_reception')) return '#9C27B0'; // Purple
    return colors.primary; // Default
  };

  return (
    <View style={[hideHeader ? styles.cardNoBorder : styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {!hideHeader && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.symbolContainer, { backgroundColor: getPlanetColor(planet) + '20' }]}>
            <AstroIcon
              type="planet"
              name={planet}
              size={20}
              color={getPlanetColor(planet)}
            />
          </View>
          <Text style={[styles.planetName, { color: getPlanetColor(planet) }]}>
            {planet}
          </Text>
        </View>
      )}

      {/* Astrological Data Section (if available) */}
      {parsedData ? (
        <View style={[styles.astroDataSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
          {/* Position */}
          {parsedData.positions.length > 0 && (
            <View style={styles.positionSubsection}>
              <Text style={[styles.astroDataLabel, { color: colors.primary }]}>Position</Text>
              {parsedData.positions.map((position, index) => (
                <View key={index} style={styles.positionRow}>
                  <View style={styles.planetSymbolContainer}>
                    <AstroIcon
                      type="planet"
                      name={position.planet}
                      size={14}
                      color={getPlanetColor(position.planet)}
                    />
                  </View>
                  <Text style={[styles.positionText, { color: colors.onSurface }]}>
                    {position.planet} in {position.sign}
                  </Text>
                  <View style={styles.signSymbolContainer}>
                    <AstroIcon
                      type="zodiac"
                      name={position.sign}
                      size={14}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.houseText, { color: colors.onSurfaceVariant }]}>
                    House {position.house}
                  </Text>
                  {position.isRetrograde && (
                    <Text style={styles.retrograde}>R</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Aspects */}
          {parsedData.aspects.length > 0 && (
            <View style={styles.aspectsSubsection}>
              <Text style={[styles.astroDataLabel, { color: colors.primary }]}>Aspects</Text>
              {parsedData.aspects.slice(0, 5).map((aspect, index) => ( // Limit to 5 aspects
                <View key={index} style={styles.aspectRow}>
                  <View style={styles.aspectPlanets}>
                    <AstroIcon
                      type="planet"
                      name={aspect.planet1}
                      size={12}
                      color={getPlanetColor(aspect.planet1)}
                    />
                    <Text style={[styles.aspectSymbol, { color: getAspectColor(aspect.aspectType as any) }]}>
                      {getAspectSymbol(aspect.aspectType)}
                    </Text>
                    <AstroIcon
                      type="planet"
                      name={aspect.planet1 === planet ? aspect.planet2 : aspect.planet1}
                      size={12}
                      color={getPlanetColor(aspect.planet1 === planet ? aspect.planet2 : aspect.planet1)}
                    />
                  </View>
                  <Text style={[styles.aspectDescription, { color: colors.onSurface }]}>
                    {aspect.orbDescription} {aspect.aspectType} to {aspect.planet1 === planet ? aspect.planet2 : aspect.planet1}
                  </Text>
                  <Text style={[styles.aspectOrb, { color: colors.onSurfaceVariant }]}>
                    {aspect.orb.toFixed(1)}°
                  </Text>
                </View>
              ))}
              {parsedData.aspects.length > 5 && (
                <Text style={[styles.moreAspects, { color: colors.primary }]}>
                  +{parsedData.aspects.length - 5} more aspects
                </Text>
              )}
            </View>
          )}

          {/* House Rulers */}
          {parsedData.houseRulers.length > 0 && (
            <View style={styles.rulersSubsection}>
              <Text style={[styles.astroDataLabel, { color: colors.primary }]}>Rules</Text>
              {parsedData.houseRulers.map((ruler, index) => (
                <View key={index} style={styles.rulerRow}>
                  <Text style={[styles.rulerText, { color: colors.onSurface }]}>
                    {ruler.sign} (House {ruler.house})
                  </Text>
                  <AstroIcon
                    type="zodiac"
                    name={ruler.sign}
                    size={14}
                    color={colors.primary}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Additional Notes */}
          {tags.length > 0 && (
            <View style={styles.notesSubsection}>
              <Text style={[styles.astroDataLabel, { color: colors.primary }]}>Additional Notes</Text>
              <View style={styles.notesContainer}>
                {tags.map((tag, index) => (
                  <Text key={index} style={[styles.noteText, { color: colors.onSurface }]}>
                    • {formatTag(tag)}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : description ? (
        // Fallback to description if no parsed data
        <View style={[styles.descriptionSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
          <Text style={[styles.descriptionLabel, { color: colors.primary }]}>Position</Text>
          <Text style={[styles.descriptionText, { color: colors.onSurface }]}>{description}</Text>
        </View>
      ) : null}

      {/* Interpretation Section */}
      {interpretation ? (
        <View style={styles.interpretationSection}>
          <Text style={[styles.interpretationLabel, { color: colors.primary }]}>Analysis</Text>
          <Text style={[styles.interpretationText, { color: colors.onSurface }]}>{interpretation}</Text>
        </View>
      ) : (
        <View style={styles.noDataSection}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
            Analysis for {planet} will be available once the full chart analysis is complete.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardNoBorder: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  descriptionSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  astroDataSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  astroDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  positionSubsection: {
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planetSymbolContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  planetSymbolSmall: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positionText: {
    fontSize: 13,
    flex: 1,
  },
  signSymbolContainer: {
    width: 20,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  signSymbol: {
    fontSize: 14,
  },
  houseText: {
    fontSize: 12,
    marginLeft: 8,
  },
  retrograde: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aspectsSubsection: {
    marginBottom: 12,
  },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
  },
  aspectPlanets: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'space-between',
  },
  aspectSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  aspectDescription: {
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  aspectOrb: {
    fontSize: 10,
    marginLeft: 8,
    width: 35,
    textAlign: 'right',
  },
  moreAspects: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  rulersSubsection: {
    marginBottom: 8,
  },
  rulerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rulerText: {
    fontSize: 12,
    flex: 1,
  },
  interpretationSection: {
    padding: 16,
  },
  interpretationLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  noDataSection: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  notesSubsection: {
    marginBottom: 12,
  },
  notesContainer: {
    marginTop: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
});

export default PlanetCard;
