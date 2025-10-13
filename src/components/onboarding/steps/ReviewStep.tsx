import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { useTheme } from '../../../theme';

interface ReviewStepProps {
  firstName: string;
  lastName: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  amPm: 'AM' | 'PM';
  unknownTime: boolean;
  placeOfBirth: string;
  profileImageUri?: string | null;
  onEditStep: (stepIndex: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  firstName,
  lastName,
  gender,
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  birthMinute,
  amPm,
  unknownTime,
  placeOfBirth,
  profileImageUri,
  onEditStep,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const formatGender = (gender: string) => {
    switch (gender) {
      case 'male': return 'Male (he/him)';
      case 'female': return 'Female (she/her)';
      case 'nonbinary': return 'Non-binary (they/them)';
      default: return 'Not specified';
    }
  };

  const formatDate = () => {
    if (!birthYear || !birthMonth || !birthDay) {return 'Not specified';}
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const month = monthNames[parseInt(birthMonth) - 1] || birthMonth;
    return `${month} ${birthDay}, ${birthYear}`;
  };

  const formatTime = () => {
    if (unknownTime) {return 'Unknown time';}
    if (!birthHour || !birthMinute) {return 'Not specified';}
    return `${birthHour}:${birthMinute.padStart(2, '0')} ${amPm}`;
  };

  const ReviewSection: React.FC<{
    label: string;
    value: string;
    onEdit: () => void;
  }> = ({ label, value, onEdit }) => (
    <View style={styles.reviewSection}>
      <View style={styles.reviewHeader}>
        <View style={styles.labelContainer}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.reviewLabel}>{label}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );

  return (
    <WizardStep
      title="Review your information"
      subtitle="Make sure everything looks correct before we create your personalized chart"
    >
      <View style={styles.reviewContainer}>
        {/* Name & Gender with Profile Photo */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <View style={styles.labelContainer}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.reviewLabel}>Name & Gender</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => onEditStep(0)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nameGenderContent}>
            {profileImageUri && (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profilePhoto}
              />
            )}
            <View style={styles.nameGenderText}>
              <Text style={styles.reviewValue}>{firstName} {lastName}</Text>
              <Text style={styles.reviewValue}>{formatGender(gender)}</Text>
            </View>
          </View>
        </View>

        <ReviewSection
          label="Birth Location"
          value={placeOfBirth || 'Not specified'}
          onEdit={() => onEditStep(1)}
        />

        <ReviewSection
          label="Birth Date & Time"
          value={`${formatDate()}\n${formatTime()}`}
          onEdit={() => onEditStep(2)}
        />
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  reviewContainer: {
    gap: 20,
  },
  reviewSection: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceMed,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 16,
    color: colors.onSurface,
    lineHeight: 24,
    fontWeight: '600',
  },
  nameGenderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
  },
  nameGenderText: {
    flex: 1,
  },
});
