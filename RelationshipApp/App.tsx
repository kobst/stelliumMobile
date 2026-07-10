import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PaywallSheet } from './src/components/PaywallSheet';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useBootstrapSession } from './src/hooks/useBootstrapSession';
import { useIrisRevenueCat } from './src/hooks/useIrisRevenueCat';

const AppContent: React.FC = () => {
  useBootstrapSession();
  useIrisRevenueCat();

  return (
    <>
      <RootNavigator />
      <PaywallSheet />
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
