import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  getPlanetGlyph, 
  getZodiacGlyph, 
  getAspectColor,
  PLANET_COLORS
} from './ChartUtils';

interface PlanetCardProps {
  planet: string;
  interpretation?: string;
  description?: string;
  astrologicalData?: string;
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
  astrologicalData
}) => {
  // Parse the astrological data JSON
  const parseAstrologicalData = (): AstrologicalDataParsed | null => {
    if (!astrologicalData) return null;
    
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

  return (
    <View style={styles.card}>
      {/* Planet Header */}
      <View style={styles.header}>
        <View style={[styles.symbolContainer, { backgroundColor: getPlanetColor(planet) + '20' }]}>
          <Text style={[styles.symbol, { color: getPlanetColor(planet) }]}>
            {getPlanetSymbol(planet)}
          </Text>
        </View>
        <Text style={[styles.planetName, { color: getPlanetColor(planet) }]}>
          {planet}
        </Text>
      </View>

      {/* Astrological Data Section (if available) */}
      {parsedData ? (
        <View style={styles.astroDataSection}>
          {/* Position */}
          {parsedData.positions.length > 0 && (
            <View style={styles.positionSubsection}>
              <Text style={styles.astroDataLabel}>Position</Text>
              {parsedData.positions.map((position, index) => (
                <View key={index} style={styles.positionRow}>
                  <View style={styles.planetSymbolContainer}>
                    <Text style={[styles.planetSymbolSmall, { color: getPlanetColor(position.planet) }]}>
                      {getPlanetSymbol(position.planet)}
                    </Text>
                  </View>
                  <Text style={styles.positionText}>
                    {position.planet} in {position.sign} 
                  </Text>
                  <View style={styles.signSymbolContainer}>
                    <Text style={styles.signSymbol}>
                      {getZodiacGlyph(position.sign as any)}
                    </Text>
                  </View>
                  <Text style={styles.houseText}>
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
              <Text style={styles.astroDataLabel}>Aspects</Text>
              {parsedData.aspects.slice(0, 5).map((aspect, index) => ( // Limit to 5 aspects
                <View key={index} style={styles.aspectRow}>
                  <View style={styles.aspectPlanets}>
                    <Text style={[styles.planetSymbolSmall, { color: getPlanetColor(aspect.planet1) }]}>
                      {getPlanetSymbol(aspect.planet1)}
                    </Text>
                    <Text style={[styles.aspectSymbol, { color: getAspectColor(aspect.aspectType as any) }]}>
                      {getAspectSymbol(aspect.aspectType)}
                    </Text>
                    <Text style={[styles.planetSymbolSmall, { color: getPlanetColor(aspect.planet2) }]}>
                      {getPlanetSymbol(aspect.planet2)}
                    </Text>
                  </View>
                  <Text style={styles.aspectDescription}>
                    {aspect.orbDescription} {aspect.aspectType} to {aspect.planet2}
                  </Text>
                  <Text style={styles.aspectOrb}>
                    {aspect.orb.toFixed(1)}°
                  </Text>
                </View>
              ))}
              {parsedData.aspects.length > 5 && (
                <Text style={styles.moreAspects}>
                  +{parsedData.aspects.length - 5} more aspects
                </Text>
              )}
            </View>
          )}

          {/* House Rulers */}
          {parsedData.houseRulers.length > 0 && (
            <View style={styles.rulersSubsection}>
              <Text style={styles.astroDataLabel}>Rules</Text>
              {parsedData.houseRulers.map((ruler, index) => (
                <View key={index} style={styles.rulerRow}>
                  <Text style={styles.rulerText}>
                    {ruler.sign} (House {ruler.house})
                  </Text>
                  <Text style={styles.signSymbol}>
                    {getZodiacGlyph(ruler.sign as any)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : description ? (
        // Fallback to description if no parsed data
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Position</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      ) : null}

      {/* Interpretation Section */}
      {interpretation ? (
        <View style={styles.interpretationSection}>
          <Text style={styles.interpretationLabel}>Analysis</Text>
          <Text style={styles.interpretationText}>{interpretation}</Text>
        </View>
      ) : (
        <View style={styles.noDataSection}>
          <Text style={styles.noDataText}>
            Analysis for {planet} will be available once the full chart analysis is complete.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60a5fa',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    opacity: 0.9,
  },
  astroDataSection: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  astroDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60a5fa',
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
    color: '#e2e8f0',
    flex: 1,
  },
  signSymbolContainer: {
    width: 20,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  signSymbol: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  houseText: {
    fontSize: 12,
    color: '#94a3b8',
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
    color: '#e2e8f0',
    flex: 1,
    marginLeft: 8,
  },
  aspectOrb: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 8,
    width: 35,
    textAlign: 'right',
  },
  moreAspects: {
    fontSize: 11,
    color: '#8b5cf6',
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
    color: '#e2e8f0',
    flex: 1,
  },
  interpretationSection: {
    padding: 16,
  },
  interpretationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  interpretationText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
  },
  noDataSection: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default PlanetCard;