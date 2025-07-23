import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface BulletProps {
  children: React.ReactNode;
  style?: any;
}

const Bullet: React.FC<BulletProps> = ({
  children,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.bullet, { color: colors.accentPrimary }]}>•</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
});

export default Bullet;
