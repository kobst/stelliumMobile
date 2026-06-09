import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 24;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.72);
const CARD_GAP = 14;
const PHOTO_HEIGHT = Math.round(CARD_WIDTH * 0.95);
const SKELETON_CARD_COUNT = 3;

interface CelebMatchSkeletonProps {
  baseColor: string;
  highlightColor: string;
}

export function CelebMatchSkeleton({
  baseColor,
  highlightColor,
}: CelebMatchSkeletonProps): React.ReactElement {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const animatedOverlayStyle = {
    opacity: shimmer.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.55, 0],
    }),
  };

  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            styles.card,
            index === SKELETON_CARD_COUNT - 1 && styles.cardLast,
          ]}
        >
          <View style={[styles.photo, { backgroundColor: baseColor }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: highlightColor },
                animatedOverlayStyle,
              ]}
            />
          </View>
          <View style={styles.meta}>
            <View style={[styles.line, styles.lineLong, { backgroundColor: baseColor }]}>
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: highlightColor },
                  animatedOverlayStyle,
                ]}
              />
            </View>
            <View style={[styles.line, styles.lineShort, { backgroundColor: baseColor }]}>
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: highlightColor },
                  animatedOverlayStyle,
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -CARD_PADDING,
  },
  content: {
    paddingHorizontal: CARD_PADDING,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardLast: {
    marginRight: 0,
  },
  photo: {
    width: CARD_WIDTH,
    height: PHOTO_HEIGHT,
    overflow: 'hidden',
  },
  meta: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  line: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  lineLong: {
    width: '75%',
  },
  lineShort: {
    width: '45%',
  },
});
