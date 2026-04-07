import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { DevSessionPanel } from '../components/DevSessionPanel';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Home</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Relationship-first product home.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          {profile
            ? `Signed in as ${profile.displayName}. Use this shell to keep validating the preview-first flow before we design the final home experience.`
            : 'Create your self profile first. The relationship app depends on a persistent "You" profile before starting previews.'}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Analyze a real person</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Start the live guest-subject to compatibility-preview flow.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              clearActiveRelationshipFlow();
              navigation.navigate(profile ? 'ProfileReveal' : 'CreateSelfProfile');
            }}
          >
            <Text style={styles.primaryButtonText}>
              {profile ? 'Start New Preview' : 'Create Your Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {previewAnalysis ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Latest preview</Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              {previewAnalysis.userA.name} and {previewAnalysis.userB.name} scored{' '}
              {Math.round(previewAnalysis.overall.score)}%.
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('ProfileReveal')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Open Preview
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <DevSessionPanel />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
