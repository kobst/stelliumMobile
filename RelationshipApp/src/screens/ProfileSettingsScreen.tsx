import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DevSessionPanel } from '../components/DevSessionPanel';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { getBigThree, getBigThreeSummary } from '../utils/mainShell';

export const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RelationshipRootParamList>>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const overview = useRelationshipAppStore((state) => state.selfProfileOverview);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const placements = getBigThree(profile);
  const romanticBlurb = profile?.romanticProfileBlurb;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Profile</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {profile?.displayName ?? 'Your romantic profile'}
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {getBigThreeSummary(profile)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Romantic profile</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {overview ??
              profile?.romanticOverview ??
              'Your signup summary should live here in full, with room to expand into chart badges and later profile editing.'}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('AskIris', { context: 'profile' })}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Ask Iris About Your Chart
            </Text>
          </TouchableOpacity>
        </View>

        {romanticBlurb ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Romantic blurb</Text>
            <Text style={[styles.blurbText, { color: colors.text }]}>{romanticBlurb}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Core placements</Text>
          <View style={styles.placementGrid}>
            <View style={[styles.placementTile, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.placementLabel, { color: colors.textMuted }]}>Sun</Text>
              <Text style={[styles.placementValue, { color: colors.text }]}>{placements.sun ?? 'Unknown'}</Text>
            </View>
            <View style={[styles.placementTile, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.placementLabel, { color: colors.textMuted }]}>Moon</Text>
              <Text style={[styles.placementValue, { color: colors.text }]}>{placements.moon ?? 'Unknown'}</Text>
            </View>
            <View style={[styles.placementTile, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.placementLabel, { color: colors.textMuted }]}>Rising</Text>
              <Text style={[styles.placementValue, { color: colors.text }]}>{placements.rising ?? 'Unknown'}</Text>
            </View>
          </View>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Born {profile?.dateOfBirth ?? 'Unknown date'}{profile?.time ? ` at ${profile.time}` : ''}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {profile?.placeOfBirth ?? 'Birthplace pending'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Credits + unlocks</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Credit balance, purchase flow, and unlock history should live here next so the user's
            account state is visible in one obvious place.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            clearActiveRelationshipFlow();
            navigation.navigate('ChooseTargetType');
          }}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            Add Another Relationship
          </Text>
        </TouchableOpacity>

        <DevSessionPanel />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  headerBlock: {
    gap: 10,
    paddingTop: 8,
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
    lineHeight: 22,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placementGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  placementTile: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  placementLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  placementValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  blurbText: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
