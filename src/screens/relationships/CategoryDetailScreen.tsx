import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { RelationshipsStackParamList } from '../../navigation/RelationshipsStack';
import { StickySegment } from '../../components/navigation/StickySegment';
import KeyAspectsSection from '../../components/relationship/KeyAspectsSection';

type CategoryDetailRouteProp = RouteProp<RelationshipsStackParamList, 'CategoryDetail'>;

const CategoryDetailScreen: React.FC = () => {
  const route = useRoute<CategoryDetailRouteProp>();
  const { colors } = useTheme();
  const { categoryName, categoryData, analysisData, color, icon, consolidatedItems, userAName, userBName } = route.params;

  const [selectedTab, setSelectedTab] = useState<'synastry' | 'composite' | 'synthesis'>('synastry');

  const subTabs = [
    { label: 'Synastry', value: 'synastry' },
    { label: 'Composite', value: 'composite' },
    { label: 'Synthesis', value: 'synthesis' },
  ];

  const renderHeader = () => (
    <View style={[styles.headerInfo, { backgroundColor: colors.surface }]}>
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={[styles.scoreText, { color: colors.primary }]}>
        {Math.round(categoryData.score)}%
      </Text>
    </View>
  );

  const renderContent = () => {
    if (selectedTab === 'synastry' && analysisData.synastry) {
      return (
        <View style={styles.contentArea}>
          {analysisData.synastry.supportPanel && (
            <View style={[styles.panel, { borderBottomColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color }]}>Support</Text>
              <Text style={[styles.panelText, { color: colors.onSurface }]}>
                {analysisData.synastry.supportPanel}
              </Text>
            </View>
          )}
          {analysisData.synastry.challengePanel && (
            <View style={[styles.panel, { borderBottomColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color }]}>Challenge</Text>
              <Text style={[styles.panelText, { color: colors.onSurface }]}>
                {analysisData.synastry.challengePanel}
              </Text>
            </View>
          )}

          {/* Key Synastry Aspects */}
          <KeyAspectsSection
            title="Key Synastry Aspects"
            aspectCodes={analysisData.keyAspects?.synastry?.codes || []}
            consolidatedItems={consolidatedItems}
            colors={colors}
            userAName={userAName}
            userBName={userBName}
          />
        </View>
      );
    }

    if (selectedTab === 'composite' && analysisData.composite) {
      return (
        <View style={styles.contentArea}>
          {analysisData.composite.supportPanel && (
            <View style={[styles.panel, { borderBottomColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color }]}>Support</Text>
              <Text style={[styles.panelText, { color: colors.onSurface }]}>
                {analysisData.composite.supportPanel}
              </Text>
            </View>
          )}
          {analysisData.composite.challengePanel && (
            <View style={[styles.panel, { borderBottomColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color }]}>Challenge</Text>
              <Text style={[styles.panelText, { color: colors.onSurface }]}>
                {analysisData.composite.challengePanel}
              </Text>
            </View>
          )}

          {/* Key Composite Aspects */}
          <KeyAspectsSection
            title="Key Composite Aspects"
            aspectCodes={analysisData.keyAspects?.composite?.codes || []}
            consolidatedItems={consolidatedItems}
            colors={colors}
            userAName={userAName}
            userBName={userBName}
          />
        </View>
      );
    }

    if (selectedTab === 'synthesis') {
      const synthesisText = analysisData.synastry?.synthesisPanel || analysisData.composite?.synthesisPanel;
      return (
        <View style={styles.contentArea}>
          {synthesisText && (
            <View style={styles.panelLast}>
              <Text style={[styles.panelTitle, { color }]}>Synthesis & Integration</Text>
              <Text style={[styles.panelText, { color: colors.onSurface }]}>
                {synthesisText}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      {renderHeader()}

      {/* Category Color Bar */}
      <View style={[styles.colorBar, { backgroundColor: color }]} />

      {/* Segmented Control */}
      <StickySegment
        items={subTabs}
        selectedValue={selectedTab}
        onChange={(value) => setSelectedTab(value as 'synastry' | 'composite' | 'synthesis')}
      />

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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
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
    borderBottomWidth: 1,
  },
  panelLast: {
    // No bottom border
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  panelText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CategoryDetailScreen;
