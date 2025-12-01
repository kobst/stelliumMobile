import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';

const ManageAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const MenuItem: React.FC<{
    title: string;
    onPress: () => void;
    isDanger?: boolean;
  }> = ({ title, onPress, isDanger }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.menuItemText,
          { color: isDanger ? colors.error : colors.onSurface },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.chevron, { color: isDanger ? colors.error : colors.onSurfaceVariant }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Manage Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Options */}
        <View style={styles.section}>
          <MenuItem
            title="Export My Data"
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'The ability to export your data will be available in a future update.'
              );
            }}
          />
          <MenuItem
            title="Delete My Account"
            onPress={() => {
              navigation.navigate('DeleteAccount' as never);
            }}
            isDanger
          />
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            Need help managing your account? Contact us at support@stellium.ai
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ManageAccountScreen;
