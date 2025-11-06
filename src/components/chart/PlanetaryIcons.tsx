import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SubjectDocument, User } from '../../types';
import { extractPlanetaryData, getZodiacSignFromDate } from '../../utils/chartHelpers';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface PlanetaryIconsProps {
  subject?: SubjectDocument | null;
  user?: User | null;
}

// Function to get zodiac symbol using escape codes
const getZodiacSymbol = (sign: string | null): string => {
  if (!sign) {return '';}

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
    // Build a minimal SubjectDocument using safe defaults for any missing fields
    const safeMonth = String(user.birthMonth ?? 1).padStart(2, '0');
    const safeDay = String(user.birthDay ?? 1).padStart(2, '0');
    const safeYear = user.birthYear || 2000;

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
      dateOfBirth: `${safeYear}-${safeMonth}-${safeDay}`,
      placeOfBirth: user.birthLocation || '',
      birthTimeUnknown: false,
      totalOffsetHours: 0,
      birthChart: user.birthChart,
    };
    planetaryData = extractPlanetaryData(userAsSubject);
  } else if (user) {
    // Fallback - just show sun sign
    const hasDate = typeof user.birthMonth === 'number' && typeof user.birthDay === 'number';
    const sunSignSymbol = hasDate ? getZodiacSignFromDate(user.birthMonth, user.birthDay) : '';
    return (
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <AstroIcon type="planet" name="Sun" size={14} color={colors.primary} />
          {sunSignSymbol ? (
            <Text style={[styles.planetaryIcon, { color: colors.primary }]}>
              {sunSignSymbol}
            </Text>
          ) : null}
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
          <AstroIcon type="planet" name="Sun" size={14} color={colors.primary} />
          <Text style={[styles.signText, { color: colors.primary }]}>{planetaryData.sun.sign}</Text>
        </View>
      )}
      {planetaryData.moon.sign && (
        <>
          <Text style={[styles.separatorText, { color: colors.onSurfaceVariant }]}>|</Text>
          <View style={styles.iconWrapper}>
            <AstroIcon type="planet" name="Moon" size={14} color={colors.primary} />
            <Text style={[styles.signText, { color: colors.primary }]}>{planetaryData.moon.sign}</Text>
          </View>
        </>
      )}
      {planetaryData.ascendant?.sign && (
        <>
          <Text style={[styles.separatorText, { color: colors.onSurfaceVariant }]}>|</Text>
          <View style={styles.iconWrapper}>
            <AstroIcon type="planet" name="Ascendant" size={14} color={colors.primary} />
            <Text style={[styles.signText, { color: colors.primary }]}>{planetaryData.ascendant.sign}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planetaryIcon: {
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  signText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separatorText: {
    fontSize: 14,
    marginHorizontal: 6,
  },
});

export default PlanetaryIcons;
