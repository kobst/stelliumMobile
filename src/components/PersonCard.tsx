import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { formatDate } from '../utils/dateHelpers';
import ProfileAvatar from './profile/ProfileAvatar';
import PlanetaryIcons from './chart/PlanetaryIcons';
import { SubjectDocument } from '../types';

interface PersonCardProps {
  person: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth?: string;
    profession?: string;
    gender?: string;
    profilePhotoUrl?: string;
    profilePhotoKey?: string;
    birthChart?: any;
  };
  isSelected: boolean;
  onPress: () => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, isSelected, onPress }) => {
  const { colors } = useTheme();

  const formatDisplayDate = (dateString: string) => {
    try {
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  // Convert person to SubjectDocument for PlanetaryIcons component
  const personAsSubject: SubjectDocument = {
    _id: person._id,
    createdAt: '',
    updatedAt: '',
    kind: 'guest',
    ownerUserId: null,
    isCelebrity: false,
    isReadOnly: false,
    firstName: person.firstName,
    lastName: person.lastName,
    dateOfBirth: person.dateOfBirth,
    placeOfBirth: person.placeOfBirth || '',
    birthTimeUnknown: false,
    totalOffsetHours: 0,
    birthChart: person.birthChart,
    profilePhotoUrl: person.profilePhotoUrl,
    profilePhotoKey: person.profilePhotoKey,
  };

  // Format date and location in one line
  const dateLocationText = person.placeOfBirth
    ? `${formatDisplayDate(person.dateOfBirth)} - ${person.placeOfBirth}`
    : formatDisplayDate(person.dateOfBirth);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        isSelected && [styles.selectedCard, { borderColor: colors.primary, backgroundColor: colors.surfaceVariant }],
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar on the left */}
      <View style={styles.avatarContainer}>
        <ProfileAvatar subject={personAsSubject} size={48} showOnlineIndicator={false} />
      </View>

      {/* Content in the middle */}
      <View style={styles.contentContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {person.firstName} {person.lastName}
          </Text>
          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
              <Text style={[styles.selectedText, { color: colors.onPrimary }]}>✓</Text>
            </View>
          )}
        </View>

        {/* Planetary Icons */}
        {person.birthChart && <PlanetaryIcons subject={personAsSubject} />}

        {/* Date and Location */}
        <Text style={[styles.dateLocation, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {dateLocationText}
        </Text>

        {/* Gender */}
        {person.gender && (
          <Text style={[styles.gender, { color: colors.onSurfaceVariant }]}>
            Gender: {person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedIndicator: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  gender: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default PersonCard;
