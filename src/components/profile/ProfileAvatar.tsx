import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { User, SubjectDocument } from '../../types';

interface ProfileAvatarProps {
  size?: number;
  showOnlineIndicator?: boolean;
  subject?: User | SubjectDocument | null; // Optional subject to display instead of home user
  onPress?: () => void; // Optional custom onPress handler
  onLongPress?: () => void; // Optional custom onLongPress handler
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = 40,
  showOnlineIndicator = true,
  subject,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();
  const { userData, setProfileModalVisible } = useStore();
  const [imageError, setImageError] = useState(false);

  // Use provided subject or fallback to home user
  const displaySubject = subject || userData;

  // Reset image error when subject or profile photo URL changes
  useEffect(() => {
    setImageError(false);
  }, [displaySubject?.id, displaySubject?.profilePhotoUrl]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getName = (subject: any): string => {
    if (!subject) return 'U';

    // Handle SubjectDocument type
    if (subject.firstName && subject.lastName) {
      return `${subject.firstName} ${subject.lastName}`;
    }

    // Handle User type
    if (subject.name) {
      return subject.name;
    }

    return 'U';
  };

  const getProfilePhotoUrl = (subject: any): string | null => {
    if (!subject?.profilePhotoUrl) return null;

    // Add cache busting timestamp if available
    if (subject.profilePhotoUpdatedAt) {
      const timestamp = new Date(subject.profilePhotoUpdatedAt).getTime();
      return `${subject.profilePhotoUrl}?v=${timestamp}`;
    }

    return subject.profilePhotoUrl;
  };

  const name = getName(displaySubject);
  const initials = getInitials(name);
  const profilePhotoUrl = getProfilePhotoUrl(displaySubject);
  const shouldShowImage = profilePhotoUrl && !imageError;

  const dynamicStyles = {
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    onlineIndicator: {
      width: size * 0.25,
      height: size * 0.25,
      borderRadius: size * 0.125,
      right: size * 0.05,
      bottom: size * 0.05,
    },
  };

  const handlePress = () => {
    // If onLongPress is provided (edit functionality), use it as the primary press handler
    if (onLongPress) {
      onLongPress();
    } else if (onPress) {
      onPress();
    } else if (!subject) {
      // Only open profile modal for home user
      setProfileModalVisible(true);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!onPress && !onLongPress && !!subject} // Disable if subject is provided and no custom handlers
    >
      <View style={styles.avatarWrapper}>
        <View style={[
          styles.avatar,
          dynamicStyles.avatar,
          { backgroundColor: shouldShowImage ? 'transparent' : colors.primary },
        ]}>
          {shouldShowImage ? (
            <Image
              source={{ uri: profilePhotoUrl }}
              style={[styles.image, dynamicStyles.avatar]}
              onLoad={() => console.log('✅ Image loaded:', profilePhotoUrl)}
              onError={(e) => {
                console.log('❌ Image error:', profilePhotoUrl);
                console.log('Error details:', e.nativeEvent);
                setImageError(true);
              }}
            />
          ) : (
            <Text style={[
              styles.initials,
              {
                color: colors.onPrimary,
                fontSize: size * 0.4,
              },
            ]}>
              {initials}
            </Text>
          )}
        </View>

        {showOnlineIndicator && !subject && (
          <View style={[
            styles.onlineIndicator,
            dynamicStyles.onlineIndicator,
            {
              backgroundColor: '#00C851',
              borderColor: colors.surface,
            },
          ]} />
        )}
      </View>

      {/* Camera Icon - positioned at bottom right */}
      {onLongPress && (
        <View style={[
          styles.cameraIconContainer,
          {
            right: -size * 0.15,
            bottom: -size * 0.2,
          }
        ]}>
          <Svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke={colors.onSurfaceVariant}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx="12"
              cy="13"
              r="4"
              stroke={colors.onSurfaceVariant}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cameraIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileAvatar;
