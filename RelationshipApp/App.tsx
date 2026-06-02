import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PaywallSheet } from './src/components/PaywallSheet';
import { useBootstrapSession } from './src/hooks/useBootstrapSession';
import { useIrisRevenueCat } from './src/hooks/useIrisRevenueCat';

const App: React.FC = () => {
  useBootstrapSession();
  useIrisRevenueCat();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
        <PaywallSheet />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
