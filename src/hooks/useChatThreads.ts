import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { usersApi, chartsApi } from '../api';
import { relationshipsApi } from '../api/relationships';
import { ChatThread, ChatThreadSection } from '../types/chat';
import { SubjectDocument } from '../types';
import { UserCompositeChart } from '../api/relationships';

export interface UseChatThreadsReturn {
  threads: ChatThread[];
  sections: ChatThreadSection[];
  loading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
}

export const useChatThreads = (): UseChatThreadsReturn => {
  const { userData } = useStore();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [sections, setSections] = useState<ChatThreadSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!userData?.id) {
      setError('No user data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load guest subjects and relationships in parallel
      const [guestSubjectsResult, relationshipsResult] = await Promise.all([
        usersApi.getUserSubjects({
          ownerUserId: userData.id,
          usePagination: false,
        }),
        relationshipsApi.getUserCompositeCharts(userData.id),
      ]);

      const allThreads: ChatThread[] = [];

      // 1. Fixed threads (always visible)
      // Check if user's birth chart analysis is complete
      let userChartLocked = true;
      try {
        const userAnalysis = await chartsApi.fetchAnalysis(userData.id);
        const hasCompleteAnalysis = Boolean(
          userAnalysis?.interpretation?.broadCategoryAnalyses &&
          Object.keys(userAnalysis.interpretation.broadCategoryAnalyses).length > 0
        );
        userChartLocked = !hasCompleteAnalysis;
      } catch (err) {
        // No analysis document or fetch failed = locked
        userChartLocked = true;
      }

      const fixedThreads: ChatThread[] = [
        {
          id: 'horoscope-transits',
          type: 'horoscope',
          title: 'Horoscopes & Transits',
          subtitle: 'Explore your daily cosmic influences',
          iconName: 'horoscope',
        },
        {
          id: `birth-chart-${userData.id}`,
          type: 'birth_chart',
          title: 'My Natal Chart',
          subtitle: userChartLocked ? 'Analysis required' : 'Chat about your birth chart',
          userId: userData.id,
          iconName: 'chart',
          isLocked: userChartLocked,
          requiresAnalysis: true,
        },
      ];

      allThreads.push(...fixedThreads);

      // 2. Guest chart threads (include ALL guests, check if locked)
      const guestThreads: ChatThread[] = [];

      // When usePagination is false, getUserSubjects returns array directly
      const guestsArray = Array.isArray(guestSubjectsResult)
        ? guestSubjectsResult
        : [];

      const guests = guestsArray.filter((s: SubjectDocument) => s.kind === 'guest');
      console.log('Found guests:', guests.length);

      if (guests.length > 0) {

        // Check analysis status for each guest in parallel
        const guestThreadsPromises = guests.map(async (guest) => {
          let isLocked = true;

          try {
            // Check if analysis document has broadCategoryAnalyses (complete analysis)
            const analysis = await chartsApi.fetchAnalysis(guest._id);
            const hasCompleteAnalysis = Boolean(
              analysis?.interpretation?.broadCategoryAnalyses &&
              Object.keys(analysis.interpretation.broadCategoryAnalyses).length > 0
            );
            isLocked = !hasCompleteAnalysis;
            console.log(`Guest ${guest.firstName} ${guest.lastName}: locked=${isLocked}`);
          } catch (err) {
            // No analysis document or fetch failed = locked
            isLocked = true;
            console.log(`Guest ${guest.firstName} ${guest.lastName}: no analysis (locked)`);
          }

          return {
            id: `birth-chart-${guest._id}`,
            type: 'birth_chart' as const,
            title: `${guest.firstName} ${guest.lastName}`,
            subtitle: isLocked ? 'Analysis required' : "Chat about this person's chart",
            userId: guest.userId || guest._id,
            guestSubject: guest,
            iconName: 'chart',
            isLocked,
            requiresAnalysis: true,
          };
        });

        const resolvedGuestThreads = await Promise.all(guestThreadsPromises);
        guestThreads.push(...resolvedGuestThreads);
      }

      console.log('Guest threads created:', guestThreads.length);
      allThreads.push(...guestThreads);

      // 3. Relationship threads (include ALL relationships, check if locked)
      const relationshipThreads: ChatThread[] = [];

      // Check analysis status for each relationship in parallel
      const relationshipThreadsPromises = relationshipsResult.map(async (rel: UserCompositeChart) => {
        let isLocked = true;

        try {
          // Check if relationship analysis document has completeAnalysis (full analysis)
          const analysis = await relationshipsApi.fetchRelationshipAnalysis(rel._id);
          const hasCompleteAnalysis = Boolean(
            analysis.completeAnalysis &&
            Object.keys(analysis.completeAnalysis).length > 0
          );
          isLocked = !hasCompleteAnalysis;
        } catch (err) {
          // No analysis document or fetch failed = locked
          isLocked = true;
        }

        // Determine display names
        const currentUserNames = [
          userData.name,
          userData.firstName,
          `${userData.firstName} ${userData.lastName}`.trim(),
        ].filter(Boolean);

        let leftName = rel.userA_name;
        let rightName = rel.userB_name;

        const isLeftNameCurrentUser = currentUserNames.some(
          (name) => name && leftName && name.toLowerCase() === leftName.toLowerCase()
        );
        const isRightNameCurrentUser = currentUserNames.some(
          (name) => name && rightName && name.toLowerCase() === rightName.toLowerCase()
        );

        if (isLeftNameCurrentUser) leftName = 'You';
        if (isRightNameCurrentUser) rightName = 'You';

        const score = rel.clusterScoring?.overall?.score
          ? Math.round(rel.clusterScoring.overall.score)
          : typeof rel.relationshipAnalysisStatus?.overall?.score === 'number'
          ? Math.round(rel.relationshipAnalysisStatus.overall.score)
          : null;

        return {
          id: `relationship-${rel._id}`,
          type: 'relationship' as const,
          title: `${leftName} & ${rightName}`,
          subtitle: isLocked
            ? 'Analysis required'
            : (score ? `Compatibility: ${score}/100` : 'Relationship analysis'),
          compositeChartId: rel._id,
          relationship: rel,
          iconName: 'relationships',
          isLocked,
          requiresAnalysis: true,
        };
      });

      const resolvedRelationshipThreads = await Promise.all(relationshipThreadsPromises);
      relationshipThreads.push(...resolvedRelationshipThreads);

      allThreads.push(...relationshipThreads);

      // Build sections
      const newSections: ChatThreadSection[] = [];

      if (fixedThreads.length > 0) {
        newSections.push({
          title: 'Your Conversations',
          data: fixedThreads,
          type: 'fixed',
        });
      }

      if (guestThreads.length > 0) {
        newSections.push({
          title: 'Friends & Family',
          data: guestThreads,
          type: 'guest_charts',
        });
      }

      if (relationshipThreads.length > 0) {
        newSections.push({
          title: 'Relationships',
          data: relationshipThreads,
          type: 'relationships',
        });
      }

      setThreads(allThreads);
      setSections(newSections);
    } catch (err) {
      console.error('Failed to load chat threads:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Load threads on mount and when userData changes
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    sections,
    loading,
    error,
    refreshThreads: loadThreads,
  };
};
