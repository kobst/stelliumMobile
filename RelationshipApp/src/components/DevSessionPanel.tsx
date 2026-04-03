import React from 'react';
import auth from '@react-native-firebase/auth';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { relationshipAppEnv } from '../config/env';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';

interface DevSessionPanelProps {
  onAfterReset?: () => void;
}

export const DevSessionPanel: React.FC<DevSessionPanelProps> = ({ onAfterReset }) => {
  const { colors } = useTheme();
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const firebaseUid = useRelationshipAppStore((state) => state.firebaseUid);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const resetSession = useRelationshipAppStore((state) => state.resetSession);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);

  const isDevelopment = __DEV__ || relationshipAppEnv.env === 'development';

  if (!isDevelopment) {
    return null;
  }

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setResetError(null);
      await auth().signOut();
      resetSession();
      onAfterReset?.();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not reset session.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.primary }]}>Dev Session</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>Auth: {authStatus}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        Firebase UID: {firebaseUid ?? 'none'}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        Self profile: {selfProfileId ?? 'none'}
      </Text>

      <TouchableOpacity
        style={[styles.button, { borderColor: colors.border }]}
        onPress={() => {
          handleReset().catch(() => undefined);
        }}
        disabled={isResetting}
      >
        {isResetting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.text }]}>Reset Session</Text>
        )}
      </TouchableOpacity>

      {resetError ? (
        <Text style={[styles.error, { color: colors.primary }]}>Reset failed: {resetError}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
});
