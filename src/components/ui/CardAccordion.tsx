import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../theme';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface CardAccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  style?: any;
  headerIcon?: string;
  lazyLoad?: boolean;
}

const CardAccordion: React.FC<CardAccordionProps> = ({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  onExpand,
  onCollapse,
  style,
  headerIcon,
  lazyLoad = false,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasLoaded, setHasLoaded] = useState(!lazyLoad || defaultExpanded);
  const rotateValue = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;

    // Configure layout animation
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    setIsExpanded(newExpandedState);

    // Animate chevron rotation
    Animated.timing(rotateValue, {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (newExpandedState) {
      if (lazyLoad && !hasLoaded) {
        setHasLoaded(true);
      }
      onExpand?.();
    } else {
      onCollapse?.();
    }
  };

  const chevronRotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const collapsedHeight = 56;

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
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: colors.accentPrimary }]} />

      {/* Header */}
      <TouchableOpacity
        style={[
          styles.header,
          { minHeight: collapsedHeight },
          !isExpanded && { height: collapsedHeight },
        ]}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${title}. ${isExpanded ? 'Collapse' : 'Expand'} section`}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              {headerIcon && (
                <Text style={[styles.headerIcon, { color: colors.onSurfaceHigh }]}>
                  {headerIcon}
                </Text>
              )}
              <Text style={[styles.title, { color: colors.onSurfaceHigh }]}>
                {title}
              </Text>
            </View>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.onSurfaceMed }]}>
                {subtitle}
              </Text>
            )}
          </View>

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
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={styles.content}>
          {hasLoaded ? children : (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.onSurfaceMed }]}>
                Loading...
              </Text>
            </View>
          )}
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
  accentBar: {
    height: 4,
    width: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 16,
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
    paddingBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
});

export default CardAccordion;
