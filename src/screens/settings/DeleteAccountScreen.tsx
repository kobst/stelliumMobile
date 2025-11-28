import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import DeleteConfirmationModal from '../../components/profile/DeleteConfirmationModal';

const DeleteAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const BulletPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.bulletContainer}>
      <Text style={[styles.bullet, { color: colors.onSurfaceVariant }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.onSurfaceVariant }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningSection}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={[styles.warningTitle, { color: colors.error }]}>
            Permanently Delete Your Account
          </Text>
          <Text style={[styles.warningText, { color: colors.onSurfaceVariant }]}>
            This action cannot be undone. Your Stellium account, charts, readings, and chat history will be permanently deleted.
          </Text>
        </View>

        {/* What Will Be Deleted */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            What will be deleted
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BulletPoint>Your birth chart and analysis</BulletPoint>
            <BulletPoint>All guest charts you created</BulletPoint>
            <BulletPoint>All relationship analyses</BulletPoint>
            <BulletPoint>All horoscopes and chat history</BulletPoint>
            <BulletPoint>Your subscription and credits (non-refundable)</BulletPoint>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Important notes
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BulletPoint>This action cannot be undone</BulletPoint>
            <BulletPoint>Your subscription will be cancelled</BulletPoint>
            <BulletPoint>No refunds for remaining subscription time or credits</BulletPoint>
            <BulletPoint>Payment receipts will remain in Apple (required by Apple)</BulletPoint>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            If you're experiencing issues or have concerns, please contact us at support@stellium.ai before deleting your account.
          </Text>
        </View>

        {/* Delete Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => setShowConfirmModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteButtonText, { color: colors.onError }]}>
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          // The modal will handle the deletion and navigation
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  warningSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  warningEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DeleteAccountScreen;
