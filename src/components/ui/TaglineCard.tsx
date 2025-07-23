import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface TaglineCardProps {
  phrase: string;
  style?: any;
}

const TaglineCard: React.FC<TaglineCardProps> = ({
  phrase,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant,
          borderColor: colors.strokeSubtle,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>💫</Text>
        <Text style={[styles.phrase, { color: colors.onSurfaceHigh }]}>
          {phrase}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  phrase: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default TaglineCard;
