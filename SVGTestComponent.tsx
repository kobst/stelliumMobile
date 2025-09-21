import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from './src/theme';
import { AstroIcon } from './utils/astrologyIcons';

// Simple test component to show SVG vs Unicode symbols
const SVGTestComponent: React.FC = () => {
  const { colors } = useTheme();

  const testData = [
    { planet: 'Sun', sign: 'Leo' },
    { planet: 'Moon', sign: 'Cancer' },
    { planet: 'Mercury', sign: 'Gemini' },
    { planet: 'Venus', sign: 'Taurus' },
    { planet: 'Mars', sign: 'Aries' },
    { planet: 'Jupiter', sign: 'Sagittarius' },
    { planet: 'Saturn', sign: 'Capricorn' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.primary }]}>
          SVG Icons Working! 🎉
        </Text>

        {testData.map((item, index) => (
          <View key={index} style={styles.row}>
            <View style={styles.iconGroup}>
              <AstroIcon type="planet" name={item.planet} size={24} color={colors.primary} />
              <Text style={[styles.label, { color: colors.onSurface }]}>{item.planet}</Text>
            </View>

            <View style={styles.iconGroup}>
              <AstroIcon type="zodiac" name={item.sign} size={24} color={colors.primary} />
              <Text style={[styles.label, { color: colors.onSurface }]}>{item.sign}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.note, { color: colors.onSurfaceVariant }]}>
          These are your new SVG icons! They appear in PlanetaryIcons and PlanetCard components.
        </Text>

        <Text style={[styles.note, { color: colors.onSurfaceVariant }]}>
          The chart wheel still uses Unicode symbols because it renders directly in SVG.
        </Text>
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
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default SVGTestComponent;