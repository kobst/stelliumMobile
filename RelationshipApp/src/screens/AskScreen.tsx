import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';

type Props = StackScreenProps<RelationshipRootParamList, 'AskIris'>;

function getContextCopy(
  context: 'home' | 'profile' | 'relationship',
  relationshipLabel?: string
) {
  if (context === 'profile') {
    return {
      eyebrow: 'Your Chart',
      title: 'Ask Iris about your romantic profile.',
      body: 'Use this entry point for questions about your own chart patterns, attachment themes, and recurring attraction loops.',
      prompts: [
        'Why do I keep attracting the same kind of person?',
        'What part of my chart creates the strongest first impression?',
        'Where am I easiest to misread in love?',
      ],
    };
  }

  if (context === 'relationship') {
    return {
      eyebrow: 'Relationship',
      title: relationshipLabel
        ? `Ask Iris about ${relationshipLabel}.`
        : 'Ask Iris about this connection.',
      body: 'This entry point should carry the active relationship context so the conversation starts grounded in the actual synastry and composite data.',
      prompts: [
        'What is the strongest part of this connection?',
        'Where are we most likely to misunderstand each other?',
        'What should I pay attention to before getting more invested?',
      ],
    };
  }

  return {
    eyebrow: 'Iris',
    title: 'Ask Iris anything.',
    body: 'Home is the open-ended entry point: relationship questions, chart questions, and discovery questions can all start here.',
    prompts: [
      'Who in my life should I analyze next?',
      'Which celebrity charts feel closest to mine?',
      'What relationship pattern should I be watching this week?',
    ],
  };
}

export const AskScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const context = route.params?.context ?? 'home';
  const relationshipLabel = route.params?.relationshipLabel;
  const copy = getContextCopy(context, relationshipLabel);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{copy.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>{copy.body}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Suggested prompts</Text>
          {copy.prompts.map((prompt) => (
            <View
              key={prompt}
              style={[styles.promptRow, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}
            >
              <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Next step</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            The conversation surface should live here next. For now this screen proves the
            contextual entry points and the right prompt framing.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 32,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  promptRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    paddingTop: 12,
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
});
