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
  compact?: boolean;
}

export const CreditActionButton: React.FC<CreditActionButtonProps> = ({
  cost,
  actionText,
  onPress,
  disabled = false,
  loading = false,
  compact = false,
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
      style={compact ? styles.compactContainer : styles.container}>
      <View
        style={[
          compact ? styles.compactButton : styles.button,
          {backgroundColor: getBackgroundColor()},
          disabled && styles.disabledButton,
        ]}>
        {/* Left section: Action text or loading */}
        <View style={compact ? styles.compactRightSection : styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text
              style={[compact ? styles.compactActionText : styles.actionText, {color: colors.onPrimary}]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {actionText}
            </Text>
          )}
        </View>

        {/* Vertical divider */}
        <View
          style={[
            compact ? styles.compactDivider : styles.divider,
            {backgroundColor: colors.onPrimary},
          ]}
        />

        {/* Right section: Cost + Icon */}
        <View style={compact ? styles.compactLeftSection : styles.leftSection}>
          <Text style={[compact ? styles.compactCostText : styles.costText, {color: colors.onPrimary}]}>
            {cost}
          </Text>
          <Text style={[compact ? styles.compactIcon : styles.icon, {color: colors.onPrimary}]}>⚡</Text>
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
    marginLeft: 6,
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
    paddingRight: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Compact styles for embedded button
  compactContainer: {
    borderRadius: 18,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    height: 36,
  },
  compactLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 14,
    marginLeft: 3,
  },
  compactCostText: {
    fontSize: 13,
    fontWeight: '700',
  },
  compactDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 4,
    opacity: 0.3,
  },
  compactRightSection: {
    paddingRight: 2,
  },
  compactActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
