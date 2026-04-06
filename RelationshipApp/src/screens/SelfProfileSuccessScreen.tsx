import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';

type Props = StackScreenProps<RelationshipRootParamList, 'SelfProfileSuccess'>;

export const SelfProfileSuccessScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const selfProfileOverview = useRelationshipAppStore((state) => state.selfProfileOverview);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Profile Ready</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {profile ? `${profile.displayName} is ready.` : 'Your profile is ready.'}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          {selfProfileOverview ??
            'Your romantic profile has been created. Next, choose who you want to compare against.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.replace('ChooseTargetType')}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    gap: 16,
    paddingTop: 48,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    paddingBottom: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
