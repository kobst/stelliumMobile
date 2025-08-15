import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { useTheme } from '../../../theme';

interface BirthLocationStepProps {
  placeQuery: string;
  suggestions: any[];
  placeOfBirth: string;
  onPlaceQueryChange: (text: string) => void;
  onPlaceSelect: (place: any) => void;
}

export const BirthLocationStep: React.FC<BirthLocationStepProps> = ({
  placeQuery,
  suggestions,
  placeOfBirth,
  onPlaceQueryChange,
  onPlaceSelect,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <WizardStep
      title="Where were you born?"
      subtitle="Your birth location helps us calculate the precise positions of celestial bodies"
      icon="🌍"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Birth location</Text>
        <TextInput
          style={styles.input}
          placeholder="City, Country"
          placeholderTextColor={colors.onSurfaceVariant}
          value={placeQuery}
          onChangeText={onPlaceQueryChange}
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
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>
                    {suggestion.description}
                  </Text>
                  <Text style={styles.suggestionIcon}>📍</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {placeOfBirth && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedLocationHeader}>
              <Text style={styles.selectedLocationIcon}>✅</Text>
              <Text style={styles.selectedLocationLabel}>Selected location:</Text>
            </View>
            <Text style={styles.selectedLocationText}>{placeOfBirth}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 We use this to determine your local time zone and calculate accurate planetary positions for your birth moment
        </Text>
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formGroup: {
    marginBottom: 32,
  },
  label: {
    color: colors.onBackground,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestion: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    color: colors.onSurface,
    fontSize: 16,
    flex: 1,
  },
  suggestionIcon: {
    fontSize: 16,
    marginLeft: 12,
  },
  selectedLocationContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLocationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedLocationLabel: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLocationText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
