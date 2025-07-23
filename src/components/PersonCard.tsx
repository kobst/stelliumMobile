import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

interface PersonCardProps {
  person: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth?: string;
    profession?: string;
    gender?: string;
  };
  isSelected: boolean;
  onPress: () => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, isSelected, onPress }) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    selectedCard: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceVariant,
    },
    selectedIndicator: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      flex: 1,
    },
    selectedText: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    birthDate: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    location: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    profession: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    gender: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <TouchableOpacity
      style={[cardStyles.card, isSelected && cardStyles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={cardStyles.name}>
          {person.firstName} {person.lastName}
        </Text>
        {isSelected && (
          <View style={cardStyles.selectedIndicator}>
            <Text style={cardStyles.selectedText}>✓</Text>
          </View>
        )}
      </View>

      <Text style={cardStyles.birthDate}>
        Born: {formatDate(person.dateOfBirth)}
      </Text>

      {person.placeOfBirth && (
        <Text style={cardStyles.location}>
          📍 {person.placeOfBirth}
        </Text>
      )}

      {person.profession && (
        <Text style={cardStyles.profession}>
          💼 {person.profession}
        </Text>
      )}

      {person.gender && (
        <Text style={cardStyles.gender}>
          👤 {person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default PersonCard;
