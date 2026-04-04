import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { externalApi, PlaceDetails, PlaceSuggestion } from '../api';
import { useTheme } from '../theme';

interface PlaceAutocompleteInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSelectSuggestion: (selection: PlaceDetails) => void | Promise<void>;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  errorText?: string | null;
  canUseSuggestions: boolean;
}

function createSessionToken(): string {
  return Math.random().toString(36).slice(2, 18);
}

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChangeText,
  onSelectSuggestion,
  onBlur,
  placeholder = 'City, state, country',
  disabled = false,
  helperText,
  errorText,
  canUseSuggestions,
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const sessionTokenRef = React.useRef(createSessionToken());

  React.useEffect(() => {
    if (!canUseSuggestions || disabled) {
      setSuggestions([]);
      setIsLoading(false);
      setLookupError(null);
      return;
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      setLookupError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        setLookupError(null);
        const nextSuggestions = await externalApi.fetchPlaceSuggestions(
          trimmedValue,
          sessionTokenRef.current
        );
        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
          setLookupError(
            error instanceof Error ? error.message : 'Place suggestions are unavailable right now.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [canUseSuggestions, disabled, value]);

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    onChangeText(suggestion.description);
    setSuggestions([]);
    setIsFocused(false);
    setLookupError(null);

    const details = await externalApi.fetchPlaceDetails(
      suggestion.placeId,
      sessionTokenRef.current
    );
    sessionTokenRef.current = createSessionToken();
    await onSelectSuggestion(details);
  };

  return (
    <View style={styles.container}>
      <View>
        <TextInput
          value={value}
          onChangeText={(nextValue) => {
            onChangeText(nextValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
            }, 120);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : null}
      </View>

      {canUseSuggestions && isFocused && suggestions.length > 0 ? (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.placeId}
              style={styles.option}
              onPress={() => {
                handleSelect(suggestion).catch((error) => {
                  setLookupError(
                    error instanceof Error
                      ? error.message
                      : 'Could not load full place details.'
                  );
                });
              }}
            >
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {suggestion.primaryText}
              </Text>
              {suggestion.secondaryText ? (
                <Text style={[styles.optionBody, { color: colors.textMuted }]}>
                  {suggestion.secondaryText}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {helperText ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}

      {errorText ? (
        <Text style={[styles.error, { color: colors.primary }]}>{errorText}</Text>
      ) : lookupError ? (
        <Text style={[styles.error, { color: colors.primary }]}>{lookupError}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingRight: 44,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
});
