import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useStore } from '../../store';

const CelebrityScreen: React.FC = () => {
  const { userData } = useStore();
  const [searchText, setSearchText] = useState('');

  const featuredCelebrities = [
    { name: 'Taylor Swift', sign: 'Sagittarius', profession: 'Musician' },
    { name: 'Leonardo DiCaprio', sign: 'Scorpio', profession: 'Actor' },
    { name: 'Oprah Winfrey', sign: 'Aquarius', profession: 'Media Mogul' },
    { name: 'Albert Einstein', sign: 'Pisces', profession: 'Physicist' },
    { name: 'Beyoncé', sign: 'Virgo', profession: 'Musician' },
  ];

  const categories = [
    '🎬 Actors & Actresses',
    '🎵 Musicians & Artists',
    '📚 Authors & Writers',
    '🏛️ Politicians & Leaders',
    '🔬 Scientists & Innovators',
    '⚽ Athletes & Sports',
  ];

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to explore celebrity charts</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Celebrity Birth Charts</Text>
        <Text style={styles.sectionSubtitle}>
          Explore the cosmic blueprints of famous personalities
        </Text>
      </View>

      {/* Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Celebrities</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
          editable={false}
        />
        <Text style={styles.comingSoonText}>Search functionality coming soon</Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryButton} disabled>
              <Text style={styles.categoryButtonText}>{category}</Text>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Celebrities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Celebrities</Text>
        <Text style={styles.sectionSubtitle}>
          Popular celebrity charts to explore
        </Text>
        
        <View style={styles.celebrityList}>
          {featuredCelebrities.map((celebrity, index) => (
            <TouchableOpacity key={index} style={styles.celebrityItem} disabled>
              <View style={styles.celebrityInfo}>
                <Text style={styles.celebrityName}>{celebrity.name}</Text>
                <Text style={styles.celebrityDetails}>
                  {celebrity.sign} • {celebrity.profession}
                </Text>
              </View>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Compatibility Feature */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Celebrity Compatibility</Text>
        <Text style={styles.sectionSubtitle}>
          Compare your chart with celebrity charts
        </Text>
        
        <TouchableOpacity style={styles.compatibilityButton} disabled>
          <Text style={styles.compatibilityButtonText}>
            🌟 Find Your Celebrity Matches
          </Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Celebrity Astrology</Text>
        <Text style={styles.infoText}>
          Celebrity birth charts offer fascinating insights into the cosmic influences that shape 
          famous personalities. By studying their planetary placements, you can understand the 
          astrological patterns behind their success, creativity, and unique traits.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#374151',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  celebrityList: {
    marginTop: 8,
  },
  celebrityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  celebrityInfo: {
    flex: 1,
  },
  celebrityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  celebrityDetails: {
    fontSize: 14,
    color: '#94a3b8',
  },
  compatibilityButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
  },
  compatibilityButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  comingSoonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default CelebrityScreen;