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
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Steps Container */}
      <View style={styles.stepsContainer}>
        {children[currentStep]}
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
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressText: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepsContainer: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.onSurfaceLow,
    opacity: 0.6,
  },
  nextButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});