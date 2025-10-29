import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../theme';

interface InsufficientCreditsModalProps {
  visible: boolean;
  currentCredits: number;
  requiredCredits: number;
  onAddCredits: () => void;
  onCancel: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  visible,
  currentCredits,
  requiredCredits,
  onAddCredits,
  onCancel,
}) => {
  const { colors } = useTheme();

  // Calculate progress percentage
  const progressPercentage = Math.min((currentCredits / requiredCredits) * 100, 100);
  const shortfall = requiredCredits - currentCredits;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        {/* Bottom Sheet Container */}
        <View
          style={[styles.modalContainer, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.onSurfaceVariant }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.onSurface }]}>
              You need {requiredCredits} credits to unlock this.
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              You currently have {currentCredits} credits.
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
                  {currentCredits} / {requiredCredits} credits
                </Text>
                <Text style={[styles.progressLabel, { color: colors.error }]}>
                  Need {shortfall} more
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progressPercentage}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Add Credits Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={onAddCredits}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
                Add Credits
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCancel}
              activeOpacity={0.6}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.onSurfaceVariant }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InsufficientCreditsModal;
