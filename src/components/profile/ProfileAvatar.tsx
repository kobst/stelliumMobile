import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import { useStore } from '../../store';

interface ProfileAvatarProps {
  size?: number;
  showOnlineIndicator?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = 40,
  showOnlineIndicator = true,
}) => {
  const { colors } = useTheme();
  const { userData, setProfileModalVisible } = useStore();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const initials = userData?.name ? getInitials(userData.name) : 'U';

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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => setProfileModalVisible(true)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.avatar,
        dynamicStyles.avatar,
        { backgroundColor: colors.primary },
      ]}>
        <Text style={[
          styles.initials,
          {
            color: colors.onPrimary,
            fontSize: size * 0.4,
          },
        ]}>
          {initials}
        </Text>
      </View>

      {showOnlineIndicator && (
        <View style={[
          styles.onlineIndicator,
          dynamicStyles.onlineIndicator,
          {
            backgroundColor: '#00C851',
            borderColor: colors.surface,
          },
        ]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default ProfileAvatar;
