import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AnalysisTypeIndicatorProps {
  hasCompleteAnalysis?: boolean;
}

const AnalysisTypeIndicator: React.FC<AnalysisTypeIndicatorProps> = ({ 
  hasCompleteAnalysis = false 
}) => {
  const { colors } = useTheme();

  const analysisType = hasCompleteAnalysis ? 'Complete Analysis' : 'Overview & Chart';
  const icon = hasCompleteAnalysis ? '📊' : '📈';

  return (
    <View style={styles.container}>
      <Text style={[styles.indicator, { color: colors.onSurfaceVariant }]}>
        {icon} {analysisType}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  indicator: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AnalysisTypeIndicator;