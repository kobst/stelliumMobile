import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>
          {person.firstName} {person.lastName}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.birthDate}>
        Born: {formatDate(person.dateOfBirth)}
      </Text>
      
      {person.placeOfBirth && (
        <Text style={styles.location}>
          📍 {person.placeOfBirth}
        </Text>
      )}
      
      {person.profession && (
        <Text style={styles.profession}>
          💼 {person.profession}
        </Text>
      )}
      
      {person.gender && (
        <Text style={styles.gender}>
          👤 {person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  selectedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e1b4b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  selectedIndicator: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  birthDate: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  profession: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  gender: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default PersonCard;