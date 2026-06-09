import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme';
import { CreditActionButton } from '../ui/CreditActionButton';

interface WizardContainerProps {
  children: ReactNode[];
  totalSteps: number;
  onComplete: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  completeButtonText?: string;
  creditCost?: number;
  isCheckingCredits?: boolean;
  isLoading?: boolean;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  children,
  totalSteps,
  onComplete,
  canGoBack = true,
  canGoNext = true,
  nextButtonText = 'Next',
  backButtonText = 'Back',
  currentStep: externalCurrentStep,
  onStepChange,
  completeButtonText = 'Create My Chart',
  creditCost,
  isCheckingCredits = false,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);

  const currentStep = externalCurrentStep !== undefined ? externalCurrentStep : internalCurrentStep;

  const styles = createStyles(colors);

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      if (onStepChange) {
        onStepChange(nextStep);
      } else {
        setInternalCurrentStep(nextStep);
      }
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (onStepChange) {
        onStepChange(prevStep);
      } else {
        setInternalCurrentStep(prevStep);
      }
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header: back arrow, app title, progress bar, step counter */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          {!isFirstStep && canGoBack ? (
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={goBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.headerBackArrow}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBackButton} />
          )}
          <Text style={styles.headerTitle}>Iris</Text>
          <View style={styles.headerBackButton} />
        </View>

        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDash,
                i === currentStep && styles.progressDashActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepCounterText}>
          STEP {currentStep + 1} OF {totalSteps}
        </Text>
      </View>

      {/* Steps Container */}
      <View style={styles.stepsContainer}>
        {children[currentStep]}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {isLastStep && creditCost !== undefined ? (
          <>
            {!isFirstStep && canGoBack && (
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>{backButtonText}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.spacer} />
            <CreditActionButton
              cost={creditCost}
              actionText={isCheckingCredits ? 'Checking credits...' : isLoading ? 'Creating...' : completeButtonText}
              onPress={goNext}
              disabled={!canGoNext}
              loading={isCheckingCredits || isLoading}
            />
          </>
        ) : (
          <>
            {!isFirstStep && canGoBack && (
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>{backButtonText}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canGoNext && styles.nextButtonDisabled,
              ]}
              onPress={goNext}
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? completeButtonText : nextButtonText}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepsContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  headerBackButton: {
    width: 36,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBackArrow: {
    fontSize: 24,
    color: colors.onBackground,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.onBackground,
    textAlign: 'center',
    letterSpacing: 3,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  progressDash: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
    backgroundColor: colors.strokeMedium,
  },
  progressDashActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  stepCounterText: {
    fontSize: 11,
    color: colors.onSurfaceLow,
    fontWeight: '600',
    letterSpacing: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButtonText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: colors.onSurfaceLow,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
