import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnalysisTab: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>360 Analysis content coming soon</Text>
      <Text style={styles.descriptionText}>
        This tab will display comprehensive topic analysis covering personality, relationships, career, and spiritual aspects.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AnalysisTab;