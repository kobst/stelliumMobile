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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          disabled && { opacity: 0.6 }
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
    padding: 16,
    paddingBottom: 32, // Extra padding for safe area
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