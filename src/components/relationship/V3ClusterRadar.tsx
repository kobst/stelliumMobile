import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme';
import { ClusterMetrics } from '../../api/relationships';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width * 0.8;
const CENTER_X = RADAR_SIZE / 2;
const CENTER_Y = RADAR_SIZE / 2;
const MAX_RADIUS = RADAR_SIZE * 0.35;

interface V3ClusterRadarProps {
  clusters: Record<string, ClusterMetrics>;
  tier: string;
  profile: string;
  overallScore?: number;
}

interface ClusterInfo {
  name: string;
  emoji: string;
  color: string;
  angle: number;
}

const CLUSTER_CONFIG: { [key: string]: ClusterInfo } = {
  Harmony: { name: 'Harmony', emoji: '🎵', color: '#4CAF50', angle: -90 },
  Passion: { name: 'Passion', emoji: '🔥', color: '#F44336', angle: -18 },
  Connection: { name: 'Connection', emoji: '🧠', color: '#2196F3', angle: 54 },
  Growth: { name: 'Growth', emoji: '🌱', color: '#FF9800', angle: 126 },
  Stability: { name: 'Stability', emoji: '🏛️', color: '#9C27B0', angle: 198 },
};

const V3ClusterRadar: React.FC<V3ClusterRadarProps> = ({ clusters, tier, profile, overallScore }) => {
  const { colors } = useTheme();

  const getScoreColor = (score: number): string => {
    // Convert to percentage if needed (0-1 range to 0-100)
    const percentageScore = score > 1 ? score : score * 100;
    if (percentageScore >= 71) { return '#10B981'; }
    if (percentageScore >= 41) { return '#F59E0B'; }
    return '#EF4444';
  };


  const renderRadarGrid = () => {
    const gridLines = [];
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Concentric circles
    levels.forEach((level, index) => {
      const radius = MAX_RADIUS * level;
      gridLines.push(
        <Circle
          key={`circle-${index}`}
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          fill="none"
          stroke="#c4b5fd"
          strokeWidth={index === levels.length - 1 ? 2 : 1.5}
          opacity={0.6}
        />
      );
    });

    // Axis lines
    Object.values(CLUSTER_CONFIG).forEach((cluster, index) => {
      const angle = (cluster.angle * Math.PI) / 180;
      const endX = CENTER_X + Math.cos(angle) * MAX_RADIUS;
      const endY = CENTER_Y + Math.sin(angle) * MAX_RADIUS;

      gridLines.push(
        <Line
          key={`axis-${index}`}
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={endX}
          y2={endY}
          stroke="#c4b5fd"
          strokeWidth={1.5}
          opacity={0.6}
        />
      );
    });

    return gridLines;
  };

  const renderClusterPoints = () => {
    const points: string[] = [];
    const clusterElements: React.ReactNode[] = [];

    // Ensure all 5 clusters are rendered, even if missing from data
    Object.entries(CLUSTER_CONFIG).forEach(([clusterName, config]) => {
      const clusterData = clusters[clusterName];
      const score = clusterData?.score || 0;
      // Handle both 0-1 decimal and 0-100 percentage formats
      const normalizedScore = score > 1 ? score / 100 : score;
      const radius = MAX_RADIUS * normalizedScore;
      const angle = (config.angle * Math.PI) / 180;

      const x = CENTER_X + Math.cos(angle) * radius;
      const y = CENTER_Y + Math.sin(angle) * radius;

      points.push(`${x},${y}`);

      // Cluster point
      clusterElements.push(
        <Circle
          key={`point-${clusterName}`}
          cx={x}
          cy={y}
          r={6}
          fill={config.color}
          stroke="white"
          strokeWidth={2}
        />
      );

      // Cluster label - increased radius to prevent cutoff
      const labelRadius = MAX_RADIUS + 30;
      const labelX = CENTER_X + Math.cos(angle) * labelRadius;
      const labelY = CENTER_Y + Math.sin(angle) * labelRadius;

      // Name label (top)
      clusterElements.push(
        <SvgText
          key={`label-${clusterName}`}
          x={labelX}
          y={labelY - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill={colors.onSurface}
          fontWeight="600"
        >
          {config.name}
        </SvgText>
      );

      // Score label (bottom)
      clusterElements.push(
        <SvgText
          key={`score-${clusterName}`}
          x={labelX}
          y={labelY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill={getScoreColor(normalizedScore)}
          fontWeight="500"
        >
          {score > 1 ? Math.round(score) : Math.round(score * 100)}%
        </SvgText>
      );
    });

    // Radar polygon
    const polygonElement = (
      <Polygon
        key="radar-polygon"
        points={points.join(' ')}
        fill={colors.primary}
        fillOpacity={0.1}
        stroke={colors.primary}
        strokeWidth={2}
      />
    );

    return [polygonElement, ...clusterElements];
  };

  // Use the provided overallScore if available, otherwise calculate from clusters
  const calculatedAverageScore = Object.entries(CLUSTER_CONFIG).reduce((sum, [clusterName]) => {
    const clusterData = clusters[clusterName];
    const score = clusterData?.score || 0;
    const normalizedScore = score > 1 ? score / 100 : score;
    return sum + normalizedScore;
  }, 0) / 5;

  // Prefer the backend's overall score to ensure consistency
  const averageScore = overallScore !== undefined
    ? (overallScore > 1 ? overallScore / 100 : overallScore)
    : calculatedAverageScore;

  const cumulativeScore = Math.round(overallScore !== undefined ? overallScore : averageScore * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.tier, { color: getScoreColor(averageScore) }]}>Overall Score: {cumulativeScore}%</Text>
        <Text style={[styles.profile, { color: colors.onSurface }]}>{profile}</Text>
      </View>

      <View style={styles.radarContainer}>
        <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}>
          {renderRadarGrid()}
          {renderClusterPoints()}
        </Svg>
      </View>

      <View style={styles.legend}>
        {Object.entries(CLUSTER_CONFIG).map(([clusterName, config]) => {
          const clusterData = clusters[clusterName];
          const score = clusterData?.score || 0;
          const normalizedScore = score > 1 ? score / 100 : score;

          return (
            <View key={clusterName} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: config.color }]} />
              <Text style={[styles.legendText, { color: colors.onSurface }]}>
                {config.name}
              </Text>
              <Text style={[styles.legendScore, { color: getScoreColor(normalizedScore) }]}>
                {score > 1 ? Math.round(score) : Math.round(score * 100)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tier: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profile: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  average: {
    fontSize: 14,
  },
  radarContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  legendScore: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default V3ClusterRadar;
