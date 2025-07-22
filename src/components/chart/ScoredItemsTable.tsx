import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PLANET_SYMBOLS, ZODIAC_SYMBOLS } from './ChartUtils';
import { RelationshipScoredItem } from '../../api/relationships';
import { useTheme } from '../../theme';

interface ScoredItemsTableProps {
  scoredItems: RelationshipScoredItem[];
  userAName: string;
  userBName: string;
}

const ScoredItemsTable: React.FC<ScoredItemsTableProps> = ({ 
  scoredItems, 
  userAName, 
  userBName 
}) => {
  const { colors } = useTheme();
  // Sort by absolute value of score (highest impact first)
  const sortedItems = [...scoredItems].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

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
    return aspectSymbols[aspectType.toLowerCase()] || '◦';
  };

  const formatPlanetWithSymbol = (planet: string): string => {
    const symbol = PLANET_SYMBOLS[planet as keyof typeof PLANET_SYMBOLS];
    return symbol ? `${symbol} ${planet}` : planet;
  };

  const formatSignWithSymbol = (sign: string): string => {
    if (!sign) return '';
    const symbol = ZODIAC_SYMBOLS[sign as keyof typeof ZODIAC_SYMBOLS];
    return symbol ? `${symbol} ${sign}` : sign;
  };

  const getTypeDisplay = (item: RelationshipScoredItem): string => {
    if (item.type === 'aspect') {
      const aspectSymbol = getAspectSymbol(item.aspect || '');
      const aspectName = item.aspect || 'Aspect';
      return `${aspectSymbol} ${aspectName.charAt(0).toUpperCase() + aspectName.slice(1)}`;
    } else {
      return 'House Placement';
    }
  };

  const getDetailsDisplay = (item: RelationshipScoredItem, userAName: string, userBName: string): string => {
    if (item.type === 'aspect') {
      if (item.source === 'synastry') {
        // Extract planet names from pairKey (e.g., "venus_mars" -> Venus, Mars)
        const planets = item.pairKey?.split('_') || [];
        const planet1 = planets[0]?.charAt(0).toUpperCase() + planets[0]?.slice(1);
        const planet2 = planets[1]?.charAt(0).toUpperCase() + planets[1]?.slice(1);
        
        if (planet1 && planet2) {
          const planet1WithSymbol = formatPlanetWithSymbol(planet1);
          const planet2WithSymbol = formatPlanetWithSymbol(planet2);
          const aspectSymbol = getAspectSymbol(item.aspect || '');
          
          // Include signs if available
          const sign1 = item.planet1Sign ? ` ${formatSignWithSymbol(item.planet1Sign)}` : '';
          const sign2 = item.planet2Sign ? ` ${formatSignWithSymbol(item.planet2Sign)}` : '';
          
          return `${userAName}'s ${planet1WithSymbol}${sign1} ${aspectSymbol} ${userBName}'s ${planet2WithSymbol}${sign2}`;
        }
      } else if (item.source === 'composite') {
        // Extract planets from pairKey for composite aspects
        const planets = item.pairKey?.split('_') || [];
        const planet1 = planets[0]?.charAt(0).toUpperCase() + planets[0]?.slice(1);
        const planet2 = planets[1]?.charAt(0).toUpperCase() + planets[1]?.slice(1);
        
        if (planet1 && planet2) {
          const planet1WithSymbol = formatPlanetWithSymbol(planet1);
          const planet2WithSymbol = formatPlanetWithSymbol(planet2);
          const aspectSymbol = getAspectSymbol(item.aspect || '');
          
          return `${planet1WithSymbol} ${aspectSymbol} ${planet2WithSymbol}`;
        }
      }
      
      // Fallback to description if parsing fails
      return item.description;
    } else if (item.type === 'housePlacement') {
      if (item.source === 'synastryHousePlacement') {
        const planetWithSymbol = formatPlanetWithSymbol(item.planet || '');
        const direction = item.direction;
        
        if (direction === 'A->B') {
          return `${userAName}'s ${planetWithSymbol} in ${userBName}'s House ${item.house}`;
        } else if (direction === 'B->A') {
          return `${userBName}'s ${planetWithSymbol} in ${userAName}'s House ${item.house}`;
        }
      } else if (item.source === 'compositeHousePlacement') {
        const planetWithSymbol = formatPlanetWithSymbol(item.planet || '');
        // Extract sign from description if available
        const signMatch = item.description.match(/and (\w+)$/);
        const sign = signMatch ? signMatch[1] : '';
        const signWithSymbol = sign ? ` ${formatSignWithSymbol(sign)}` : '';
        
        return `${planetWithSymbol} in House ${item.house}${signWithSymbol}`;
      }
      
      // Fallback to description
      return item.description;
    }
    
    return item.description;
  };

  if (!scoredItems || scoredItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No significant factors available for this category.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.tableContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerType, { color: colors.primary }]}>Type</Text>
        <Text style={[styles.headerDetails, { color: colors.primary }]}>Details</Text>
      </View>
      {sortedItems.slice(0, 10).map((item, index) => ( // Show top 10 most significant
        <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
          <View style={styles.typeCell}>
            <Text style={[styles.typeText, { color: colors.onSurface }]}>{getTypeDisplay(item)}</Text>
          </View>
          <View style={styles.detailsCell}>
            <Text style={[styles.detailsText, { color: colors.onSurfaceVariant }]}>{getDetailsDisplay(item, userAName, userBName)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerType: {
    flex: 0.3,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerDetails: {
    flex: 0.7,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  typeCell: {
    flex: 0.3,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsCell: {
    flex: 0.7,
    justifyContent: 'center',
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ScoredItemsTable;