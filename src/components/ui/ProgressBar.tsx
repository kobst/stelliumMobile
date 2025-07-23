import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface ProgressBarProps {
  label: string;
  level: string;
  fillColor: 'accentSupport' | 'accentWarning' | 'accentPrimary';
  icon: string;
  style?: any;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  level,
  fillColor,
  icon,
  style,
}) => {
  const { colors } = useTheme();

  // Convert level to progress percentage for visual representation
  const getProgressWidth = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'very high':
        return '90%';
      case 'high':
        return '75%';
      case 'moderate':
        return '50%';
      case 'low':
        return '25%';
      case 'very low':
        return '10%';
      case 'more supportive':
        return '75%';
      case 'balanced':
        return '50%';
      case 'more challenging':
        return '25%';
      case 'highly supportive':
        return '90%';
      default:
        return '50%';
    }
  };

  const progressWidth = getProgressWidth(level);
  const barFillColor = colors[fillColor];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.label, { color: colors.onSurfaceMed }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.levelText, { color: colors.onSurfaceHigh }]}>
          {level}
        </Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: barFillColor,
              width: progressWidth,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default ProgressBar;
