import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

interface CreditGatedHoroscopeTabProps {
  horoscopeType: 'daily' | 'weekly';
  creditCost: number;
  onUnlock: () => void;
  isLoading: boolean;
}

const CreditGatedHoroscopeTab: React.FC<CreditGatedHoroscopeTabProps> = ({
  horoscopeType,
  creditCost,
  onUnlock,
  isLoading,
}) => {
  const { colors } = useTheme();

  const displayName = horoscopeType === 'daily' ? 'Daily' : 'Weekly';

  const getButtonText = (): string => {
    if (isLoading) {
      return 'Unlocking...';
    }
    return `Unlock ${displayName} Horoscope`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Horoscope Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={styles.horoscopeIcon}>
            {horoscopeType === 'daily' ? '☀️' : '📅'}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {displayName} Horoscope
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          Unlock your personalized {displayName.toLowerCase()} reading to discover the cosmic influences shaping your day.
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Personalized {displayName.toLowerCase()} insights
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Key planetary influences
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Actionable guidance
            </Text>
          </View>
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: colors.primary }]}
          onPress={onUnlock}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <View style={styles.unlockButtonContent}>
              <Text style={[styles.unlockButtonText, { color: colors.onPrimary }]}>
                {getButtonText()}
              </Text>
              <View style={[styles.unlockButtonDivider, { backgroundColor: colors.onPrimary }]} />
              <Text style={[styles.unlockButtonCost, { color: colors.onPrimary }]}>
                {creditCost} ⚡
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  horoscopeIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  unlockButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unlockButtonDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
    opacity: 0.3,
  },
  unlockButtonCost: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreditGatedHoroscopeTab;
