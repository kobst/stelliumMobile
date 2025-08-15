import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { ConsolidatedScoredItem, CategoryData, KeystoneAspect } from '../../api/relationships';

interface CategoryHighlightsProps {
  consolidatedItems: ConsolidatedScoredItem[];
  keystoneAspects?: KeystoneAspect[];
  targetCategory: string;
  onItemPress?: (item: ConsolidatedScoredItem) => void;
  selectedItems?: ConsolidatedScoredItem[];
  onChatAboutItem?: (item: ConsolidatedScoredItem) => void;
}

type FilterType = 'keystones' | 'sparks' | 'topSupports' | 'topChallenges';

const CATEGORY_COLORS: { [key: string]: string } = {
  'OVERALL_ATTRACTION_CHEMISTRY': '#E91E63',
  'EMOTIONAL_SECURITY_CONNECTION': '#4CAF50',
  'SEX_AND_INTIMACY': '#F44336',
  'COMMUNICATION_AND_MENTAL_CONNECTION': '#2196F3',
  'COMMITMENT_LONG_TERM_POTENTIAL': '#9C27B0',
  'KARMIC_LESSONS_GROWTH': '#FF9800',
  'PRACTICAL_GROWTH_SHARED_GOALS': '#795548',
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
  // For composite aspects, just show the planets and aspect
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
    // Composite house placement
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

  // Fallback - split description into 2 lines
  const desc = parsedData.description;
  const midpoint = Math.floor(desc.length / 2);
  const spaceIndex = desc.lastIndexOf(' ', midpoint);
  return {
    line1: desc.substring(0, spaceIndex),
    line2: desc.substring(spaceIndex + 1),
  };
}

const CategoryHighlights: React.FC<CategoryHighlightsProps> = ({
  consolidatedItems,
  keystoneAspects = [],
  targetCategory,
  onItemPress,
  selectedItems = [],
  onChatAboutItem,
}) => {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('sparks');

  const filteredAndSortedItems = useMemo(() => {
    // Filter consolidated items to only those relevant to target category
    const categoryConsolidatedItems = consolidatedItems.filter(item =>
      item.categoryData.some(cd => cd.category === targetCategory)
    );

    // keystoneAspects from dynamics[category].keystone already have the full structure
    // Convert them to ConsolidatedScoredItem format for display
    const keystoneAsConsolidatedItems: ConsolidatedScoredItem[] = keystoneAspects.map((aspect: any, index) => ({
      id: `keystone-${targetCategory}-${index}`,
      source: aspect.source as 'synastry' | 'composite',
      type: aspect.type as 'aspect' | 'housePlacement',
      description: aspect.description,
      aspect: aspect.aspect,
      orb: aspect.orb,
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      planet1Sign: aspect.planet1Sign,
      planet2Sign: aspect.planet2Sign,
      pairKey: aspect.pairKey,
      code: aspect.code,
      categoryData: [{
        category: targetCategory,
        cluster: targetCategory,
        score: Math.abs(aspect.score),
        valence: aspect.valence,
        weight: aspect.weight,
        intensity: aspect.intensity,
        centrality: aspect.centrality,
        isKeystone: true,
        keystoneRank: aspect.keystoneRank,
        spark: aspect.spark,
        sparkType: aspect.sparkType,
        starRating: aspect.starRating,
      }],
      overallCentrality: aspect.centrality,
      isOverallKeystone: true,
      maxStarRating: aspect.starRating,
    }));

    // Combine category-specific consolidated items with keystone aspects
    const allCategoryItems = [...categoryConsolidatedItems, ...keystoneAsConsolidatedItems];

    // Apply filters
    let filtered = [...allCategoryItems];
    switch (activeFilter) {
      case 'keystones':
        filtered = keystoneAsConsolidatedItems; // Only show keystone aspects for this category
        break;
      case 'sparks':
        filtered = categoryConsolidatedItems.filter(item =>
          item.categoryData.some(cd => cd.category === targetCategory && cd.spark)
        );
        break;
      case 'topSupports':
        let positiveItems = allCategoryItems.filter(item =>
          item.categoryData.some(cd => cd.category === targetCategory && cd.valence === 1)
        );
        // Prefer 4+ star items
        let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
        if (highQualitySupports.length === 0) {
          highQualitySupports = positiveItems; // Fallback to all positive
        }
        // Sort by highest scores and take top 3-6
        filtered = highQualitySupports
          .sort((a, b) => {
            const aMaxScore = Math.max(...a.categoryData
              .filter(cd => cd.category === targetCategory)
              .map(cd => cd.score));
            const bMaxScore = Math.max(...b.categoryData
              .filter(cd => cd.category === targetCategory)
              .map(cd => cd.score));
            return bMaxScore - aMaxScore;
          })
          .slice(0, 6);
        break;
      case 'topChallenges':
        let negativeItems = allCategoryItems.filter(item =>
          item.categoryData.some(cd => cd.category === targetCategory && cd.valence === -1)
        );
        // Sort by most negative scores and take top 3-6
        filtered = negativeItems
          .sort((a, b) => {
            const aMinScore = Math.min(...a.categoryData
              .filter(cd => cd.category === targetCategory)
              .map(cd => cd.score));
            const bMinScore = Math.min(...b.categoryData
              .filter(cd => cd.category === targetCategory)
              .map(cd => cd.score));
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
  }, [consolidatedItems, keystoneAspects, targetCategory, activeFilter]);

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

  const renderItem = ({ item }: { item: ConsolidatedScoredItem }) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    // Get the category data specific to the target category
    const targetCategoryData = item.categoryData.find(cd => cd.category === targetCategory) ||
                               item.categoryData[0]; // fallback to first if not found
    const sparks = item.categoryData.filter(cd => cd.category === targetCategory && cd.spark);

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
          {item.isOverallKeystone && (
            <View style={styles.keystoneBadge}>
              <Text style={styles.keystoneText}>👑</Text>
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.titleLine1, { color: colors.onSurface }]} numberOfLines={1}>
              {titleData.line1}
            </Text>
            <Text style={[styles.titleLine2, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {titleData.line2}
            </Text>
          </View>
        </View>

        {/* Chips and Stars Row */}
        <View style={styles.chipRow}>
          <View style={[
            styles.sourceChip,
            { backgroundColor: item.source === 'synastry' ? '#2196F3' : '#9C27B0' },
          ]}>
            <Text style={[styles.sourceText, { color: 'white' }]}>
              {item.source === 'synastry' ? 'Synastry' : 'Composite'}
            </Text>
          </View>

          <View style={[
            styles.valenceChip,
            { backgroundColor: targetCategoryData.valence === 1 ? '#E8F5E9' : '#FFEBEE' },
          ]}>
            <Text style={[
              styles.valenceText,
              { color: targetCategoryData.valence === 1 ? '#2E7D32' : '#C62828' },
            ]}>
              {targetCategoryData.valence === 1 ? 'Support' : 'Challenge'}
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
            { backgroundColor: getValenceColor(targetCategoryData.valence) },
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
    // Filter consolidated items to only those relevant to target category
    const categoryConsolidatedItems = consolidatedItems.filter(item =>
      item.categoryData.some(cd => cd.category === targetCategory)
    );

    // keystoneAspects from dynamics[category].keystone already have the full structure
    const keystoneAsConsolidatedItems: ConsolidatedScoredItem[] = keystoneAspects.map((aspect: any, index) => ({
      id: `keystone-${targetCategory}-${index}`,
      source: aspect.source as 'synastry' | 'composite',
      type: aspect.type as 'aspect' | 'housePlacement',
      description: aspect.description,
      aspect: aspect.aspect,
      orb: aspect.orb,
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      planet1Sign: aspect.planet1Sign,
      planet2Sign: aspect.planet2Sign,
      pairKey: aspect.pairKey,
      code: aspect.code,
      categoryData: [{
        category: targetCategory,
        cluster: targetCategory,
        score: Math.abs(aspect.score),
        valence: aspect.valence,
        weight: aspect.weight,
        intensity: aspect.intensity,
        centrality: aspect.centrality,
        isKeystone: true,
        keystoneRank: aspect.keystoneRank,
        spark: aspect.spark,
        sparkType: aspect.sparkType,
        starRating: aspect.starRating,
      }],
      overallCentrality: aspect.centrality,
      isOverallKeystone: true,
      maxStarRating: aspect.starRating,
    }));

    const allCategoryItems = [...categoryConsolidatedItems, ...keystoneAsConsolidatedItems];

    // Calculate topSupports count for this category
    let positiveItems = allCategoryItems.filter(item =>
      item.categoryData.some(cd => cd.category === targetCategory && cd.valence === 1)
    );
    let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
    if (highQualitySupports.length === 0) {
      highQualitySupports = positiveItems;
    }
    const topSupportsCount = Math.min(highQualitySupports.length, 6);

    // Calculate topChallenges count for this category
    let negativeItems = allCategoryItems.filter(item =>
      item.categoryData.some(cd => cd.category === targetCategory && cd.valence === -1)
    );
    const topChallengesCount = Math.min(negativeItems.length, 6);

    return {
      keystones: keystoneAspects.length,
      sparks: categoryConsolidatedItems.filter(item =>
        item.categoryData.some(cd => cd.category === targetCategory && cd.spark)
      ).length,
      topSupports: topSupportsCount,
      topChallenges: topChallengesCount,
    };
  }, [consolidatedItems, keystoneAspects, targetCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Category Highlights
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Key relationship factors for this category
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {renderFilterChip('keystones', 'Keystones', filterCounts.keystones)}
        {renderFilterChip('sparks', 'Sparks', filterCounts.sparks)}
        {renderFilterChip('topSupports', 'Top Supports', filterCounts.topSupports)}
        {renderFilterChip('topChallenges', 'Top Challenges', filterCounts.topChallenges)}
      </ScrollView>


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
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
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
  keystoneIcon: {
    fontSize: 16,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  sparksContainer: {
    flexDirection: 'row',
    marginBottom: 8,
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
  keystoneDescription: {
    fontWeight: '600',
    lineHeight: 18,
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

export default CategoryHighlights;
