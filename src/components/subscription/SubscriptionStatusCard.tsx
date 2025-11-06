import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface SubscriptionStatusCardProps {
  tier: 'free' | 'premium' | 'pro';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  renewsAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  priceMonthly: number;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  tier,
  status,
  renewsAt,
  expiresAt,
  cancelledAt,
  priceMonthly,
}) => {
  const { colors } = useTheme();

  const getTierDisplayName = () => {
    switch (tier) {
      case 'free':
        return 'Free Plan';
      case 'premium':
        return 'Premium Plan';
      case 'pro':
        return 'Pro Plan';
      default:
        return 'Free Plan';
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'cancelled':
        return colors.warning;
      case 'expired':
        return colors.error;
      case 'trial':
        return colors.accentPrimary;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getStatusDisplayText = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      case 'trial':
        return 'Trial';
      default:
        return 'Active';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDateInfo = () => {
    if (status === 'cancelled' && expiresAt) {
      return {
        label: 'Active until',
        date: formatDate(expiresAt),
      };
    }
    if (status === 'active' && renewsAt) {
      return {
        label: 'Renews on',
        date: formatDate(renewsAt),
      };
    }
    if (status === 'expired' && expiresAt) {
      return {
        label: 'Expired on',
        date: formatDate(expiresAt),
      };
    }
    return null;
  };

  const dateInfo = getDateInfo();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.tierInfo}>
          <Text style={[styles.tierName, { color: colors.onSurface }]}>
            {getTierDisplayName()}
          </Text>
          {priceMonthly > 0 && (
            <Text style={[styles.price, { color: colors.onSurfaceVariant }]}>
              ${priceMonthly}/month
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor() }]}>
          <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
            {getStatusDisplayText()}
          </Text>
        </View>
      </View>

      {dateInfo && (
        <View style={styles.dateContainer}>
          <Text style={[styles.dateLabel, { color: colors.onSurfaceVariant }]}>
            {dateInfo.label}
          </Text>
          <Text style={[styles.dateValue, { color: colors.onSurface }]}>
            {dateInfo.date}
          </Text>
        </View>
      )}

      {status === 'cancelled' && cancelledAt && (
        <View style={[styles.warningContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.warningText, { color: colors.warning }]}>
            ⚠️ Your subscription was cancelled on {formatDate(cancelledAt)}. You'll retain access
            until {formatDate(expiresAt)}.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: {
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default SubscriptionStatusCard;
