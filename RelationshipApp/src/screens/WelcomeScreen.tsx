import React, { useCallback } from 'react';
import { Alert, Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { TERMS_URL, PRIVACY_POLICY_URL } from '../config/legal';
import { Stardust } from '../components/atmosphere/Stardust';
import { Halo } from '../components/atmosphere/Halo';
import { HeroEmblem } from '../components/onboarding/HeroEmblem';
import { OnbButton, ONB } from '../components/onboarding/atoms';
import { SERIF_FONT } from '../theme/typography';

type Props = StackScreenProps<RelationshipRootParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const openLegalLink = useCallback((url: string, fallbackLabel: string) => {
    return async () => {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert(fallbackLabel, `Unable to open ${url}.`);
      }
    };
  }, []);

  return (
    <View style={styles.root}>
      <Stardust density={55} seed={5} />
      <Halo color={ONB.primary} size={520} opacity={0.2} top={-40} left="50%" />
      <Halo color={ONB.cyan} size={360} opacity={0.08} top={260} left="22%" />
      <Halo color={ONB.gold} size={300} opacity={0.07} top={360} left="84%" />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.emblem}>
            <HeroEmblem />
          </View>

          <Text style={styles.wordmark}>Iris</Text>
          <Text style={styles.tagline}>
            The astrology of how you love — read in the space between two charts.
          </Text>

          <View style={styles.spacer} />

          <View style={styles.ctas}>
            <OnbButton
              label="Create your profile"
              variant="filled"
              onPress={() => navigation.navigate('CreateSelfProfile')}
            />
            <View style={{ height: 12 }} />
            <OnbButton
              label="I already have an account"
              variant="outline"
              onPress={() => navigation.navigate('SignIn')}
            />
            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text
                style={styles.termsStrong}
                accessibilityRole="link"
                onPress={openLegalLink(TERMS_URL, 'Terms of Service')}
              >
                Terms
              </Text>{' '}
              &{' '}
              <Text
                style={styles.termsStrong}
                accessibilityRole="link"
                onPress={openLegalLink(PRIVACY_POLICY_URL, 'Privacy Policy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ONB.surface,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emblem: {
    marginTop: 72,
  },
  wordmark: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 64,
    letterSpacing: -1,
    color: ONB.text,
    marginTop: 36,
  },
  tagline: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 27,
    color: ONB.textMuted,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  spacer: {
    flex: 1,
  },
  ctas: {
    width: '100%',
    paddingBottom: 14,
  },
  terms: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 11,
    lineHeight: 18,
    color: ONB.textFaint,
  },
  termsStrong: {
    color: ONB.textMuted,
    textDecorationLine: 'underline',
  },
});
