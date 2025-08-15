import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
    if (unknownTime) {return 'Unknown time (solar chart)';}
    if (!birthHour || !birthMinute) {return 'Not specified';}
    return `${birthHour}:${birthMinute.padStart(2, '0')} ${amPm}`;
  };

  const ReviewSection: React.FC<{
    title: string;
    value: string;
    onEdit: () => void;
    icon: string;
  }> = ({ title, value, onEdit, icon }) => (
    <View style={styles.reviewSection}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewTitleContainer}>
          <Text style={styles.reviewIcon}>{icon}</Text>
          <Text style={styles.reviewTitle}>{title}</Text>
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
      icon="⭐"
    >
      <View style={styles.reviewContainer}>
        <ReviewSection
          title="Name & Gender"
          value={`${firstName} ${lastName}\n${formatGender(gender)}`}
          onEdit={() => onEditStep(0)}
          icon="👤"
        />

        <ReviewSection
          title="Birth Date & Time"
          value={`${formatDate()}\n${formatTime()}`}
          onEdit={() => onEditStep(1)}
          icon="📅"
        />

        <ReviewSection
          title="Birth Location"
          value={placeOfBirth || 'Not specified'}
          onEdit={() => onEditStep(2)}
          icon="📍"
        />
      </View>

      <View style={styles.finalMessageContainer}>
        <Text style={styles.finalMessage}>
          ✨ Ready to discover your cosmic blueprint? Your personalized astrological chart awaits!
        </Text>
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  reviewContainer: {
    gap: 20,
    marginBottom: 32,
  },
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
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
    color: colors.onSurfaceMed,
    lineHeight: 24,
  },
  finalMessageContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  finalMessage: {
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});
