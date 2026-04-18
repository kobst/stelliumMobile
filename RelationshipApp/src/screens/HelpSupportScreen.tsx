import React, { useCallback, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { SettingsInfoCard } from '../components/SettingsInfoCard';
import { SectionLabel } from '../components/SectionLabel';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

const FAQS: readonly FaqEntry[] = [
  {
    id: 'scores',
    question: 'How are compatibility scores calculated?',
    answer:
      'Iris analyzes the astrological aspects between your natal chart and another person\'s chart across five dimensions: Harmony, Passion, Connection, Stability, and Growth. Each dimension is scored based on the strength and type of aspects (trines, squares, conjunctions, etc.) between relevant planets.',
  },
  {
    id: 'synastry-composite',
    question: "What's the difference between synastry and composite?",
    answer:
      'Synastry looks at how your two charts interact — the aspects between your planets and theirs. Composite creates a single merged chart that represents the relationship itself as its own entity. Together they give a complete picture of both the chemistry between you and what the relationship creates.',
  },
  {
    id: 'birth-time',
    question: 'Why does birth time matter?',
    answer:
      'Birth time determines your Ascendant, house placements, and Moon degree. Without it, we can still calculate Sun, Venus, Mars, and most aspects, but house-based analysis and precise Moon aspects will not be available. Even an approximate time is better than none.',
  },
  {
    id: 'credits-expire',
    question: 'Do my credits expire?',
    answer:
      'Monthly plan credits reset at each renewal. Purchased credit packs never expire. When you spend credits, plan credits are used first to maximize the value of your purchased credits.',
  },
  {
    id: 'privacy',
    question: 'Can other people see my connections?',
    answer:
      'No. All your relationship data, scores, and conversations are completely private. Only you can see your connections and analysis.',
  },
];

const SUPPORT_EMAIL = 'support@irisapp.com';
const FEEDBACK_EMAIL = 'feedback@irisapp.com';

export function HelpSupportScreen() {
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFaq = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const openMail = useCallback(
    (address: string, subject: string, errorLabel: string) => async () => {
      const url = `mailto:${address}?subject=${encodeURIComponent(subject)}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert(errorLabel, `Email us at ${address}.`);
      }
    },
    []
  );

  const contactRows = [
    {
      key: 'email',
      icon: '✉',
      label: 'Email Support',
      subtitle: SUPPORT_EMAIL,
      chevron: true,
      onPress: openMail(SUPPORT_EMAIL, 'Iris support request', 'Email Support'),
    },
    {
      key: 'feedback',
      icon: '💬',
      label: 'Send Feedback',
      subtitle: 'Help us improve Iris',
      chevron: true,
      onPress: openMail(FEEDBACK_EMAIL, 'Iris feedback', 'Send Feedback'),
    },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Help & Support" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Frequently Asked Questions</SectionLabel>
        <View style={styles.faqList}>
          {FAQS.map((faq) => {
            const isOpen = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                activeOpacity={0.85}
                onPress={() => toggleFaq(faq.id)}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                  <Text style={[styles.faqChev, { color: colors.textSubtle }]}>
                    {isOpen ? '˅' : '›'}
                  </Text>
                </View>
                {isOpen ? (
                  <View style={styles.faqBody}>
                    <View style={[styles.faqDivider, { backgroundColor: colors.ghostBorder }]} />
                    <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                      {faq.answer}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionLabel style={styles.sectionSpacing}>Get in Touch</SectionLabel>
        <SettingsInfoCard rows={contactRows} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 10,
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  faqChev: {
    fontSize: 16,
    fontWeight: '500',
  },
  faqBody: {
    marginTop: 12,
    gap: 10,
  },
  faqDivider: {
    height: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionSpacing: {
    marginTop: 20,
  },
});
