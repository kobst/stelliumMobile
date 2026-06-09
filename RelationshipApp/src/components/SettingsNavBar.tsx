import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';

interface SettingsNavBarProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
}

export function SettingsNavBar({ title, onBack, backLabel = 'Back' }: SettingsNavBarProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.textMuted }]}>← {backLabel}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  backBtn: {
    minWidth: 70,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  spacer: {
    width: 70,
  },
});
