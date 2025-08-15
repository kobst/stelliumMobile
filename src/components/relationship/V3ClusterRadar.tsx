import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme';
import { V3Clusters } from '../../api/relationships';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width * 0.8;
const CENTER_X = RADAR_SIZE / 2;
const CENTER_Y = RADAR_SIZE / 2;
const MAX_RADIUS = RADAR_SIZE * 0.35;

interface V3ClusterRadarProps {
  clusters: V3Clusters;
  tier: string;
  profile: string;
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

const V3ClusterRadar: React.FC<V3ClusterRadarProps> = ({ clusters, tier, profile }) => {
  const { colors } = useTheme();

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) {return '#4CAF50';}
    if (score >= 0.6) {return '#FF9800';}
    if (score >= 0.4) {return '#FFC107';}
    return '#F44336';
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
          stroke={colors.border}
          strokeWidth={index === levels.length - 1 ? 2 : 1}
          opacity={0.3}
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
          stroke={colors.border}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    });

    return gridLines;
  };

  const renderClusterPoints = () => {
    const points: string[] = [];
    const clusterElements: React.ReactNode[] = [];

    Object.entries(clusters).forEach(([clusterName, clusterData]) => {
      const config = CLUSTER_CONFIG[clusterName];
      if (!config) {return;}

      const score = clusterData.score;
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

      // Cluster label
      const labelRadius = MAX_RADIUS + 20;
      const labelX = CENTER_X + Math.cos(angle) * labelRadius;
      const labelY = CENTER_Y + Math.sin(angle) * labelRadius;

      clusterElements.push(
        <SvgText
          key={`label-${clusterName}`}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill={colors.onSurface}
          fontWeight="600"
        >
          {config.emoji} {config.name}
        </SvgText>
      );

      // Score label
      clusterElements.push(
        <SvgText
          key={`score-${clusterName}`}
          x={labelX}
          y={labelY + 15}
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

  const averageScore = Object.values(clusters).reduce((sum, cluster) => {
    const normalizedScore = cluster.score > 1 ? cluster.score / 100 : cluster.score;
    return sum + normalizedScore;
  }, 0) / 5;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.tier, { color: getScoreColor(averageScore) }]}>{tier}</Text>
        <Text style={[styles.profile, { color: colors.onSurface }]}>{profile}</Text>
        <Text style={[styles.average, { color: colors.onSurfaceVariant }]}>
          Average: {Math.round(averageScore * 100)}%
        </Text>
      </View>

      <View style={styles.radarContainer}>
        <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}>
          {renderRadarGrid()}
          {renderClusterPoints()}
        </Svg>
      </View>

      <View style={styles.legend}>
        {Object.entries(clusters).map(([clusterName, clusterData]) => {
          const config = CLUSTER_CONFIG[clusterName];
          if (!config) {return null;}

          return (
            <View key={clusterName} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: config.color }]} />
              <Text style={[styles.legendText, { color: colors.onSurface }]}>
                {config.emoji} {config.name}
              </Text>
              <Text style={[styles.legendScore, { color: getScoreColor(clusterData.score > 1 ? clusterData.score / 100 : clusterData.score) }]}>
                {clusterData.score > 1 ? Math.round(clusterData.score) : Math.round(clusterData.score * 100)}%
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
    padding: 16,
    borderRadius: 12,
    margin: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tier: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profile: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  average: {
    fontSize: 14,
  },
  radarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
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
