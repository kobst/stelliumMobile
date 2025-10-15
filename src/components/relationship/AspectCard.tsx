import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClusterScoredItem } from '../../api/relationships';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface AspectCardProps {
  item: ClusterScoredItem;
  colors: any;
  onPress?: (item: ClusterScoredItem) => void;
  isSelected?: boolean;
  showSelection?: boolean;
  userAName?: string;
  userBName?: string;
}

const CLUSTER_COLORS: { [key: string]: string } = {
  'Harmony': '#4CAF50',
  'Passion': '#F44336',
  'Connection': '#2196F3',
  'Stability': '#9C27B0',
  'Growth': '#FF9800',
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
  // Handle both synastry aspects and composite aspects
  const isComposite = parsedData.type === 'composite-aspect';
  const isSynastry = parsedData.type === 'aspect';

  if ((!isComposite && !isSynastry) || !item.planet1Sign || !item.planet2Sign) {
    return null;
  }

  const house1 = item.planet1House && item.planet1House > 0 ? ` in house ${item.planet1House}` : '';
  const house2 = item.planet2House && item.planet2House > 0 ? ` in house ${item.planet2House}` : '';
  const aspectName = item.aspect.charAt(0).toUpperCase() + item.aspect.slice(1);

  return (
    <View style={{ marginTop: 4 }}>
      {/* Line 1: Planet 1 with optional person name */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {isSynastry && parsedData.person1 ? `${parsedData.person1}'s ` : ''}{parsedData.planet1}{' '}
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

      {/* Line 2: Aspect name with symbol */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {ASPECT_SYMBOLS[item.aspect] || ''} {aspectName}
        </Text>
      </View>

      {/* Line 3: Planet 2 with optional person name */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
          {isSynastry && parsedData.person2 ? `${parsedData.person2}'s ` : ''}{parsedData.planet2}{' '}
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

const AspectCard: React.FC<AspectCardProps> = ({
  item,
  colors,
  onPress,
  isSelected = false,
  showSelection = false,
  userAName = 'Person A',
  userBName = 'Person B',
}) => {
  // Use the most significant contribution by absolute value (strongest impact)
  const topContribution = item.clusterContributions.reduce((prev, current) =>
    Math.abs(prev.score) > Math.abs(current.score) ? prev : current
  );

  // Parse and format the title
  const parsedData = parseAspectDescription(item.description, item, userAName, userBName);
  const titleData = formatCardTitle(parsedData, item.source, item);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : 'transparent',
          borderWidth: 1,
        },
      ]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.8}
    >
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.titleLine1, { color: colors.onSurface, flex: 1 }]} numberOfLines={2}>
              {titleData.line1}
            </Text>
            {item.orb !== undefined && item.orb !== null && (
              <Text style={[styles.orbText, { color: colors.onSurface }]}>
                {item.orb.toFixed(1)}° orb
              </Text>
            )}
          </View>
          {(parsedData.type === 'aspect' || parsedData.type === 'composite-aspect') && item.planet1Sign && item.planet2Sign ? (
            <DetailedDescriptionWithIcons item={item} parsedData={parsedData} colors={colors} />
          ) : null}
        </View>
      </View>

      {/* Chips Row */}
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
          { backgroundColor: topContribution.valence === 1 ? '#4CAF50' : '#F44336' },
        ]} />

        {/* Selection checkmark */}
        {showSelection && isSelected && (
          <View style={[styles.selectionIndicator, { marginLeft: 'auto' }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  orbText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    lineHeight: 20,
  },
  selectionIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  valenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
});

export default AspectCard;
