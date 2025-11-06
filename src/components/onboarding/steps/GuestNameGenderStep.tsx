import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { FloatingLabelInput } from '../FloatingLabelInput';
import { RadioButton } from '../RadioButton';
import { useTheme } from '../../../theme';
import { showImagePickerActionSheet, ImageResult } from '../../../utils/imageHelpers';

interface GuestNameGenderStepProps {
  firstName: string;
  lastName: string;
  gender: string;
  profileImageUri?: string | null;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onGenderChange: (gender: string) => void;
  onProfileImageChange: (uri: string | null, mimeType: string) => void;
}

export const GuestNameGenderStep: React.FC<GuestNameGenderStepProps> = ({
  firstName,
  lastName,
  gender,
  profileImageUri,
  onFirstNameChange,
  onLastNameChange,
  onGenderChange,
  onProfileImageChange,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleImageSelected = (imageResult: ImageResult) => {
    onProfileImageChange(imageResult.uri, imageResult.type);
  };

  const handleRemovePhoto = () => {
    onProfileImageChange(null, '');
  };

  const handlePhotoPress = () => {
    showImagePickerActionSheet(handleImageSelected, {
      includeCamera: true,
      includeRemove: !!profileImageUri,
      onRemove: handleRemovePhoto,
    });
  };

  return (
    <WizardStep
      title="Who is this chart for?"
      subtitle="Enter their name and select how they identify"
    >
      {/* Profile Photo Section */}
      <View style={styles.photoSection}>
        <TouchableOpacity
          style={[styles.photoContainer, { borderColor: colors.border }]}
          onPress={handlePhotoPress}
          activeOpacity={0.7}
        >
          {profileImageUri ? (
            <Image
              source={{ uri: profileImageUri }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={[styles.photoPlaceholderText, { color: colors.onSurfaceVariant }]}>
                Add Photo
              </Text>
              <Text style={[styles.photoPlaceholderIcon, { color: colors.onSurfaceVariant }]}>
                +
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.photoHint, { color: colors.onSurfaceLow }]}>
          Optional
        </Text>
      </View>

      <View style={styles.formGroup}>
        <FloatingLabelInput
          label="First Name"
          value={firstName}
          onChangeText={onFirstNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <FloatingLabelInput
          label="Last Name"
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Their gender/sex is</Text>
        <View style={styles.radioGroup}>
          <RadioButton
            selected={gender === 'male'}
            onPress={() => onGenderChange('male')}
            label="Male (he/him)"
          />
          <RadioButton
            selected={gender === 'female'}
            onPress={() => onGenderChange('female')}
            label="Female (she/her)"
          />
          <RadioButton
            selected={gender === 'nonbinary'}
            onPress={() => onGenderChange('nonbinary')}
            label="Non-binary (they/them)"
          />
        </View>
        <Text style={styles.privacyNote}>
          Used to personalize pronouns in readings
        </Text>
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    fontWeight: '300',
  },
  photoHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 28,
  },
  label: {
    color: colors.onBackground,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  radioGroup: {
    gap: 16,
  },
  privacyNote: {
    color: colors.onSurfaceLow,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});
