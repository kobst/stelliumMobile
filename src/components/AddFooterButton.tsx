import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';

interface AddFooterButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const AddFooterButton: React.FC<AddFooterButtonProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        borderTopColor: colors.isDark ? '#a78bfa' : '#c4b5fd',
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          disabled && { opacity: 0.6 },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddFooterButton;
