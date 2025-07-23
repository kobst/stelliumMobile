import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';

interface UpgradeBannerProps {
  itemType: 'charts' | 'relationships';
  currentCount: number;
  limit: number;
  onUpgradePress?: () => void;
}

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  itemType,
  currentCount,
  limit,
  onUpgradePress,
}) => {
  const { colors } = useTheme();

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      // Default upgrade flow - could navigate to subscription screen
      console.log('Navigate to upgrade screen');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.banner, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {itemType === 'charts' ? 'Chart' : 'Relationship'} Limit Reached
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            You've created {currentCount}/{limit} {itemType}. Upgrade to create more.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <Text style={[styles.upgradeButtonText, { color: colors.onPrimary }]}>
            Upgrade
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32, // Extra padding for safe area
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UpgradeBanner;