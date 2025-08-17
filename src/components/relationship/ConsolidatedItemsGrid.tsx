import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoredItem, ClusterContribution, KeystoneAspect } from '../../api/relationships';

interface ConsolidatedItemsGridProps {
  scoredItems: ClusterScoredItem[];
  keystoneAspects?: KeystoneAspect[];
  onItemPress?: (item: ClusterScoredItem) => void;
  selectedItems?: ClusterScoredItem[];
  onChatAboutItem?: (item: ClusterScoredItem) => void;
}

type FilterType = 'keystones' | 'sparks' | 'topSupports' | 'topChallenges';

const CLUSTER_COLORS: { [key: string]: string } = {
  'Harmony': '#4CAF50',
  'Passion': '#F44336',
  'Connection': '#2196F3',
  'Stability': '#9C27B0',
  'Growth': '#FF9800',
};

const SPARK_TYPE_EMOJIS = {
  sexual: '🔥',
  transformative: '⚡️',
  intellectual: '🧠',
  emotional: '💖',
  power: '👑',
};

const ASPECT_SYMBOLS: { [key: string]: string } = {
  'conjunction': '☌',
  'sextile': '⚹',
  'square': '□',
  'trine': '∆',
  'opposition': '☍',
  'quincunx': '⚻',
};

// Parse aspect description to extract components
function parseAspectDescription(description: string, item: any) {
  // For composite aspects (between composite planets)
  if (item.source === 'composite') {
    if (item.aspect && item.planet1 && item.planet2) {
      return {
        type: 'composite-aspect',
        planet1: item.planet1,
        sign1: item.planet1Sign,
        aspect: item.aspect,
        planet2: item.planet2,
        sign2: item.planet2Sign,
      };
    }
  }

  // For composite house placements (composite planets in houses)
  if (item.source === 'compositeHousePlacement') {
    const compHouseMatch = description.match(/(\w+) in house (\d+)/i);
    if (compHouseMatch) {
      return {
        type: 'composite-house',
        planet: compHouseMatch[1],
        house: compHouseMatch[2],
        sign: item.planet1Sign || '',
      };
    }
  }

  // For synastry house placements (one person's planet in another's house)
  if (item.source === 'synastryHousePlacement') {
    const synHouseMatch = description.match(/(\w+)'s (\w+) in (\w+)'s (\d+)(?:th|nd|rd|st)? house/i);
    if (synHouseMatch) {
      return {
        type: 'synastry-house',
        person1: synHouseMatch[1],
        planet: synHouseMatch[2],
        person2: synHouseMatch[3],
        house: synHouseMatch[4],
      };
    }
  }

  // For synastry items with aspect data, use the structured data
  if (item.aspect && item.planet1 && item.planet2) {
    const person1Match = description.match(/^(\w+)'s/);
    const person1 = person1Match ? person1Match[1] : 'Person A';
    // Try to find the second person's name
    const person2Match = description.match(/(\w+)'s [^']+$/);
    const person2 = person2Match ? person2Match[1] : (person1 === 'Fullon' ? 'Mobile' : 'Fullon');

    return {
      type: 'aspect',
      person1,
      planet1: item.planet1,
      sign1: item.planet1Sign,
      aspect: item.aspect,
      person2,
      planet2: item.planet2,
      sign2: item.planet2Sign,
    };
  }

  // Parse house placements from description
  const housePlacementMatch = description.match(/(\w+)'s (\w+) in (\w+) their (\d+) house/);
  if (housePlacementMatch) {
    return {
      type: 'house',
      person1: housePlacementMatch[1],
      planet: housePlacementMatch[2],
      sign: housePlacementMatch[3],
      house: housePlacementMatch[4],
    };
  }

  // Fallback to original description
  return { type: 'unknown', description };
}

// Format card title based on parsed data
function formatCardTitle(parsedData: any, source: string) {
  if (parsedData.type === 'composite-aspect') {
    const symbol = ASPECT_SYMBOLS[parsedData.aspect] || parsedData.aspect;
    return {
      line1: `${parsedData.planet1} ${symbol} ${parsedData.planet2}`,
      line2: '',
    };
  }

  if (parsedData.type === 'composite-house') {
    return {
      line1: `${parsedData.planet} in House ${parsedData.house}`,
      line2: '',
    };
  }

  if (parsedData.type === 'aspect') {
    const symbol = ASPECT_SYMBOLS[parsedData.aspect] || parsedData.aspect;
    return {
      line1: `${parsedData.person1}'s ${parsedData.planet1} ${symbol} ${parsedData.person2}'s ${parsedData.planet2}`,
      line2: '',
    };
  }

  if (parsedData.type === 'house') {
    return {
      line1: `${parsedData.person1}'s ${parsedData.planet} → House ${parsedData.house}`,
      line2: '',
    };
  }

  if (parsedData.type === 'synastry-house') {
    return {
      line1: `${parsedData.person1}'s ${parsedData.planet} → ${parsedData.person2}'s House ${parsedData.house}`,
      line2: '',
    };
  }

  // Fallback - split description into 2 lines
  const desc = parsedData.description;
  const midpoint = Math.floor(desc.length / 2);
  const spaceIndex = desc.lastIndexOf(' ', midpoint);
  return {
    line1: desc.substring(0, spaceIndex),
    line2: desc.substring(spaceIndex + 1),
  };
}

const ConsolidatedItemsGrid: React.FC<ConsolidatedItemsGridProps> = ({
  scoredItems,
  keystoneAspects = [],
  onItemPress,
  selectedItems = [],
  onChatAboutItem,
}) => {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('keystones');

  const filteredAndSortedItems = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for display
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: 'synastry' as const,
      type: 'aspect' as const,
      description: aspect.description,
      // Add structured aspect data for parsing - extract from description
      aspect: aspect.description.includes('trine') ? 'trine' :
              aspect.description.includes('sextile') ? 'sextile' :
              aspect.description.includes('square') ? 'square' :
              aspect.description.includes('conjunction') ? 'conjunction' :
              aspect.description.includes('opposition') ? 'opposition' :
              aspect.description.includes('quincunx') ? 'quincunx' : undefined,
      planet1: aspect.description.match(/(\w+)'s (\w+)/)?.[2],
      planet2: aspect.description.match(/(\w+)'s (\w+).*?(\w+)'s (\w+)/)?.[4],
      planet1Sign: undefined,
      planet2Sign: undefined,
      clusterContributions: [{
        cluster: (aspect.cluster as any) || 'Passion',
        score: Math.abs(aspect.score),
        weight: 10, // Keystones have high weight
        intensity: 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: 10, // Keystones have max centrality
        spark: false,
        isKeystone: true,
        starRating: 5, // Keystones get max stars
      }],
      code: `keystone-${index}`,
      overallCentrality: 10,
      maxStarRating: 5,
    }));

    // Combine regular scored items with keystone aspects
    const allItems = [...scoredItems, ...keystoneAsClusterItems];

    // Apply filters
    let filtered = [...allItems];
    switch (activeFilter) {
      case 'keystones':
        filtered = keystoneAsClusterItems; // Only show keystone aspects
        break;
      case 'sparks':
        filtered = scoredItems.filter(item =>
          item.clusterContributions.some(cc => cc.spark)
        );
        break;
      case 'topSupports':
        let positiveItems = allItems.filter(item =>
          item.clusterContributions.some(cc => cc.valence === 1)
        );
        // Prefer 4+ star items
        let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
        if (highQualitySupports.length === 0) {
          highQualitySupports = positiveItems; // Fallback to all positive
        }
        // Sort by highest scores and take top 3-6
        filtered = highQualitySupports
          .sort((a, b) => {
            const aMaxScore = Math.max(...a.clusterContributions.map(cc => cc.score));
            const bMaxScore = Math.max(...b.clusterContributions.map(cc => cc.score));
            return bMaxScore - aMaxScore;
          })
          .slice(0, 6);
        break;
      case 'topChallenges':
        let negativeItems = allItems.filter(item =>
          item.clusterContributions.some(cc => cc.valence === -1)
        );
        // Sort by most negative scores and take top 3-6
        filtered = negativeItems
          .sort((a, b) => {
            const aMinScore = Math.min(...a.clusterContributions.map(cc => cc.score));
            const bMinScore = Math.min(...b.clusterContributions.map(cc => cc.score));
            return aMinScore - bMinScore; // Most negative first
          })
          .slice(0, 6);
        break;
    }

    // Default sorting by centrality for all filters except topSupports and topChallenges
    // (topSupports and topChallenges already have their own sorting logic)
    if (activeFilter !== 'topSupports' && activeFilter !== 'topChallenges') {
      filtered.sort((a, b) => b.overallCentrality - a.overallCentrality);
    }

    return filtered;
  }, [scoredItems, keystoneAspects, activeFilter]);

  const getValenceColor = (valence: number): string => {
    if (valence === 1) {return '#4CAF50';}
    if (valence === -1) {return '#F44336';}
    return '#FFC107';
  };

  const getStarDisplay = (stars: number): string => {
    return '⭐️'.repeat(Math.min(stars, 5));
  };

  const renderFilterChip = (filter: FilterType, label: string, count: number) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? colors.primary : colors.background,
            borderColor: colors.primary,
          },
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[
          styles.filterText,
          { color: isActive ? 'white' : colors.primary },
        ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };


  const renderItem = ({ item }: { item: ClusterScoredItem }) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    const topContribution = item.clusterContributions.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );
    const sparks = item.clusterContributions.filter(cc => cc.spark);

    // Parse and format the title
    const parsedData = parseAspectDescription(item.description, item);
    const titleData = formatCardTitle(parsedData, item.source);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.background,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          {item.clusterContributions.some(cc => cc.isKeystone) && (
            <View style={styles.keystoneBadge}>
              <Text style={styles.keystoneText}>👑</Text>
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.titleLine1, { color: colors.onSurface }]} numberOfLines={1}>
              {titleData.line1}
            </Text>
            {titleData.line2 ? (
              <Text style={[styles.titleLine2, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {titleData.line2}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Chips and Stars Row */}
        <View style={styles.chipRow}>
          <View style={[
            styles.sourceChip,
            { backgroundColor: (item.source === 'synastry' || item.source === 'synastryHousePlacement') ? '#2196F3' : '#9C27B0' },
          ]}>
            <Text style={[styles.sourceText, { color: 'white' }]}>
              {(item.source === 'synastry' || item.source === 'synastryHousePlacement') ? 'Synastry' : 'Composite'}
            </Text>
          </View>

          {/* Cluster Chip */}
          <View style={[
            styles.clusterChip,
            { backgroundColor: CLUSTER_COLORS[topContribution.cluster] || '#757575' },
          ]}>
            <Text style={[styles.clusterText, { color: 'white' }]}>
              {topContribution.cluster}
            </Text>
          </View>

          <View style={[
            styles.valenceChip,
            { backgroundColor: topContribution.valence === 1 ? '#E8F5E9' : '#FFEBEE' },
          ]}>
            <Text style={[
              styles.valenceText,
              { color: topContribution.valence === 1 ? '#2E7D32' : '#C62828' },
            ]}>
              {topContribution.valence === 1 ? 'Support' : 'Challenge'}
            </Text>
          </View>

          <Text style={[styles.starRating]}>
            {getStarDisplay(item.maxStarRating)}
          </Text>

          {sparks.length > 0 && (
            <View style={styles.sparkContainer}>
              {sparks.slice(0, 1).map((spark, index) => (
                <Text key={index} style={styles.sparkEmoji}>
                  {SPARK_TYPE_EMOJIS[spark.sparkType as keyof typeof SPARK_TYPE_EMOJIS] || '✨'}
                </Text>
              ))}
            </View>
          )}

          <View style={[
            styles.valenceIndicator,
            { backgroundColor: getValenceColor(topContribution.valence) },
          ]} />
        </View>

        {/* Chat About This Button */}
        {onChatAboutItem && (
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.secondary }]}
            onPress={(e) => {
              e.stopPropagation();
              onChatAboutItem(item);
            }}
          >
            <Text style={[styles.chatButtonText, { color: colors.onSecondary }]}>💬 Chat</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const filterCounts = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for counting
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: 'synastry' as const,
      type: 'aspect' as const,
      description: aspect.description,
      // Add structured aspect data for parsing - extract from description
      aspect: aspect.description.includes('trine') ? 'trine' :
              aspect.description.includes('sextile') ? 'sextile' :
              aspect.description.includes('square') ? 'square' :
              aspect.description.includes('conjunction') ? 'conjunction' :
              aspect.description.includes('opposition') ? 'opposition' :
              aspect.description.includes('quincunx') ? 'quincunx' : undefined,
      planet1: aspect.description.match(/(\\w+)'s (\\w+)/)?.[2],
      planet2: aspect.description.match(/(\\w+)'s (\\w+).*?(\\w+)'s (\\w+)/)?.[4],
      planet1Sign: undefined,
      planet2Sign: undefined,
      clusterContributions: [{
        cluster: (aspect.cluster as any) || 'Passion',
        score: Math.abs(aspect.score),
        weight: 10, // Keystones have high weight
        intensity: 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: 10, // Keystones have max centrality
        spark: false,
        isKeystone: true,
        starRating: 5, // Keystones get max stars
      }],
      code: `keystone-${index}`,
      overallCentrality: 10,
      maxStarRating: 5,
    }));

    // Calculate topSupports count - match the filtering logic
    const allItems = [...scoredItems, ...keystoneAsClusterItems];
    let positiveItems = allItems.filter(item =>
      item.clusterContributions.some(cc => cc.valence === 1)
    );
    let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
    if (highQualitySupports.length === 0) {
      highQualitySupports = positiveItems;
    }
    const topSupportsCount = Math.min(highQualitySupports.length, 6);

    // Calculate topChallenges count - match the filtering logic
    let negativeItems = allItems.filter(item =>
      item.clusterContributions.some(cc => cc.valence === -1)
    );
    const topChallengesCount = Math.min(negativeItems.length, 6);

    return {
      keystones: keystoneAspects.length,
      sparks: scoredItems.filter(item => item.clusterContributions.some(cc => cc.spark)).length,
      topSupports: topSupportsCount,
      topChallenges: topChallengesCount,
    };
  }, [scoredItems, keystoneAspects]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Highlights
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Key relationship dynamics organized by five compatibility dimensions
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {renderFilterChip('keystones', 'Keystones', filterCounts.keystones)}
        {renderFilterChip('sparks', 'Sparks', filterCounts.sparks)}
        {renderFilterChip('topSupports', 'Top Supports', filterCounts.topSupports)}
        {renderFilterChip('topChallenges', 'Top Challenges', filterCounts.topChallenges)}
      </ScrollView>


      <Text style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
        Showing {filteredAndSortedItems.length} items
      </Text>

      <View style={styles.grid}>
        {filteredAndSortedItems.map((item) => (
          <View
            key={item.id}
            style={styles.gridItem}
          >
            {renderItem({ item })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  grid: {
    paddingBottom: 16,
  },
  gridItem: {
    width: '100%',
    marginBottom: 12,
  },
  itemCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleLine1: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  titleLine2: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valenceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  valenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clusterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clusterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  starRating: {
    fontSize: 12,
  },
  valenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  sparkContainer: {
    flexDirection: 'row',
  },
  sparkEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  keystoneBadge: {
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  keystoneText: {
    fontSize: 14,
    color: '#8B4513',
  },
  chatButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  chatButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ConsolidatedItemsGrid;
