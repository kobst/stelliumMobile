import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { AskAspectRef, AskMessage } from '../store';

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function shortTypeLabel(type: AskAspectRef['type']): string {
  if (type === 'Synastry' || type === 'Aspect') return 'SYN';
  if (type === 'Composite' || type === 'Placement') return 'COM';
  return '';
}

export function IrisBubble({ message }: { message: AskMessage }) {
  const { colors } = useTheme();
  const paragraphs = message.text.split('\n\n');

  return (
    <View style={styles.irisWrap}>
      <View style={styles.irisHeader}>
        <View style={[styles.irisIcon, { backgroundColor: 'rgba(0, 220, 229, 0.14)' }]}>
          <Text style={[styles.irisIconText, { color: colors.tertiary }]}>✦</Text>
        </View>
        <Text style={[styles.authorLabel, { color: colors.text }]}>Iris</Text>
        <Text style={[styles.timeLabel, { color: colors.textSubtle }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
      <View
        style={[
          styles.irisBubble,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        {paragraphs.map((para, index) => (
          <Text
            key={index}
            style={[
              styles.irisText,
              { color: colors.text, marginTop: index > 0 ? 10 : 0 },
            ]}
          >
            {para}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function UserBubble({ message }: { message: AskMessage }) {
  const { colors } = useTheme();
  const contexts = message.contexts ?? [];

  return (
    <View style={styles.userWrap}>
      <View style={styles.userHeader}>
        <Text style={[styles.timeLabel, { color: colors.textSubtle }]}>
          {formatTime(message.createdAt)}
        </Text>
        <Text style={[styles.authorLabel, { color: colors.text }]}>You</Text>
      </View>
      {contexts.length > 0 ? (
        <View style={styles.contextRow}>
          {contexts.map((ctx) => (
            <View
              key={ctx.id}
              style={[
                styles.contextPill,
                { backgroundColor: 'rgba(233, 195, 73, 0.14)', borderColor: 'rgba(233, 195, 73, 0.25)' },
              ]}
            >
              <Text style={[styles.contextText, { color: colors.accent }]} numberOfLines={1}>
                {ctx.shortName}
              </Text>
              <Text style={[styles.contextKind, { color: colors.accent }]}>
                {shortTypeLabel(ctx.type)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View
        style={[
          styles.userBubble,
          {
            backgroundColor: 'rgba(202, 190, 255, 0.12)',
            borderColor: 'rgba(202, 190, 255, 0.18)',
          },
        ]}
      >
        <Text style={[styles.userText, { color: colors.text }]}>{message.text}</Text>
      </View>
    </View>
  );
}

export function TypingBubble() {
  const { colors } = useTheme();
  const pulses = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const loops = pulses.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(value, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [pulses]);

  return (
    <View style={styles.irisWrap}>
      <View style={styles.irisHeader}>
        <View style={[styles.irisIcon, { backgroundColor: 'rgba(0, 220, 229, 0.14)' }]}>
          <Text style={[styles.irisIconText, { color: colors.tertiary }]}>✦</Text>
        </View>
        <Text style={[styles.authorLabel, { color: colors.text }]}>Iris</Text>
      </View>
      <View
        style={[
          styles.irisBubble,
          styles.typingBubble,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        {pulses.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                backgroundColor: colors.primary,
                opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
                transform: [
                  {
                    scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  irisWrap: {
    marginBottom: 18,
  },
  irisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  irisIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  irisIconText: {
    fontSize: 12,
  },
  authorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 10.5,
  },
  irisBubble: {
    marginLeft: 34,
    borderWidth: 1,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  irisText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 16,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  userWrap: {
    marginBottom: 18,
    alignItems: 'flex-end',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 6,
    maxWidth: '85%',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  contextText: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 160,
  },
  contextKind: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  userBubble: {
    borderWidth: 1,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
  },
  userText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
