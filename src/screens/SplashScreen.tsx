import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';

interface SplashScreenProps {
  onComplete: () => void;
}

// Hardcoded colors to match dark theme
const colors = {
  background: '#1C1B1F',     // Dark background
  text: '#E6E1E5',           // Light text
  accent: '#D0BCFF',         // Purple accent
};

const SplashScreen: React.FC<SplashScreenProps> = ({onComplete}) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete, fadeAnim]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
        <Text style={[styles.title, {color: colors.text}]}>Stellium</Text>
        <Text style={[styles.subtitle, {color: colors.accent}]}>
          Your AI Astrology Guide
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
  },
});

export default SplashScreen;
