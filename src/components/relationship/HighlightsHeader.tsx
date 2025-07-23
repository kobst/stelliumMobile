import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AspectBadge {
  planet1: string;
  planet2: string;
  aspectSymbol: string;
  aspectType: 'trine' | 'square' | 'opposition' | 'sextile' | 'conjunction' | 'quincunx';
  label: string;
}

interface HighlightsHeaderProps {
  compositeScore?: number;
  topAspects?: AspectBadge[];
  tensionAspects?: AspectBadge[];
  style?: any;
}

const HighlightsHeader: React.FC<HighlightsHeaderProps> = ({
  compositeScore,
  topAspects = [],
  tensionAspects = [],
  style,
}) => {
  const { colors } = useTheme();

  const getAspectColor = (aspectType: string) => {
    switch (aspectType) {
      case 'trine':
        return colors.aspectTrine;
      case 'square':
        return colors.aspectSquare;
      case 'opposition':
        return colors.aspectOpposition;
      case 'sextile':
        return colors.aspectSextile;
      case 'conjunction':
        return colors.aspectConjunction;
      case 'quincunx':
        return colors.aspectQuincunx;
      default:
        return colors.onSurfaceMed;
    }
  };

  const renderScorePill = () => {
    if (!compositeScore) return null;

    const scoreColor = compositeScore >= 80 ? colors.aspectTrine : 
                     compositeScore >= 60 ? colors.aspectSextile : 
                     compositeScore >= 40 ? colors.warning : 
                     colors.aspectSquare;

    return (
      <View style={[styles.scorePill, { backgroundColor: scoreColor + '20', borderColor: scoreColor }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>
          {compositeScore}/100
        </Text>
      </View>
    );
  };

  const renderAspectBadge = (aspect: AspectBadge, index: number) => {
    const aspectColor = getAspectColor(aspect.aspectType);
    
    return (
      <View 
        key={`${aspect.planet1}-${aspect.planet2}-${index}`}
        style={[styles.aspectBadge, { backgroundColor: aspectColor + '15', borderColor: aspectColor + '40' }]}
      >
        <Text style={[styles.aspectText, { color: aspectColor }]}>
          {aspect.planet1} {aspect.aspectSymbol} {aspect.planet2}
        </Text>
      </View>
    );
  };

  // Show max 2-3 badges to avoid overcrowding
  const displayTopAspects = topAspects.slice(0, 2);
  const displayTensionAspects = tensionAspects.slice(0, 1);

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.surfaceElevated,
          borderBottomColor: colors.strokeSubtle,
        },
        style
      ]}
    >
      <View style={styles.content}>
        {/* Score pill */}
        {renderScorePill()}
        
        {/* Aspect badges */}
        <View style={styles.badgesContainer}>
          {displayTopAspects.map((aspect, index) => renderAspectBadge(aspect, index))}
          {displayTensionAspects.map((aspect, index) => renderAspectBadge(aspect, index + displayTopAspects.length))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  aspectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  aspectText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HighlightsHeader;