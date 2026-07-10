import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { recordError } from '../services/crashReporting';

interface CrashFallbackProps {
  onRestart: () => void;
}

const CrashFallback: React.FC<CrashFallbackProps> = ({ onRestart }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Iris hit an unexpected error. Restart to pick up where you left off.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRestart}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>Restart</Text>
      </Pressable>
    </View>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  generation: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, generation: 0 };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    recordError(error, info.componentStack ?? undefined);
  }

  handleRestart = (): void => {
    // Bumping generation remounts the subtree so the app boots fresh.
    this.setState(prev => ({ hasError: false, generation: prev.generation + 1 }));
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <CrashFallback onRestart={this.handleRestart} />;
    }
    return <React.Fragment key={this.state.generation}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 28,
    paddingVertical: 14,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
