import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme';
import { ProfileAvatar } from '../profile';

interface HeaderWithProfileProps {
  title: string;
  subtitle?: string;
  showSafeArea?: boolean;
}

export const HeaderWithProfile: React.FC<HeaderWithProfileProps> = ({
  title,
  subtitle,
  showSafeArea = true,
}) => {
  const { colors } = useTheme();

  const HeaderContent = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.onBackground }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
          )}
        </View>
        <View style={styles.avatarContainer}>
          <ProfileAvatar size={40} />
        </View>
      </View>
    </View>
  );

  if (showSafeArea) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        <HeaderContent />
      </SafeAreaView>
    );
  }

  return <HeaderContent />;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    marginRight: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
});
