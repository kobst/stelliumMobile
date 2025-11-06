import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { superwallService } from '../services/SuperwallService';
import { PAYWALL_EVENTS } from '../config/subscriptionConfig';

interface LockedHoroscopeTabProps {
  horoscopeType: 'daily' | 'monthly';
}

const LockedHoroscopeTab: React.FC<LockedHoroscopeTabProps> = ({ horoscopeType }) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      // Use the same method as subscription screen which works
      await superwallService.showSettingsUpgradePaywall();
    } catch (error) {
      console.error('[LockedHoroscopeTab] Failed to show paywall:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = horoscopeType === 'daily' ? 'Daily' : 'Monthly';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Lock Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {displayName} Horoscope
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Premium Feature
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          Upgrade to Premium or Pro to unlock {displayName.toLowerCase()} horoscopes and get deeper insights into your astrological journey.
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Personalized {displayName.toLowerCase()} readings
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
              Actionable guidance and themes
            </Text>
          </View>
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.upgradeButtonText, { color: colors.onPrimary }]}>
              Upgrade to Premium
            </Text>
          )}
        </TouchableOpacity>

        {/* Learn More Link */}
        <TouchableOpacity onPress={handleUpgrade}>
          <Text style={[styles.learnMoreText, { color: colors.primary }]}>
            Learn more about Premium
          </Text>
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
  lockIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  upgradeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default LockedHoroscopeTab;
