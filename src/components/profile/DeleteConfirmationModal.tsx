import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const { deleteAccount, isDeleting } = useAccountDeletion();

  const isConfirmDisabled = inputValue !== 'DELETE' || isDeleting;

  // Reset input when modal closes
  useEffect(() => {
    if (!visible) {
      setInputValue('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (inputValue === 'DELETE') {
      await deleteAccount();
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={!isDeleting ? onCancel : undefined}
        />
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.error }]}>
              Are you sure?
            </Text>
            <Text style={[styles.message, { color: colors.onSurface }]}>
              Your account and all astrological data will be permanently deleted.
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
              To continue, type: <Text style={{ fontWeight: '700' }}>DELETE</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.onSurface,
                  borderColor: colors.border,
                },
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type DELETE"
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={onCancel}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.onSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: isConfirmDisabled ? colors.surfaceVariant : colors.error,
                },
              ]}
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.onError} />
              ) : (
                <Text
                  style={[
                    styles.confirmButtonText,
                    {
                      color: isConfirmDisabled ? colors.onSurfaceVariant : colors.onError,
                    },
                  ]}
                >
                  Delete Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    minHeight: 48,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeleteConfirmationModal;
