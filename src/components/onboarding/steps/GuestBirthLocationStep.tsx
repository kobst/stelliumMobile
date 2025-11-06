import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { useTheme } from '../../../theme';

interface GuestBirthLocationStepProps {
  placeQuery: string;
  suggestions: any[];
  placeOfBirth: string;
  onPlaceQueryChange: (text: string) => void;
  onPlaceSelect: (place: any) => void;
}

export const GuestBirthLocationStep: React.FC<GuestBirthLocationStepProps> = ({
  placeQuery,
  suggestions,
  placeOfBirth,
  onPlaceQueryChange,
  onPlaceSelect,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <WizardStep
      title="Where were they born?"
      subtitle="Birthplace helps calculate accurate planetary positions"
    >
      <View style={styles.formGroup}>
        {(isFocused || placeQuery) && (
          <Text style={styles.label}>Birth Location</Text>
        )}
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder="City, Country"
          placeholderTextColor={colors.onSurfaceVariant}
          value={placeQuery}
          onChangeText={onPlaceQueryChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.place_id || index}
                style={styles.suggestion}
                onPress={() => onPlaceSelect(suggestion)}
              >
                <Text style={styles.suggestionText}>
                  {suggestion.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {placeOfBirth && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedLocationLabel}>Selected location</Text>
              <Text style={styles.selectedLocationText}>{placeOfBirth}</Text>
            </View>
          </View>
        )}
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formGroup: {
    marginBottom: 24,
  },
  label: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsContainer: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestion: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    gap: 14,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedLocationLabel: {
    color: colors.onSurfaceMed,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectedLocationText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
});
