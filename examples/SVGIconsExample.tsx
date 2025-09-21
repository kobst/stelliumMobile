import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../src/theme';
import {
  AstroIcon,
  ZodiacIcon,
  PlanetIcon,
  getZodiacIconFromConstant,
  getPlanetIconFromConstant
} from '../utils/astrologyIcons';
import { signs, planets } from '../constants';

// Example component showing how to integrate SVG icons into your existing codebase
const SVGIconsExample: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Basic Usage Examples */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Basic SVG Icon Usage
        </Text>

        {/* Direct component usage */}
        <View style={styles.iconRow}>
          <ZodiacIcon sign="leo" size={32} color={colors.primary} />
          <PlanetIcon planet="sun" size={32} color="#FFD700" />
          <Text style={[styles.description, { color: colors.onSurface }]}>
            Direct component usage
          </Text>
        </View>

        {/* Using AstroIcon with your constants */}
        <View style={styles.iconRow}>
          <AstroIcon type="zodiac" name="Scorpio" size={32} color={colors.primary} />
          <AstroIcon type="planet" name="Mars" size={32} color="#FF4500" />
          <Text style={[styles.description, { color: colors.onSurface }]}>
            Works with your existing constants (capitalized names)
          </Text>
        </View>
      </View>

      {/* Integration with Existing PlanetaryIcons Component */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Enhanced PlanetaryIcons with SVGs
        </Text>

        <Text style={[styles.codeExample, { color: colors.onSurfaceVariant }]}>
{`// Replace text symbols in PlanetaryIcons.tsx:
import { AstroIcon } from '../utils/astrologyIcons';

// Instead of:
<Text style={[styles.planetaryIcon, { color: colors.primary }]}>
  {planetarySymbols.Sun}
</Text>

// Use:
<AstroIcon
  type="planet"
  name={planetaryData.sun.sign}
  size={14}
  color={colors.primary}
/>`}
        </Text>
      </View>

      {/* All Available Zodiac Icons */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          All Zodiac Sign Icons
        </Text>
        <View style={styles.iconGrid}>
          {signs.map((sign) => (
            <View key={sign} style={styles.iconGridItem}>
              <AstroIcon type="zodiac" name={sign} size={24} color={colors.primary} />
              <Text style={[styles.iconLabel, { color: colors.onSurface }]}>
                {sign}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* All Available Planet Icons */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          All Planet Icons
        </Text>
        <View style={styles.iconGrid}>
          {planets.map((planet) => (
            <View key={planet} style={styles.iconGridItem}>
              <AstroIcon type="planet" name={planet} size={24} color={colors.primary} />
              <Text style={[styles.iconLabel, { color: colors.onSurface }]}>
                {planet}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Usage in Chart Components */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Chart Component Integration
        </Text>

        <Text style={[styles.codeExample, { color: colors.onSurfaceVariant }]}>
{`// In PlanetCard.tsx, replace symbol rendering:
// Instead of hardcoded symbols, use:

const PlanetIconComponent = getPlanetIconFromConstant(planet);
const SignIconComponent = getZodiacIconFromConstant(position.sign);

return (
  <View style={styles.symbolContainer}>
    {PlanetIconComponent && (
      <PlanetIconComponent
        width={20}
        height={20}
        fill={getPlanetColor(planet)}
      />
    )}
  </View>
);`}
        </Text>
      </View>

      {/* Advanced Usage */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Advanced Usage Tips
        </Text>

        <View style={styles.tipItem}>
          <Text style={[styles.tipNumber, { color: colors.primary }]}>1.</Text>
          <Text style={[styles.tipText, { color: colors.onSurface }]}>
            SVGs are scalable and crisp at any size
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={[styles.tipNumber, { color: colors.primary }]}>2.</Text>
          <Text style={[styles.tipText, { color: colors.onSurface }]}>
            Use fill prop to change colors dynamically
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={[styles.tipNumber, { color: colors.primary }]}>3.</Text>
          <Text style={[styles.tipText, { color: colors.onSurface }]}>
            Works seamlessly with your existing theming system
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Text style={[styles.tipNumber, { color: colors.primary }]}>4.</Text>
          <Text style={[styles.tipText, { color: colors.onSurface }]}>
            Better accessibility than Unicode symbols
          </Text>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  description: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  codeExample: {
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconGridItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default SVGIconsExample;