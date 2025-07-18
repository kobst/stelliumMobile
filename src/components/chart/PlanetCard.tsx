import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlanetCardProps {
  planet: string;
  interpretation?: string;
  description?: string;
}

const PlanetCard: React.FC<PlanetCardProps> = ({ 
  planet, 
  interpretation, 
  description 
}) => {
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

      {/* Description Section (if available) */}
      {description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Position</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}

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