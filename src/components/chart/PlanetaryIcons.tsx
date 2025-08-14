import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SubjectDocument, User } from '../../types';
import { extractPlanetaryData, getZodiacSignFromDate } from '../../utils/chartHelpers';
import { planetarySymbols } from '../../../constants';

interface PlanetaryIconsProps {
  subject?: SubjectDocument | null;
  user?: User | null;
}

// Function to get zodiac symbol using escape codes
const getZodiacSymbol = (sign: string | null): string => {
  if (!sign) return '';
  
  const symbols: { [key: string]: string } = {
    'Aries': '\u2648',
    'Taurus': '\u2649', 
    'Gemini': '\u264A',
    'Cancer': '\u264B',
    'Leo': '\u264C',
    'Virgo': '\u264D',
    'Libra': '\u264E',
    'Scorpio': '\u264F',
    'Sagittarius': '\u2650',
    'Capricorn': '\u2651',
    'Aquarius': '\u2652',
    'Pisces': '\u2653',
  };
  
  return symbols[sign] || '';
};

const PlanetaryIcons: React.FC<PlanetaryIconsProps> = ({ subject, user }) => {
  const { colors } = useTheme();

  let planetaryData: any = null;

  if (subject && subject.birthChart) {
    // Use birth chart data for guest subjects
    planetaryData = extractPlanetaryData(subject);
  } else if (user && user.birthChart) {
    // Use birth chart data for user if available
    const userAsSubject: SubjectDocument = {
      _id: user.id,
      createdAt: '',
      updatedAt: '',
      kind: 'accountSelf',
      ownerUserId: null,
      isCelebrity: false,
      isReadOnly: false,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      dateOfBirth: `${user.birthYear}-${user.birthMonth.toString().padStart(2, '0')}-${user.birthDay.toString().padStart(2, '0')}`,
      placeOfBirth: user.birthLocation,
      birthTimeUnknown: false,
      totalOffsetHours: 0,
      birthChart: user.birthChart,
    };
    planetaryData = extractPlanetaryData(userAsSubject);
  } else if (user) {
    // Fallback - just show sun sign
    const sunSignSymbol = getZodiacSignFromDate(user.birthMonth, user.birthDay);
    return (
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {planetarySymbols.Sun}
          </Text>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {sunSignSymbol}
          </Text>
        </View>
      </View>
    );
  }

  if (!planetaryData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {planetaryData.sun.sign && (
        <View style={styles.iconWrapper}>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {planetarySymbols.Sun}
          </Text>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {getZodiacSymbol(planetaryData.sun.sign)}
          </Text>
        </View>
      )}
      {planetaryData.moon.sign && (
        <View style={styles.iconWrapper}>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {planetarySymbols.Moon}
          </Text>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {getZodiacSymbol(planetaryData.moon.sign)}
          </Text>
        </View>
      )}
      {planetaryData.ascendant?.sign && (
        <View style={styles.iconWrapper}>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {planetarySymbols.Ascendant}
          </Text>
          <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
            {getZodiacSymbol(planetaryData.ascendant.sign)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  iconWrapper: {
    flexDirection: 'row',
    marginRight: 8,
  },
  planetaryIcon: {
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
});

export default PlanetaryIcons;