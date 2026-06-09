import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { getBigThree } from '../utils/mainShell';
import { PlacementChip, type PlacementLabel } from './PlacementChip';

interface SignsRowProps {
  profile: RelationshipAppProfile | null | undefined;
}

interface Item {
  sign: string;
  label: PlacementLabel;
}

export function SignsRow({ profile }: SignsRowProps) {
  const { sun, moon, rising } = getBigThree(profile);

  const items: Item[] = [
    sun ? { sign: sun, label: 'Sun' as const } : null,
    moon ? { sign: moon, label: 'Moon' as const } : null,
    rising ? { sign: rising, label: 'Rising' as const } : null,
  ].filter((item): item is Item => item !== null);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.cell}>
          <PlacementChip sign={item.sign} label={item.label} compact />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cell: {
    flexShrink: 1,
    minWidth: 0,
  },
});
