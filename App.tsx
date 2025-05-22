/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from 'react-native';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('./assets/stars-bg.jpg')}
        style={styles.backgroundImage}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Stellium</Text>
          <Text style={styles.subtitle}>
            Your Personal AI Astrology Guide
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default App;
