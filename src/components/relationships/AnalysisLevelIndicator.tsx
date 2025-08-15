import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AnalysisLevelIndicatorProps {
  level: 'complete' | 'scores' | 'none';
}

const AnalysisLevelIndicator: React.FC<AnalysisLevelIndicatorProps> = ({ level }) => {
  const { colors } = useTheme();

  const getLevelInfo = () => {
    switch (level) {
      case 'complete':
        return {
          text: 'Complete Analysis',
          icon: '📊',
          color: colors.onSurfaceVariant,
          backgroundColor: colors.surfaceVariant,
        };
      case 'scores':
        return {
          text: 'Compatibility Scores',
          icon: '📈',
          color: colors.onSurfaceVariant,
          backgroundColor: colors.surfaceVariant,
        };
      case 'none':
      default:
        return {
          text: 'Basic Chart Only',
          icon: '📋',
          color: colors.onSurfaceVariant,
          backgroundColor: colors.surfaceVariant,
        };
    }
  };

  const { text, icon, color, backgroundColor } = getLevelInfo();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.indicator, { color }]}>
        {icon} {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  indicator: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AnalysisLevelIndicator;