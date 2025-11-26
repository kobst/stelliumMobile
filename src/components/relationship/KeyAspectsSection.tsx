import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClusterScoredItem } from '../../api/relationships';
import AspectCard from './AspectCard';

interface KeyAspectsSectionProps {
  title: string;
  aspectCodes: string[];
  consolidatedItems: ClusterScoredItem[];
  colors: any;
  userAName?: string;
  userBName?: string;
}

const KeyAspectsSection: React.FC<KeyAspectsSectionProps> = ({
  title,
  aspectCodes,
  consolidatedItems,
  colors,
  userAName = 'Person A',
  userBName = 'Person B',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter consolidatedItems to match the aspectCodes
  const keyAspects = consolidatedItems.filter(item =>
    aspectCodes.includes(item.code)
  );

  // Don't render if there are no key aspects
  if (keyAspects.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {/* Collapsible Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.surface }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
          <Text style={[styles.headerCount, { color: colors.onSurfaceVariant }]}>
            ({keyAspects.length})
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Content */}
      {isExpanded && (
        <View style={styles.content}>
          {keyAspects.map((item, index) => (
            <View key={item.id} style={styles.cardWrapper}>
              <AspectCard
                item={item}
                colors={colors}
                isSelected={false}
                showSelection={false}
                userAName={userAName}
                userBName={userBName}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  cardWrapper: {
    marginBottom: 8,
  },
});

export default KeyAspectsSection;
