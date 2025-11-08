import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';

interface CancellationModalProps {
  visible: boolean;
  tier: 'premium' | 'pro';
  expiresAt?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  visible,
  tier,
  expiresAt,
  onCancel,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirm = async () => {
    setIsCancelling(true);
    try {
      await onConfirm();
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'the end of your billing period';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFeaturesLost = () => {
    const commonFeatures = [
      'Daily and Monthly horoscopes',
      'AI Chat (Transit, Chart, and Relationship)',
      'Natal and Compatibility Reports',
    ];

    if (tier === 'pro') {
      return [
        'Unlimited Quick Charts and Quick Matches',
        '10 Reports per month',
        'Unlimited AI Chat',
        ...commonFeatures,
      ];
    }

    return [
      '10 Quick Charts and Quick Matches per month',
      '2 Reports per month',
      '100 AI Chat questions per month',
      ...commonFeatures,
    ];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.error }]}>
                Cancel Subscription?
              </Text>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                We're sad to see you go. You'll lose access to these features after{' '}
                {formatDate(expiresAt)}:
              </Text>
            </View>

            <View style={[styles.featuresContainer, { backgroundColor: colors.surfaceVariant }]}>
              {getFeaturesLost().map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={[styles.featureText, { color: colors.onSurface }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                💡 Your subscription will remain active until {formatDate(expiresAt)}, and you won't
                be charged again.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.surfaceVariant },
              ]}
              onPress={onCancel}
              disabled={isCancelling}
            >
              <Text style={[styles.buttonText, { color: colors.onSurface }]}>
                Keep Subscription
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.error },
                isCancelling && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Confirm Cancellation
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 20,
    marginRight: 8,
    marginTop: -2,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 0,
  },
  confirmButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CancellationModal;
