import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';

interface SignOutSheetProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SignOutSheet({ visible, onCancel, onConfirm }: SignOutSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceHighest }]} />
          <Text style={[styles.title, { color: colors.text }]}>Sign out?</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            You'll need to sign back in to access your profile and relationships.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onConfirm}
            style={[styles.destructive, { backgroundColor: colors.surfaceHigh }]}
          >
            <Text style={[styles.destructiveText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCancel}
            style={[styles.primary, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryText, { color: colors.onPrimary }]}>
              Stay Signed In
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  destructive: {
    borderRadius: 14,
    paddingVertical: 16,
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primary: {
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
