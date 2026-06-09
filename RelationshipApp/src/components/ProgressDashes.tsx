import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

interface ProgressDashesProps {
  current: number;
  total: number;
}

export function ProgressDashes({ current, total }: ProgressDashesProps) {
  const { colors } = useTheme();
  if (total <= 0) {
    return null;
  }
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => {
        const isActive = index === current;
        return (
          <View
            key={index}
            style={[
              styles.dash,
              { backgroundColor: colors.surfaceHigh },
              isActive
                ? {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 6,
                    elevation: 6,
                  }
                : null,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
  },
});
