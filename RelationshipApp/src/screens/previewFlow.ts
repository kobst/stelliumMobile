import { EnhancedRelationshipAnalysisResponse, UserCompositeChart } from '../../../shared/api/relationships';
import { RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';
import { createLocalHistoryEntry, createLocalPreviewAnalysis } from '../mocks/demoData';

export interface PreviewTargetInput {
  selfProfile: RelationshipAppProfile;
  targetSubject: SubjectDocument;
  targetType: 'person' | 'celebrity';
  isLocalUxMode: boolean;
  relationshipHistory: UserCompositeChart[];
}

interface PreviewFlowDeps {
  enhancedRelationshipAnalysis: (
    userIdA: string,
    userIdB: string,
    ownerUserId?: string,
    celebRelationship?: boolean
  ) => Promise<EnhancedRelationshipAnalysisResponse>;
}

export async function startRelationshipPreview(
  input: PreviewTargetInput,
  deps: PreviewFlowDeps
): Promise<{
  preview: EnhancedRelationshipAnalysisResponse;
  updatedHistory: UserCompositeChart[];
}> {
  const isCelebrityRelationship = input.targetType === 'celebrity';

  const preview = input.isLocalUxMode
    ? createLocalPreviewAnalysis({
        selfProfile: input.selfProfile,
        partner: input.targetSubject,
        isCelebrityRelationship,
      })
    : await deps.enhancedRelationshipAnalysis(
        input.selfProfile.id,
        input.targetSubject._id,
        input.selfProfile.id,
        isCelebrityRelationship
      );

  const updatedHistory = input.isLocalUxMode
    ? [
        createLocalHistoryEntry({ preview }),
        ...input.relationshipHistory.filter((item) => item._id !== preview.compositeChartId),
      ]
    : input.relationshipHistory;

  return {
    preview,
    updatedHistory,
  };
}
