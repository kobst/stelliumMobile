import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number | 'unlimited';
  icon?: string;
}

const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  label,
  used,
  limit,
  icon,
}) => {
  const { colors } = useTheme();

  const isUnlimited = limit === 'unlimited';
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  // Determine progress bar color based on usage level
  const getProgressColor = () => {
    if (isUnlimited) return colors.accentSupport;
    if (percentage >= 90) return colors.error;
    if (percentage >= 70) return colors.warning;
    return colors.accentSupport;
  };

  const progressColor = getProgressColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
        </View>
        <Text style={[styles.usageText, { color: colors.onSurfaceVariant }]}>
          {isUnlimited ? 'Unlimited' : `${used} of ${limit} used`}
        </Text>
      </View>

      {!isUnlimited && (
        <View style={[styles.progressBarBackground, { backgroundColor: colors.surfaceVariant }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      )}

      {isUnlimited && (
        <View style={styles.unlimitedBadge}>
          <View style={[styles.unlimitedDot, { backgroundColor: colors.accentSupport }]} />
          <Text style={[styles.unlimitedText, { color: colors.accentSupport }]}>
            No limits
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  unlimitedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  unlimitedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UsageProgressBar;
