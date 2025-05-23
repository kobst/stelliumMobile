/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Button,
} from 'react-native';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AuthScreen from './AuthScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  if (!user) {
    return <AuthScreen />;
  }

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
          <Button title="Sign Out" onPress={() => auth().signOut()} />
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
