import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface ClusterChip {
  id: string;
  emoji: string;
  label: string;
  score: number;
}

interface ClusterChipRowProps {
  clusters: ClusterChip[];
  selectedCluster: string | null;
  onSelectCluster: (clusterId: string) => void;
  style?: any;
}

const ClusterChipRow: React.FC<ClusterChipRowProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.strokeSubtle }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {clusters.map((cluster) => {
          const isSelected = selectedCluster === cluster.id;
          return (
            <TouchableOpacity
              key={cluster.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceCard,
                  borderColor: isSelected ? colors.primary : colors.strokeSubtle,
                },
              ]}
              onPress={() => onSelectCluster(cluster.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cluster.label} ${cluster.score}%`}
            >
              <Text style={styles.chipEmoji}>{cluster.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isSelected ? colors.onPrimary : colors.onSurface },
                ]}
              >
                {cluster.label}
              </Text>
              <Text
                style={[
                  styles.chipScore,
                  { color: isSelected ? colors.onPrimary : colors.primary },
                ]}
              >
                {cluster.score}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipScore: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ClusterChipRow;
