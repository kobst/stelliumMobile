import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';

interface WizardStepProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  contentContainerStyle?: any;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  title,
  subtitle,
  icon,
  children,
  contentContainerStyle,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.formContainer}>
        {children}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.onBackground,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceMed,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formContainer: {
    flex: 1,
  },
});
