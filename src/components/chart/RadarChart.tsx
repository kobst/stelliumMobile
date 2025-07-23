import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Polygon,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../theme';

interface RadarChartProps {
  data: { [key: string]: number };
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 280 }) => {
  const { colors } = useTheme();
  const center = size / 2;
  const maxRadius = (size / 2) - 40; // Reduced space for labels

  // Cluster information with icons and positions (fixed angles for perfect pentagon)
  const clusters = [
    { key: 'Heart', label: 'Heart', icon: '💗', angle: -90 }, // Top
    { key: 'Body', label: 'Body', icon: '🔥', angle: -18 }, // Top right
    { key: 'Mind', label: 'Mind', icon: '🧠', angle: 54 }, // Bottom right
    { key: 'Life', label: 'Life', icon: '💎', angle: 126 }, // Bottom left
    { key: 'Soul', label: 'Soul', icon: '🌙', angle: 198 }, // Top left
  ];

  // Calculate pentagon coordinates for a given radius
  const getPolygonPoints = (radius: number) => {
    return clusters.map(cluster => {
      const angleRad = cluster.angle * (Math.PI / 180);
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return `${x},${y}`;
    }).join(' ');
  };

  // Calculate data polygon points based on scores
  const getDataPolygonPoints = () => {
    return clusters.map(cluster => {
      const score = data[cluster.key] || 0;
      const radius = (score / 100) * maxRadius;
      const angleRad = cluster.angle * (Math.PI / 180);
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return `${x},${y}`;
    }).join(' ');
  };

  // Get label position outside the pentagon
  const getLabelPosition = (cluster: typeof clusters[0]) => {
    const labelRadius = maxRadius + 30;
    const angleRad = cluster.angle * (Math.PI / 180);
    const x = center + labelRadius * Math.cos(angleRad);
    const y = center + labelRadius * Math.sin(angleRad);

    // Adjust positioning based on quadrant to center labels properly
    let adjustedX = x;
    let adjustedY = y;

    // Top position (Heart)
    if (cluster.angle === -90) {
      adjustedX = x - 22; // Center horizontally
      adjustedY = y - 10; // Move up a bit
    }
    // Top right (Body)
    else if (cluster.angle === -18) {
      adjustedX = x - 44; // Move left to avoid edge
      adjustedY = y - 15; // Move up
    }
    // Bottom right (Mind)
    else if (cluster.angle === 54) {
      adjustedX = x - 44; // Move left to avoid edge
      adjustedY = y - 25; // Move up
    }
    // Bottom left (Life)
    else if (cluster.angle === 126) {
      adjustedX = x; // Keep x position
      adjustedY = y - 25; // Move up
    }
    // Top left (Soul)
    else if (cluster.angle === 198) {
      adjustedX = x; // Keep x position
      adjustedY = y - 15; // Move up
    }

    return { x: adjustedX, y: adjustedY };
  };

  // Scale circles (25%, 50%, 75%, 100%)
  const scaleRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Scale rings - only concentric circles */}
        {scaleRings.map((scale, index) => (
          <Circle
            key={scale}
            cx={center}
            cy={center}
            r={maxRadius * scale}
            fill="none"
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.6"
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {clusters.map(cluster => {
          const angleRad = cluster.angle * (Math.PI / 180);
          const x2 = center + maxRadius * Math.cos(angleRad);
          const y2 = center + maxRadius * Math.sin(angleRad);
          return (
            <Line
              key={cluster.key}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke={colors.border}
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={getDataPolygonPoints()}
          fill="url(#dataGradient)"
          stroke={colors.primary}
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Data points */}
        {clusters.map(cluster => {
          const score = data[cluster.key] || 0;
          const radius = (score / 100) * maxRadius;
          const angleRad = cluster.angle * (Math.PI / 180);
          const x = center + radius * Math.cos(angleRad);
          const y = center + radius * Math.sin(angleRad);
          return (
            <Circle
              key={`point-${cluster.key}`}
              cx={x}
              cy={y}
              r="3"
              fill={colors.primary}
              stroke={colors.onPrimary}
              strokeWidth="1"
            />
          );
        })}

        {/* Scale labels */}
        {scaleRings.map(scale => (
          <SvgText
            key={`scale-${scale}`}
            x={center + 8}
            y={center - (maxRadius * scale) + 4}
            fontSize="10"
            fill={colors.onSurfaceVariant}
            textAnchor="start"
          >
            {`${scale * 100}%`}
          </SvgText>
        ))}
      </Svg>

      {/* Cluster labels positioned around the chart */}
      {clusters.map(cluster => {
        const labelPos = getLabelPosition(cluster);
        const score = data[cluster.key] || 0;

        return (
          <View
            key={`label-${cluster.key}`}
            style={[
              styles.labelContainer,
              {
                position: 'absolute',
                left: labelPos.x,
                top: labelPos.y,
                backgroundColor: colors.surface + 'CC', // Semi-transparent
                borderColor: colors.border + '99', // Semi-transparent border
              },
            ]}
          >
            <Text style={styles.labelIcon}>{cluster.icon}</Text>
            <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>{cluster.label}</Text>
            <Text style={[styles.labelScore, { color: colors.primary }]}>{score}%</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 6, // Reduced padding
    minWidth: 44, // Smaller width
    borderWidth: 1,
  },
  labelIcon: {
    fontSize: 12, // Smaller icon
    marginBottom: 1,
  },
  labelText: {
    fontSize: 8, // Smaller text
    fontWeight: '500',
    marginBottom: 1,
  },
  labelScore: {
    fontSize: 10, // Smaller score
    fontWeight: 'bold',
  },
});

export default RadarChart;
