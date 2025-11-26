import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

const DataUsageScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>
      {children}
    </View>
  );

  const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text style={[styles.paragraph, { color: colors.onSurfaceVariant }]}>{children}</Text>
  );

  const BulletPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.bulletContainer}>
      <Text style={[styles.bullet, { color: colors.onSurfaceVariant }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.onSurfaceVariant }]}>{children}</Text>
    </View>
  );

  const NumberedPoint: React.FC<{ number: string; title: string; children?: React.ReactNode }> = ({ number, title, children }) => (
    <View style={styles.numberedSection}>
      <Text style={[styles.numberedTitle, { color: colors.onSurface }]}>
        {number}. {title}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Data Usage</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Title */}
        <View style={styles.mainHeader}>
          <Text style={styles.emoji}>🔍</Text>
          <Text style={[styles.mainTitle, { color: colors.onSurface }]}>Data Usage</Text>
        </View>

        {/* What data does Stellium store? */}
        <Section title="What data does Stellium store?">
          <Paragraph>
            Stellium stores only the information needed to generate your charts, analyses, and chat history:
          </Paragraph>

          <NumberedPoint number="1" title="Birth Data (You + any charts you create)">
            <BulletPoint>Name</BulletPoint>
            <BulletPoint>Birth date</BulletPoint>
            <BulletPoint>Birth time (if known)</BulletPoint>
            <BulletPoint>Birth location</BulletPoint>

            <Text style={[styles.subheading, { color: colors.onSurface }]}>We store this so we can:</Text>
            <BulletPoint>Re-generate charts</BulletPoint>
            <BulletPoint>Render synastry & relationship charts</BulletPoint>
            <BulletPoint>Maintain chat context</BulletPoint>
            <BulletPoint>Provide future features (transits, long-term trends)</BulletPoint>
          </NumberedPoint>

          <NumberedPoint number="2" title="Relationship Data">
            <Paragraph>When you create a relationship, we store:</Paragraph>
            <BulletPoint>The two chart IDs</BulletPoint>
            <BulletPoint>Initial compatibility scores</BulletPoint>
            <BulletPoint>Quick overview</BulletPoint>
            <BulletPoint>Any generated full relationship analyses</BulletPoint>

            <Paragraph>This ensures your analysis loads instantly whenever you return to it.</Paragraph>
          </NumberedPoint>

          <NumberedPoint number="3" title="Chat Messages">
            <Paragraph>Stellium stores:</Paragraph>
            <BulletPoint>Your chat messages (questions)</BulletPoint>
            <BulletPoint>Stellium's answers</BulletPoint>
            <BulletPoint>Optional selected elements you attach to a question</BulletPoint>

            <Text style={[styles.subheading, { color: colors.onSurface }]}>This allows:</Text>
            <BulletPoint>Conversation history</BulletPoint>
            <BulletPoint>Context-aware responses</BulletPoint>
            <BulletPoint>Reopening past sessions</BulletPoint>
          </NumberedPoint>

          <NumberedPoint number="4" title="Your Credit Balance & Purchases">
            <Paragraph>We keep track of:</Paragraph>
            <BulletPoint>Credits added</BulletPoint>
            <BulletPoint>Credits spent</BulletPoint>
            <BulletPoint>Purchase receipts (for Apple compliance only)</BulletPoint>
            <BulletPoint>Subscription status</BulletPoint>

            <View style={[styles.highlightBox, { backgroundColor: colors.surfaceVariant }]}>
              <Paragraph>
                <Text style={{ fontWeight: '600' }}>We never store your payment card details.</Text>{'\n'}
                Apple handles all payment information.
              </Paragraph>
            </View>
          </NumberedPoint>

          <NumberedPoint number="5" title="Basic App Analytics">
            <Paragraph>We collect anonymized usage patterns such as:</Paragraph>
            <BulletPoint>Which features are used</BulletPoint>
            <BulletPoint>How often analyses are generated</BulletPoint>
            <BulletPoint>Error logs (crashes)</BulletPoint>

            <Paragraph>No personally identifiable data is included.</Paragraph>
          </NumberedPoint>
        </Section>

        {/* How is my data used in AI processing? */}
        <Section title="🤖 How is my data used in AI processing?">
          <NumberedPoint number="1" title="AI models use your chart data only for generating responses">
            <Paragraph>Your:</Paragraph>
            <BulletPoint>birth details</BulletPoint>
            <BulletPoint>chart structure</BulletPoint>
            <BulletPoint>synastry aspects</BulletPoint>
            <BulletPoint>selected elements</BulletPoint>
            <BulletPoint>questions</BulletPoint>

            <Paragraph>
              …are sent to the AI model only while generating your analysis or responses.
            </Paragraph>
          </NumberedPoint>

          <NumberedPoint number="2" title="Data is not used to train AI models">
            <Paragraph>Your chart and chat content:</Paragraph>
            <BulletPoint>is not reused</BulletPoint>
            <BulletPoint>is not added to training datasets</BulletPoint>
            <BulletPoint>is not visible to other users</BulletPoint>

            <Paragraph>This is important for App Store compliance and user trust.</Paragraph>
          </NumberedPoint>
        </Section>

        {/* Can I delete my data? */}
        <Section title="🧹 Can I delete my data?">
          <Paragraph>
            <Text style={[styles.bold, { color: colors.onSurface }]}>Yes.</Text>
          </Paragraph>

          <Text style={[styles.subheading, { color: colors.onSurface }]}>Delete a chart:</Text>
          <Paragraph>
            You can delete any chart (yours or a guest chart) from the Birth Charts screen.
          </Paragraph>

          <Text style={[styles.subheading, { color: colors.onSurface }]}>Delete a relationship:</Text>
          <Paragraph>
            You can delete any relationship from the Relationships tab.
          </Paragraph>

          <Text style={[styles.subheading, { color: colors.onSurface }]}>Delete your account (and all data):</Text>
          <Paragraph>Send an email to: support@stellium.ai</Paragraph>

          <Paragraph>We'll permanently remove:</Paragraph>
          <BulletPoint>your account</BulletPoint>
          <BulletPoint>all charts</BulletPoint>
          <BulletPoint>all relationships</BulletPoint>
          <BulletPoint>all analyses</BulletPoint>
          <BulletPoint>all chat history</BulletPoint>
          <BulletPoint>all usage data</BulletPoint>

          <Paragraph>A self-service account deletion option is planned.</Paragraph>
        </Section>

        {/* Do you share my data? */}
        <Section title="🌐 Do you share my data?">
          <Paragraph>
            <Text style={[styles.bold, { color: colors.onSurface }]}>No.</Text>
          </Paragraph>

          <Paragraph>We never sell or share:</Paragraph>
          <BulletPoint>Birth data</BulletPoint>
          <BulletPoint>Chat messages</BulletPoint>
          <BulletPoint>Chart information</BulletPoint>
          <BulletPoint>Purchase history</BulletPoint>

          <Paragraph>The only external services involved are:</Paragraph>
          <BulletPoint>Apple (for payments & receipts)</BulletPoint>
          <BulletPoint>OpenAI (for generating the text of your analyses & chat responses)</BulletPoint>
        </Section>

        {/* Why does Stellium need to store birth data at all? */}
        <Section title="⚠️ Why does Stellium need to store birth data at all?">
          <Paragraph>
            Because the entire app depends on astrologically accurate calculations:
          </Paragraph>
          <BulletPoint>Changing birth data shifts the entire chart</BulletPoint>
          <BulletPoint>Relationship charts depend on two birth charts</BulletPoint>
          <BulletPoint>Full analyses reference dozens of placements</BulletPoint>
          <BulletPoint>Chat context uses planetary/housing patterns</BulletPoint>
          <BulletPoint>Future transits require the original birth chart</BulletPoint>

          <Paragraph>Without saving your data, the app simply wouldn't work.</Paragraph>
        </Section>

        {/* How long does Stellium store my data? */}
        <Section title="🛡️ How long does Stellium store my data?">
          <Paragraph>
            We retain your data as long as your account exists, so you can return to your charts and analyses anytime.
          </Paragraph>
          <Paragraph>You can request deletion at any time.</Paragraph>
        </Section>

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
  mainHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
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
  numberedSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  numberedTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 22,
  },
  highlightBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DataUsageScreen;
