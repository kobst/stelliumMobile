import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { ChartStackParamList } from '../../navigation/ChartStack';
import { StickySegment } from '../../components/navigation/StickySegment';
import BirthChartKeyElementsSection from '../../components/chart/BirthChartKeyElementsSection';

type ChartCategoryDetailRouteProp = RouteProp<ChartStackParamList, 'ChartCategoryDetail'>;

const ChartCategoryDetailScreen: React.FC = () => {
  const route = useRoute<ChartCategoryDetailRouteProp>();
  const { colors } = useTheme();
  const { categoryKey, categoryName, categoryData, birthChart, icon, color } = route.params;

  // Debug: Log the full category data structure
  console.log('ChartCategoryDetailScreen - Full categoryData:', JSON.stringify(categoryData, null, 2));

  // Get subtopics
  const editedSubtopics = categoryData.editedSubtopics || {};
  const llmSubtopics = categoryData.subtopics || {};
  const subtopicNames = Array.from(new Set([...Object.keys(editedSubtopics), ...Object.keys(llmSubtopics)]));

  console.log('ChartCategoryDetailScreen - editedSubtopics:', editedSubtopics);
  console.log('ChartCategoryDetailScreen - llmSubtopics:', llmSubtopics);
  console.log('ChartCategoryDetailScreen - subtopicNames:', subtopicNames);

  // Add Synthesis as a separate tab if it exists
  const SYNTHESIS_TAB = 'Synthesis';
  const hasSynthesis = !!categoryData.synthesis;
  const allTabNames = hasSynthesis ? [...subtopicNames, SYNTHESIS_TAB] : subtopicNames;

  // State for selected subtopic tab
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(allTabNames[0] || '');

  // Create tabs for subtopics (including synthesis if available)
  const subtopicTabs = allTabNames.map(name => ({
    label: name,
    value: name,
  }));

  // Get current subtopic data
  const getSubtopicContent = () => {
    // Handle Synthesis tab separately
    if (selectedSubtopic === SYNTHESIS_TAB) {
      return {
        content: categoryData.synthesis || '',
        keyCodes: [],
      };
    }

    const edited = editedSubtopics[selectedSubtopic];
    const llm = llmSubtopics[selectedSubtopic];

    console.log('ChartCategoryDetailScreen - Selected subtopic:', selectedSubtopic);
    console.log('ChartCategoryDetailScreen - edited value:', edited);
    console.log('ChartCategoryDetailScreen - llm value:', llm);
    console.log('ChartCategoryDetailScreen - llm type:', typeof llm);
    console.log('ChartCategoryDetailScreen - llm?.keyAspects:', llm?.keyAspects);

    const content = typeof edited === 'string' ? edited : (typeof llm === 'object' ? llm?.analysis : '');

    // Handle keyAspects being either an array or an object with numeric keys
    let keyCodes: string[] = [];
    if (Array.isArray(llm?.keyAspects)) {
      keyCodes = llm.keyAspects;
    } else if (llm?.keyAspects && typeof llm.keyAspects === 'object') {
      // Convert object to array, filtering out non-code entries like "analysis"
      keyCodes = Object.values(llm.keyAspects).filter(
        (value): value is string => typeof value === 'string' && value.length > 0 && value !== ''
      );
    }

    console.log('ChartCategoryDetailScreen - Final content length:', content?.length || 0);
    console.log('ChartCategoryDetailScreen - Final key codes:', keyCodes);

    return { content, keyCodes };
  };

  const renderContent = () => {
    const { content, keyCodes } = getSubtopicContent();

    return (
      <View style={styles.contentArea}>
        {/* Subtopic Analysis Text */}
        <View style={[styles.panel]}>
          <Text style={[styles.panelText, { color: colors.onSurface }]}>
            {content || 'Analysis content not available'}
          </Text>
        </View>

        {/* Key Elements Section - only show for non-synthesis tabs */}
        {selectedSubtopic !== SYNTHESIS_TAB && keyCodes.length > 0 && (
          <BirthChartKeyElementsSection
            title="Key Elements"
            elementCodes={keyCodes}
            birthChart={birthChart}
            colors={colors}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Category Color Bar */}
      {color && <View style={[styles.colorBar, { backgroundColor: color }]} />}

      {/* Segmented Control for Subtopics */}
      {subtopicTabs.length > 1 && (
        <StickySegment
          items={subtopicTabs}
          selectedValue={selectedSubtopic}
          onChange={(value) => setSelectedSubtopic(value as string)}
        />
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contentArea: {
    gap: 16,
  },
  panel: {
    paddingBottom: 16,
  },
  panelText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ChartCategoryDetailScreen;
