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
      {/* Steps Container */}
      <View style={styles.stepsContainer}>
        {children[currentStep]}
      </View>

      {/* Step Counter Text */}
      <View style={styles.stepCounterContainer}>
        <Text style={styles.stepCounterText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
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
  stepCounterContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  stepCounterText: {
    fontSize: 14,
    color: colors.onSurfaceMed,
    fontWeight: '500',
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
