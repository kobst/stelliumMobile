/**
 * Credit Balance Display
 *
 * Shows user's current credit balance with visual status indicator.
 * Can be placed in navigation header, profile screen, or anywhere credits are relevant.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useCreditBalance } from '../hooks/useCreditBalance';

interface CreditBalanceDisplayProps {
  /** Show as compact badge (for navigation) or expanded card */
  variant?: 'compact' | 'card';
  /** Optional callback when tapped (e.g., navigate to purchase screen) */
  onPress?: () => void;
  /** Show loading spinner while fetching */
  showLoading?: boolean;
}

export const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = ({
  variant = 'compact',
  onPress,
  showLoading = true,
}) => {
  const { colors } = useTheme();
  const { credits, loading, isBalanceLow, statusColor } = useCreditBalance();

  if (loading && showLoading && variant === 'compact') {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={[
          styles.compactContainer,
          {
            backgroundColor: isBalanceLow ? '#FEF3C7' : colors.surfaceVariant,
            borderColor: statusColor,
          },
        ]}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Text style={[styles.creditIcon, { color: statusColor }]}>⚡</Text>
        <Text style={[styles.compactBalance, { color: colors.onSurface }]}>
          {credits}
        </Text>
      </TouchableOpacity>
    );
  }

  // Card variant - expanded view
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={[styles.creditIcon, styles.cardIcon, { color: statusColor }]}>
            ⚡
          </Text>
          <View>
            <Text style={[styles.cardBalance, { color: colors.onSurface }]}>
              {credits} Credits
            </Text>
            {isBalanceLow && (
              <Text style={[styles.lowBalanceWarning, { color: '#D97706' }]}>
                Low balance
              </Text>
            )}
          </View>
        </View>

        {onPress && (
          <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
        )}
      </View>

      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.cardLoader}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact variant (navigation badge)
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  creditIcon: {
    fontSize: 14,
  },
  compactBalance: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Card variant (expanded view)
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardBalance: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  lowBalanceWarning: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  cardLoader: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
