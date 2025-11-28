import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { forceSignOut } from '../../utils/authHelpers';

const AccountDeletedScreen: React.FC = () => {
  const { colors } = useTheme();

  const handleReturnHome = async () => {
    // Sign out completely - this will trigger navigation to AuthScreen
    await forceSignOut();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Text style={styles.emoji}>✨</Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Your account has been deleted
        </Text>

        {/* Message */}
        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
          Thanks for trying Stellium.{'\n'}
          You're welcome back anytime ✨
        </Text>

        {/* Return Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleReturnHome}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AccountDeletedScreen;
