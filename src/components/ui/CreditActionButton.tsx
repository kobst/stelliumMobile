import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../theme';

interface CreditActionButtonProps {
  cost: number;
  actionText: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const CreditActionButton: React.FC<CreditActionButtonProps> = ({
  cost,
  actionText,
  onPress,
  disabled = false,
  loading = false,
}) => {
  const {colors} = useTheme();

  // Define background color based on state
  const getBackgroundColor = () => {
    if (disabled) {
      return colors.gradientDisabledStart;
    }
    return colors.primary;
  };

  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      style={styles.container}>
      <View
        style={[
          styles.button,
          {backgroundColor: getBackgroundColor()},
          disabled && styles.disabledButton,
        ]}>
        {/* Left section: Icon + Cost */}
        <View style={styles.leftSection}>
          <Text style={[styles.icon, {color: colors.onPrimary}]}>⚡</Text>
          <Text style={[styles.costText, {color: colors.onPrimary}]}>
            {cost}
          </Text>
        </View>

        {/* Vertical divider */}
        <View
          style={[
            styles.divider,
            {backgroundColor: colors.onPrimary},
          ]}
        />

        {/* Right section: Action text or loading */}
        <View style={styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text
              style={[styles.actionText, {color: colors.onPrimary}]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {actionText}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  costText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
    opacity: 0.3,
  },
  rightSection: {
    paddingLeft: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
