import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { SERIF_FONT } from '../theme/typography';
import { Stardust } from './atmosphere/Stardust';
import { Halo } from './atmosphere/Halo';
import { LoaderEmblem } from './onboarding/LoaderEmblem';
import { ONB } from './onboarding/atoms';

interface SubmittingOverlayProps {
  title: string;
  subtitle: string;
}

export function SubmittingOverlay({ title, subtitle }: SubmittingOverlayProps) {
  return (
    <View style={styles.root}>
      <Stardust density={55} seed={5} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.emblemWrap}>
            <Halo color={ONB.gold} size={260} opacity={0.2} top={-30} left="50%" />
            <LoaderEmblem />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ONB.surface,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emblemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
    color: ONB.text,
    textAlign: 'center',
    marginTop: 36,
  },
  subtitle: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    color: ONB.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
