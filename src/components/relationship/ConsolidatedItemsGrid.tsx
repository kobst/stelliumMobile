import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoredItem, ClusterContribution, KeystoneAspect } from '../../api/relationships';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface ConsolidatedItemsGridProps {
  scoredItems: ClusterScoredItem[];
  keystoneAspects?: KeystoneAspect[];
  onItemPress?: (item: ClusterScoredItem) => void;
  selectedItems?: ClusterScoredItem[];
  onChatAboutItem?: (item: ClusterScoredItem) => void;
  userAName?: string;
  userBName?: string;
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
  power: '⭐',
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
function parseAspectDescription(description: string, item: any, userAName: string = 'Person A', userBName: string = 'Person B') {
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
  if (item.aspect && (item.planet1 || item.planet1Sign)) {
    // Extract planet names from description if not in item
    const descMatch = description.match(/(\w+)'s (\w+) \w+ (\w+)'s (\w+)/);
    const person1 = descMatch ? descMatch[1] : 'Person A';
    const planet1 = item.planet1 || (descMatch ? descMatch[2] : '');
    const person2 = descMatch ? descMatch[3] : (person1 === userAName ? userBName : userAName);
    const planet2 = item.planet2 || (descMatch ? descMatch[4] : '');

    return {
      type: 'aspect',
      person1,
      planet1,
      sign1: item.planet1Sign,
      aspect: item.aspect,
      person2,
      planet2,
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

// Helper function to format house number with ordinal suffix
function formatHouseOrdinal(house: number | null | undefined): string | null {
  if (!house || house === 0) {return null;}
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = house % 100;
  return house + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// Helper function to format sign and house details
function formatSignHouseDetails(item: any): string {
  // For all aspects (synastry and composite)
  if (item.type === 'aspect' && item.planet1Sign && item.planet2Sign) {
    const sign1Text = item.planet1Sign;
    const house1 = formatHouseOrdinal(item.planet1House);
    const planet1Detail = house1 ? `${sign1Text} (${house1})` : sign1Text;

    const sign2Text = item.planet2Sign;
    const house2 = formatHouseOrdinal(item.planet2House);
    const planet2Detail = house2 ? `${sign2Text} (${house2})` : sign2Text;

    return `${planet1Detail} - ${planet2Detail}`;
  }

  // For house placements
  if ((item.type === 'house' || item.type === 'synastry-house' || item.type === 'composite-house') && item.sign) {
    const house = formatHouseOrdinal(item.house);
    return house ? `${item.sign} (${house})` : item.sign;
  }

  return '';
}

// Component to render detailed description with SVG icons (3 lines)
const DetailedDescriptionWithIcons: React.FC<{ item: any; parsedData: any; colors: any }> = ({ item, parsedData, colors }) => {
  if (parsedData.type !== 'aspect' || !item.planet1Sign || !item.planet2Sign) {
    return null;
  }

  const house1 = item.planet1House && item.planet1House > 0 ? ` in house ${item.planet1House}` : '';
  const house2 = item.planet2House && item.planet2House > 0 ? ` in house ${item.planet2House}` : '';
  const orb = item.orb ? ` (${item.orb.toFixed(1)}°)` : '';
  const aspectName = item.aspect.charAt(0).toUpperCase() + item.aspect.slice(1);

  return (
    <View style={{ marginTop: 4 }}>
      {/* Line 1: Person A's planet, sign, and house (left) with orb (right) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
            {parsedData.person1}'s {parsedData.planet1}{' '}
          </Text>
          <AstroIcon type="planet" name={parsedData.planet1} size={11} color={colors.onSurfaceVariant} />
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
            {' '}in {item.planet1Sign}{' '}
          </Text>
          <AstroIcon type="zodiac" name={item.planet1Sign} size={11} color={colors.onSurfaceVariant} />
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
            {house1}
          </Text>
        </View>
        {orb ? (
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant, marginLeft: 8 }}>
            {orb}
          </Text>
        ) : null}
      </View>

      {/* Line 2: Aspect name with symbol */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {ASPECT_SYMBOLS[item.aspect] || ''} {aspectName}
        </Text>
      </View>

      {/* Line 3: Person B's planet, sign, and house */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {parsedData.person2}'s {parsedData.planet2}{' '}
        </Text>
        <AstroIcon type="planet" name={parsedData.planet2} size={11} color={colors.onSurfaceVariant} />
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {' '}in {item.planet2Sign}{' '}
        </Text>
        <AstroIcon type="zodiac" name={item.planet2Sign} size={11} color={colors.onSurfaceVariant} />
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {house2}
        </Text>
      </View>
    </View>
  );
};

// Format card title based on parsed data
function formatCardTitle(parsedData: any, source: string, item: any) {
  if (parsedData.type === 'composite-aspect') {
    const aspectName = parsedData.aspect.charAt(0).toUpperCase() + parsedData.aspect.slice(1);
    return {
      line1: `${parsedData.planet1} ${aspectName} ${parsedData.planet2}`,
      line2: formatSignHouseDetails({ ...parsedData, ...item }),
    };
  }

  if (parsedData.type === 'composite-house') {
    return {
      line1: `${parsedData.planet} in House ${parsedData.house}`,
      line2: formatSignHouseDetails({ ...parsedData, type: 'composite-house', sign: parsedData.sign, house: parsedData.house }),
    };
  }

  if (parsedData.type === 'aspect') {
    const aspectName = parsedData.aspect.charAt(0).toUpperCase() + parsedData.aspect.slice(1);
    return {
      line1: `${parsedData.person1}'s ${parsedData.planet1} ${aspectName} ${parsedData.person2}'s ${parsedData.planet2}`,
      line2: formatSignHouseDetails(item),
    };
  }

  if (parsedData.type === 'house') {
    return {
      line1: `${parsedData.person1}'s ${parsedData.planet} → House ${parsedData.house}`,
      line2: formatSignHouseDetails(parsedData),
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
  userAName = 'Person A',
  userBName = 'Person B',
}) => {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('keystones');

  const filteredAndSortedItems = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for display
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: (aspect as any).source || 'synastry' as const,
      type: (aspect as any).type || 'aspect' as const,
      description: aspect.description,
      // Copy all the structured aspect data from the keystone
      aspect: (aspect as any).aspect,
      orb: (aspect as any).orb,
      planet1: (aspect as any).planet1,
      planet2: (aspect as any).planet2,
      planet1Sign: (aspect as any).planet1Sign,
      planet2Sign: (aspect as any).planet2Sign,
      planet1House: (aspect as any).planet1House,
      planet2House: (aspect as any).planet2House,
      pairKey: (aspect as any).pairKey,
      planet: (aspect as any).planet,
      house: (aspect as any).house,
      direction: (aspect as any).direction,
      clusterContributions: [{
        cluster: (aspect as any).primaryCluster || (aspect as any).cluster || 'Passion',
        score: Math.abs(aspect.score),
        weight: (aspect as any).weight || 10,
        intensity: (aspect as any).intensity || 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: (aspect as any).centrality || 10,
        spark: (aspect as any).spark || false,
        sparkType: (aspect as any).sparkType,
        isKeystone: true,
        starRating: (aspect as any).starRating || 5,
      }],
      code: (aspect as any).code || `keystone-${index}`,
      overallCentrality: (aspect as any).centrality || 10,
      maxStarRating: (aspect as any).starRating || 5,
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
        // Filter items where the strongest contribution (by absolute value) is positive
        let positiveItems = allItems.filter(item => {
          const strongestContribution = item.clusterContributions.reduce((prev, current) =>
            Math.abs(prev.score) > Math.abs(current.score) ? prev : current
          );
          return strongestContribution.valence === 1;
        });
        // Prefer 4+ star items
        let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
        if (highQualitySupports.length === 0) {
          highQualitySupports = positiveItems; // Fallback to all positive
        }
        // Sort by highest absolute scores and take top 3-6
        filtered = highQualitySupports
          .sort((a, b) => {
            const aStrongest = a.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            const bStrongest = b.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            return Math.abs(bStrongest.score) - Math.abs(aStrongest.score);
          })
          .slice(0, 6);
        break;
      case 'topChallenges':
        // Filter items where the strongest contribution (by absolute value) is negative
        let negativeItems = allItems.filter(item => {
          const strongestContribution = item.clusterContributions.reduce((prev, current) =>
            Math.abs(prev.score) > Math.abs(current.score) ? prev : current
          );
          return strongestContribution.valence === -1;
        });
        // Sort by highest absolute scores (most impactful challenges) and take top 3-6
        filtered = negativeItems
          .sort((a, b) => {
            const aStrongest = a.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            const bStrongest = b.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            return Math.abs(bStrongest.score) - Math.abs(aStrongest.score);
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
    // Use the most significant contribution by absolute value (strongest impact)
    const topContribution = item.clusterContributions.reduce((prev, current) =>
      Math.abs(prev.score) > Math.abs(current.score) ? prev : current
    );
    const sparks = item.clusterContributions.filter(cc => cc.spark);

    // Parse and format the title
    const parsedData = parseAspectDescription(item.description, item, userAName, userBName);
    const titleData = formatCardTitle(parsedData, item.source, item);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : 'transparent',
            borderWidth: 1,
          },
        ]}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.8}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleLine1, { color: colors.onSurface }]} numberOfLines={2}>
              {titleData.line1}
            </Text>
            {parsedData.type === 'aspect' && item.planet1Sign && item.planet2Sign ? (
              <DetailedDescriptionWithIcons item={item} parsedData={parsedData} colors={colors} />
            ) : null}
          </View>
        </View>

        {/* Chips and Stars Row */}
        <View style={styles.chipRow}>
          <View style={[
            styles.sourceChip,
            { backgroundColor: (item.source === 'synastry' || item.source === 'synastryHousePlacement') ? 'rgba(33, 150, 243, 0.12)' : 'rgba(156, 39, 176, 0.12)' },
          ]}>
            <Text style={[styles.sourceText, { color: (item.source === 'synastry' || item.source === 'synastryHousePlacement') ? '#1976D2' : '#7B1FA2' }]}>
              {(item.source === 'synastry' || item.source === 'synastryHousePlacement') ? 'Synastry' : 'Composite'}
            </Text>
          </View>

          {/* Cluster Chip */}
          <View style={[
            styles.clusterChip,
            { backgroundColor: `${CLUSTER_COLORS[topContribution.cluster] || '#757575'}20` },
          ]}>
            <Text style={[styles.clusterText, { color: CLUSTER_COLORS[topContribution.cluster] || '#757575' }]}>
              {topContribution.cluster}
            </Text>
          </View>

          <View style={[
            styles.valenceChip,
            { backgroundColor: topContribution.valence === 1 ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)' },
          ]}>
            <Text style={[
              styles.valenceText,
              { color: topContribution.valence === 1 ? '#388E3C' : '#D32F2F' },
            ]}>
              {topContribution.valence === 1 ? 'Support' : 'Challenge'}
            </Text>
          </View>

          <View style={[
            styles.valenceIndicator,
            { backgroundColor: getValenceColor(topContribution.valence) },
          ]} />
        </View>
      </TouchableOpacity>
    );
  };

  const filterCounts = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for counting
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: (aspect as any).source || 'synastry' as const,
      type: (aspect as any).type || 'aspect' as const,
      description: aspect.description,
      // Copy all the structured aspect data from the keystone
      aspect: (aspect as any).aspect,
      orb: (aspect as any).orb,
      planet1: (aspect as any).planet1,
      planet2: (aspect as any).planet2,
      planet1Sign: (aspect as any).planet1Sign,
      planet2Sign: (aspect as any).planet2Sign,
      planet1House: (aspect as any).planet1House,
      planet2House: (aspect as any).planet2House,
      pairKey: (aspect as any).pairKey,
      planet: (aspect as any).planet,
      house: (aspect as any).house,
      direction: (aspect as any).direction,
      clusterContributions: [{
        cluster: (aspect as any).primaryCluster || (aspect as any).cluster || 'Passion',
        score: Math.abs(aspect.score),
        weight: (aspect as any).weight || 10,
        intensity: (aspect as any).intensity || 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: (aspect as any).centrality || 10,
        spark: (aspect as any).spark || false,
        sparkType: (aspect as any).sparkType,
        isKeystone: true,
        starRating: (aspect as any).starRating || 5,
      }],
      code: (aspect as any).code || `keystone-${index}`,
      overallCentrality: (aspect as any).centrality || 10,
      maxStarRating: (aspect as any).starRating || 5,
    }));

    // Calculate topSupports count - match the filtering logic (strongest contribution)
    const allItems = [...scoredItems, ...keystoneAsClusterItems];
    let positiveItems = allItems.filter(item => {
      const strongestContribution = item.clusterContributions.reduce((prev, current) =>
        Math.abs(prev.score) > Math.abs(current.score) ? prev : current
      );
      return strongestContribution.valence === 1;
    });
    let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
    if (highQualitySupports.length === 0) {
      highQualitySupports = positiveItems;
    }
    const topSupportsCount = Math.min(highQualitySupports.length, 6);

    // Calculate topChallenges count - match the filtering logic (strongest contribution)
    let negativeItems = allItems.filter(item => {
      const strongestContribution = item.clusterContributions.reduce((prev, current) =>
        Math.abs(prev.score) > Math.abs(current.score) ? prev : current
      );
      return strongestContribution.valence === -1;
    });
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
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleLine1: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    lineHeight: 20,
  },
  titleLine2: {
    fontSize: 13,
    lineHeight: 18,
  },
  titleLine3: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  valenceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valenceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  clusterChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clusterText: {
    fontSize: 10,
    fontWeight: '500',
  },
  starRating: {
    fontSize: 11,
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
