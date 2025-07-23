import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../theme';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AccordionCardProps {
  emoji: string;
  label: string;
  score: number;
  children: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  style?: any;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
  emoji,
  label,
  score,
  children,
  isExpanded,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const rotateValue = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    // Animate chevron rotation
    Animated.timing(rotateValue, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const chevronRotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const scoreBarWidth = `${Math.max(5, Math.min(100, score))}%`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.strokeSubtle,
          shadowColor: isExpanded ? colors.shadowElev1 : colors.shadowNone,
          elevation: isExpanded ? 2 : 0,
        },
        style,
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${label}. Score: ${score}%. ${isExpanded ? 'Collapse' : 'Expand'} section`}
      >
        <View style={styles.headerContent}>
          {/* Emoji */}
          <Text style={styles.emoji}>{emoji}</Text>

          {/* Label and Score */}
          <View style={styles.labelScoreContainer}>
            <Text style={[styles.label, { color: colors.onSurfaceHigh }]}>
              {label}
            </Text>

            {/* Score Bar - only show if score > 0 */}
            {score > 0 && (
              <View style={[styles.scoreBarContainer, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.scoreBar,
                    {
                      backgroundColor: colors.primary,
                      width: scoreBarWidth,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Score Text and Chevron */}
          <View style={styles.rightSection}>
            {score > 0 && (
              <Text style={[styles.scoreText, { color: colors.primary }]}>
                {score}%
              </Text>
            )}
            <Animated.View
              style={[
                styles.chevron,
                { transform: [{ rotate: chevronRotation }] },
              ]}
            >
              <Text style={[styles.chevronText, { color: colors.onSurfaceMed }]}>
                ⌄
              </Text>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={[styles.content, { borderTopColor: colors.strokeSubtle }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    overflow: 'hidden',
    // Shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  labelScoreContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
  chevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});

export default AccordionCard;
