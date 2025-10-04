import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme';

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

      {/* Progress Dots at Bottom */}
      <View style={styles.progressDotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
              index === currentStep && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
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
            {isLastStep ? 'Create My Chart' : nextButtonText}
          </Text>
        </TouchableOpacity>
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
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  progressDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    opacity: 1,
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
