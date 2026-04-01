import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { RELATIONSHIP_CLUSTERS } from '../../../shared/domain/relationship';

type Props = StackScreenProps<RelationshipRootParamList, 'RelationshipPreview'>;

export const RelationshipPreviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.clusterRow}>
        {RELATIONSHIP_CLUSTERS.map((cluster) => (
          <View
            key={cluster.key}
            style={[
              styles.clusterCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.clusterLabel, { color: colors.text }]}>{cluster.label}</Text>
            <Text style={[styles.clusterValue, { color: colors.primary }]}>--</Text>
          </View>
        ))}
      </View>

      <PlaceholderScreen
        eyebrow="Preview"
        title="Compatibility preview and score summary."
        body="This screen will render the free result payload: overall score, category bars, short overview, one free question entry point, and the unlock teaser for the full relationship analysis."
        primaryLabel="See Unlock Flow"
        secondaryLabel="Go Home"
        onPrimaryPress={() => navigation.navigate('Unlock')}
        onSecondaryPress={() => navigation.navigate('Main')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clusterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  clusterCard: {
    borderRadius: 14,
    borderWidth: 1,
    minWidth: '30%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clusterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  clusterValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
});
