import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store';
import { relationshipsApi, UserCompositeChart } from '../api/relationships';
import { parseDateStringAsLocalDate } from '../utils/dateHelpers';
import { useTheme } from '../theme';
import { AstroIcon } from '../../utils/astrologyIcons';
import RelationshipAnalysisTypeIndicator from './relationship/RelationshipAnalysisTypeIndicator';

interface UserRelationshipsProps {
  onRelationshipPress?: (relationship: UserCompositeChart) => void;
}

const UserRelationships: React.FC<UserRelationshipsProps> = ({ onRelationshipPress }) => {
  const { userData } = useStore();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [relationships, setRelationships] = useState<UserCompositeChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, []);

  // Reload relationships when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadRelationships();
    }, [])
  );

  const loadRelationships = async () => {
    const userId = userData?.userId || userData?.id;

    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.getUserCompositeCharts(userId);
      console.log('getUserCompositeCharts response:', JSON.stringify(response, null, 2));
      console.log('First relationship analysis status:', response[0]?.relationshipAnalysisStatus);
      setRelationships(response);
    } catch (err) {
      console.error('Failed to load user relationships:', err);
      setError('Failed to load your relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleRelationshipPress = (relationship: UserCompositeChart) => {
    console.log('Existing relationship data:', relationship);
    console.log('Existing relationship clusterScoring:', relationship.clusterScoring);
    if (onRelationshipPress) {
      onRelationshipPress(relationship);
    } else {
      // Navigate to relationship analysis screen
      (navigation as any).navigate('RelationshipAnalysis', { relationship });
    }
  };

  // Relationships can be deleted elsewhere; keep component focused on display only

  // Helper function to determine user display names
  const getDisplayNames = (item: UserCompositeChart) => {
    // Get current user's name variations for comparison
    const currentUserNames = [
      userData?.name,
      userData?.firstName,
      `${userData?.firstName} ${userData?.lastName}`.trim(),
      userData?.email?.split('@')[0],
      // Extract first name from full name (e.g., "test Horoscope3" -> "test")
      userData?.name?.split(' ')[0],
    ].filter(Boolean);

    let leftName = item.userA_name;
    let rightName = item.userB_name;

    // Check if leftName matches any variation of current user
    const isLeftNameCurrentUser = currentUserNames.some(name =>
      name && leftName && name.toLowerCase() === leftName.toLowerCase()
    );

    // Check if rightName matches any variation of current user
    const isRightNameCurrentUser = currentUserNames.some(name =>
      name && rightName && name.toLowerCase() === rightName.toLowerCase()
    );

    // Replace matching names with "You"
    if (isLeftNameCurrentUser) {
      leftName = 'You';
    }

    if (isRightNameCurrentUser) {
      rightName = 'You';
    }

    return { leftName, rightName };
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) { return '#10B981'; }
    if (score >= 41) { return '#F59E0B'; }
    return '#EF4444';
  };

  const getSunSignName = (dateOfBirth: string | null): string | null => {
    if (!dateOfBirth) return null;

    const date = parseDateStringAsLocalDate(dateOfBirth);
    if (isNaN(date.getTime())) return null;

    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();

    // Sun sign date ranges (approximate)
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries';
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus';
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini';
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer';
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo';
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo';
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra';
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio';
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius';
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn';
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius';
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces';

    return null;
  };

  const renderRelationshipItem = ({ item }: { item: UserCompositeChart }) => {
    const { leftName, rightName } = getDisplayNames(item);
    const partnerName = leftName === 'You' ? rightName : leftName;

    // Get analysis data from clusterScoring (primary) or relationshipAnalysisStatus (fallback)
    const clusterScoring = item.clusterScoring;
    const analysisStatus = item.relationshipAnalysisStatus;

    const score = clusterScoring?.overall?.score
      ? Math.round(clusterScoring.overall.score)
      : (typeof analysisStatus?.overall?.score === 'number'
          ? Math.round(analysisStatus.overall.score)
          : null);

    const tier = clusterScoring?.overall?.tier || analysisStatus?.overall?.tier || null;
    const profile = clusterScoring?.overall?.profile || analysisStatus?.overall?.profile || null;

    // Get partner's data
    const partnerDateOfBirth = leftName === 'You' ? item.userB_dateOfBirth : item.userA_dateOfBirth;

    // Format partner's birth date
    let formattedBirthDate = '';
    if (partnerDateOfBirth) {
      try {
        const birthDate = parseDateStringAsLocalDate(partnerDateOfBirth);
        formattedBirthDate = birthDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch (e) {
        // If parsing fails, skip the date
      }
    }

    // Get partner's sun sign for display
    const partnerSunSignName = getSunSignName(partnerDateOfBirth);

    const hasAnalysisData = score !== null && tier && profile;

    return (
      <TouchableOpacity
        style={[styles.relationshipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleRelationshipPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          {/* Date created */}
          <Text style={[styles.createdDate, { color: colors.onSurfaceVariant }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.nameSection}>
            <Text style={[styles.partnerName, { color: colors.onSurface }]}>{partnerName}</Text>
            {partnerSunSignName && (
              <View style={styles.sunSignContainer}>
                <AstroIcon type="zodiac" name={partnerSunSignName} size={14} color={colors.primary} />
                <Text style={[styles.sunSign, { color: colors.onSurfaceVariant }]}>{partnerSunSignName}</Text>
              </View>
            )}
            {formattedBirthDate && (
              <Text style={[styles.birthDate, { color: colors.onSurfaceVariant }]}>{formattedBirthDate}</Text>
            )}
          </View>
          {score !== null && (
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{score}</Text>
          )}
        </View>

        {hasAnalysisData && (
          <View style={styles.analysisInfo}>
            <Text style={[styles.tierText, { color: colors.primary }]}>{tier} Relationship</Text>
            <Text style={[styles.profileText, { color: colors.onSurfaceVariant }]}>{profile}</Text>
            <RelationshipAnalysisTypeIndicator compositeChartId={item._id} />
          </View>
        )}

        {hasAnalysisData && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: getScoreColor(score!),
                  width: `${score}%`
                }
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading your relationships...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.error }]}
            onPress={loadRelationships}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {relationships.length === 0 ? (
        <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyStateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyStateIcon, { color: colors.primary }]}>💫</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.onSurface }]}>
              No Relationships Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
              Create your first compatibility analysis to explore cosmic connections and relationship insights.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.relationshipsList}>
          {relationships.map((item) => (
            <View key={item._id}>
              {renderRelationshipItem({ item })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  // Empty state with illustration + CTA
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  relationshipsList: {
    flex: 1,
  },
  relationshipCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTop: {
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameSection: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sunSignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sunSign: {
    fontSize: 14,
    fontWeight: '400',
  },
  birthDate: {
    fontSize: 14,
    fontWeight: '400',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  analysisInfo: {
    marginBottom: 12,
  },
  tierText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileText: {
    fontSize: 14,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  errorSection: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserRelationships;
