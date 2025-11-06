import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useCreditBalance } from '../../hooks/useCreditBalance';

interface CreditMeterProps {
  compact?: boolean;
  opacity?: number;
}

export const CreditMeter: React.FC<CreditMeterProps> = ({
  compact = true,
  opacity = 1,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { total, monthlyLimit, loading, isBalanceLow } = useCreditBalance();

  const handlePress = () => {
    (navigation as any).navigate('CreditPurchase', { source: 'credit_meter' });
  };

  if (loading && total === 0) {
    return (
      <View style={[styles.container, { opacity }]}>
        <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
      </View>
    );
  }

  // Determine color based on credit status
  const getStatusColor = () => {
    if (isBalanceLow) {
      return colors.error;
    }
    return colors.onSurfaceVariant;
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isBalanceLow ? colors.errorContainer : colors.surfaceVariant,
          opacity,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.bolt}>⚡</Text>
      <Text
        style={[
          styles.creditText,
          {
            color: isBalanceLow ? colors.onErrorContainer : colors.onSurfaceVariant,
            fontWeight: isBalanceLow ? '600' : '500',
          },
        ]}
      >
        {total}
        {!compact && ` / ${monthlyLimit}`}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  bolt: {
    fontSize: 14,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
