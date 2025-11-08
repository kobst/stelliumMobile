import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { superwallService } from '../services/SuperwallService';

interface UpgradeBannerProps {
  itemType: 'charts' | 'relationships' | 'reports' | 'chat';
  currentCount: number;
  limit: number;
  onUpgradePress?: () => void;
}

// Helper functions for dynamic content
const getTitle = (itemType: UpgradeBannerProps['itemType']): string => {
  switch (itemType) {
    case 'charts':
      return 'Quick Chart';
    case 'relationships':
      return 'Quick Match';
    case 'reports':
      return 'Report';
    case 'chat':
      return 'Chat Question';
    default:
      return 'Usage';
  }
};

const getMessage = (
  itemType: UpgradeBannerProps['itemType'],
  currentCount: number,
  limit: number
): string => {
  switch (itemType) {
    case 'charts':
      return `You've used ${currentCount}/${limit} Quick Charts this month. Upgrade for more!`;
    case 'relationships':
      return `You've used ${currentCount}/${limit} Quick Matches this month. Upgrade for more!`;
    case 'reports':
      return `You've used ${currentCount}/${limit} Reports this month. Upgrade for more!`;
    case 'chat':
      return `You've used ${currentCount}/${limit} chat questions this month. Upgrade for unlimited access!`;
    default:
      return `You've reached your monthly limit. Upgrade to continue!`;
  }
};

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  itemType,
  currentCount,
  limit,
  onUpgradePress,
}) => {
  const { colors } = useTheme();

  const handleUpgrade = async () => {
    if (onUpgradePress) {
      onUpgradePress();
      return;
    }

    // Show appropriate Superwall paywall based on item type
    try {
      switch (itemType) {
        case 'charts':
          await superwallService.showChartLimitPaywall(currentCount, limit);
          break;
        case 'relationships':
          await superwallService.showRelationshipLimitPaywall(currentCount, limit);
          break;
        case 'reports':
          await superwallService.showReportLimitPaywall(currentCount, limit);
          break;
        case 'chat':
          await superwallService.showChatLimitPaywall(currentCount, limit);
          break;
        default:
          await superwallService.showUpgradePaywall('upgrade_banner');
      }
    } catch (error) {
      console.error('[UpgradeBanner] Failed to show paywall:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.banner, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {getTitle(itemType)} Limit Reached
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {getMessage(itemType, currentCount, limit)}
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
