import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BirthChartElement } from '../../api/charts';
import { BirthChart } from '../../types';
import BirthChartAspectCard from './BirthChartAspectCard';
import { convertAstroCodesToElements } from '../../utils/astroCodeConverter';
import { getPlanetGlyph, PlanetName } from './ChartUtils';

interface BirthChartKeyElementsSectionProps {
  title: string;
  elementCodes: string[];
  birthChart: BirthChart;
  colors: any;
}

const BirthChartKeyElementsSection: React.FC<BirthChartKeyElementsSectionProps> = ({
  title,
  elementCodes,
  birthChart,
  colors,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert astro codes to BirthChartElements
  const keyElements = convertAstroCodesToElements(elementCodes, birthChart);

  console.log('BirthChartKeyElementsSection - Input codes:', elementCodes);
  console.log('BirthChartKeyElementsSection - Converted elements:', keyElements);
  console.log('BirthChartKeyElementsSection - Birth chart has aspects?', !!birthChart?.aspects);
  console.log('BirthChartKeyElementsSection - Birth chart has planets?', !!birthChart?.planets);

  // Don't render if there are no key elements
  if (keyElements.length === 0) {
    console.log('BirthChartKeyElementsSection - No elements to render, returning null');
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {/* Collapsible Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.surface }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
          <Text style={[styles.headerCount, { color: colors.onSurfaceVariant }]}>
            ({keyElements.length})
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Content */}
      {isExpanded && (
        <View style={styles.content}>
          {keyElements.map((element, index) => {
            // Render aspect cards
            if (element.type === 'aspect') {
              return (
                <View key={`${element.planet1}-${element.aspectType}-${element.planet2}-${index}`}>
                  <BirthChartAspectCard
                    element={element}
                    colors={colors}
                    isSelected={false}
                    variant="list"
                  />
                  {index < keyElements.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            }

            // Render position cards
            if (element.type === 'position') {
              const houseText = element.house ? ` in House ${element.house}` : '';
              const retroText = element.isRetrograde ? ' ℞' : '';

              return (
                <View key={`${element.planet}-${element.sign}-${index}`}>
                  <View style={styles.positionCard}>
                    <View style={styles.positionCardContent}>
                      <Text style={[styles.planetGlyph, { color: colors.onSurface }]}>{getPlanetGlyph(element.planet as PlanetName)}</Text>
                      <View style={styles.planetInfo}>
                        <Text style={[styles.planetName, { color: colors.onSurface }]}>
                          {element.planet}
                        </Text>
                        <Text style={[styles.planetPosition, { color: colors.onSurfaceVariant }]}>
                          {element.sign}{houseText}{retroText}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < keyElements.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            }

            return null;
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  positionCard: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  positionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planetGlyph: {
    fontSize: 20,
    marginRight: 12,
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    fontSize: 17,
    fontWeight: '600',
  },
  planetPosition: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default BirthChartKeyElementsSection;
