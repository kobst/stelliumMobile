import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { horoscopeTransformers } from '../../transformers/horoscope';

const CustomHoroscopeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { customHoroscope } = useStore();

  const handleNewSelection = () => {
    navigation.goBack();
  };

  if (!customHoroscope) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No custom horoscope available. Please select transits first.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('TransitSelection' as never)}
          >
            <Text style={styles.buttonText}>Select Transits</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Custom Horoscope</Text>
        <Text style={styles.headerSubtitle}>
          Generated from {customHoroscope.selectedTransits?.length || 0} selected transits
        </Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.horoscopeCard}>
          <Text style={styles.horoscopeText}>
            {horoscopeTransformers.formatHoroscopeContent(customHoroscope.content)}
          </Text>
        </View>
      </View>

      {customHoroscope.selectedTransits && customHoroscope.selectedTransits.length > 0 && (
        <View style={styles.transitsSection}>
          <Text style={styles.sectionTitle}>Transits Included</Text>
          {customHoroscope.selectedTransits.map((transit: any) => (
            <View key={transit.id} style={styles.transitItem}>
              <Text style={styles.transitText}>{transit.description}</Text>
              <Text style={styles.transitDetails}>
                {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNewSelection}>
          <Text style={styles.buttonText}>Create New Custom Horoscope</Text>
        </TouchableOpacity>
        
        {customHoroscope.createdAt && (
          <Text style={styles.timestamp}>
            Generated on {horoscopeTransformers.formatDate(customHoroscope.createdAt, 'long')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  contentSection: {
    padding: 16,
  },
  horoscopeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  horoscopeText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#e2e8f0',
  },
  transitsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  transitItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transitText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  transitDetails: {
    fontSize: 12,
    color: '#94a3b8',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default CustomHoroscopeScreen;