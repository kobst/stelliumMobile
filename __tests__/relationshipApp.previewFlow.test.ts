import { startRelationshipPreview } from '../RelationshipApp/src/screens/previewFlow';
import { createLocalRelationshipProfile } from '../RelationshipApp/src/mocks/demoData';
import { SubjectDocument } from '../shared/types/subject';

function makeTargetSubject(overrides: Partial<SubjectDocument> = {}): SubjectDocument {
  return {
    _id: 'target_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    kind: 'guest',
    ownerUserId: 'self_1',
    isCelebrity: false,
    isReadOnly: false,
    firstName: 'Taylor',
    lastName: 'Smith',
    dateOfBirth: '1995-01-01',
    placeOfBirth: 'Brooklyn, NY',
    totalOffsetHours: -5,
    ...overrides,
  };
}

describe('relationship app shared preview flow', () => {
  test('starts live celebrity preview with celebRelationship enabled', async () => {
    const mockPreview = {
      compositeChartId: 'rel_celeb_1',
      userA: { id: 'self_live_1', name: 'Alex Rivera' },
      userB: { id: 'celeb_1', name: 'Ariana Grande' },
      clusters: {
        Harmony: { score: 70 },
        Passion: { score: 65 },
        Connection: { score: 80 },
        Stability: { score: 55 },
        Growth: { score: 60 },
      },
      overall: {
        score: 70,
        tier: 'Flourishing',
        profile: 'Shared Frequency',
        summary: { label: 'Shared Frequency' },
      },
      scoredItems: [],
      initialOverview: 'Initial overview',
    };
    const enhancedRelationshipAnalysis = jest.fn().mockResolvedValue(mockPreview);

    const selfProfile = createLocalRelationshipProfile({
      firstName: 'Alex',
      lastName: 'Rivera',
      dateOfBirth: '1992-04-03',
      placeOfBirth: 'New York, NY',
      time: '12:00',
    });

    const result = await startRelationshipPreview(
      {
        selfProfile,
        targetSubject: makeTargetSubject({
          _id: 'celeb_1',
          kind: 'celebrity',
          isCelebrity: true,
          isReadOnly: true,
          ownerUserId: null,
          firstName: 'Ariana',
          lastName: 'Grande',
        }),
        targetType: 'celebrity',
        isLocalUxMode: false,
        relationshipHistory: [],
      },
      { enhancedRelationshipAnalysis }
    );

    expect(enhancedRelationshipAnalysis).toHaveBeenCalledWith(
      selfProfile.id,
      'celeb_1',
      selfProfile.id,
      true
    );
    expect(result.preview.compositeChartId).toBe('rel_celeb_1');
    expect(result.updatedHistory).toHaveLength(1);
    expect(result.updatedHistory[0]._id).toBe('rel_celeb_1');
    expect(result.updatedHistory[0].userB_id).toBe('celeb_1');
    expect(result.updatedHistory[0].isCelebrityRelationship).toBe(true);
  });

  test('creates a local preview history entry when running in local ux mode', async () => {
    const enhancedRelationshipAnalysis = jest.fn();
    const selfProfile = createLocalRelationshipProfile({
      firstName: 'Alex',
      lastName: 'Rivera',
      dateOfBirth: '1992-04-03',
      placeOfBirth: 'New York, NY',
      time: '12:00',
    });

    const result = await startRelationshipPreview(
      {
        selfProfile,
        targetSubject: makeTargetSubject(),
        targetType: 'person',
        isLocalUxMode: true,
        relationshipHistory: [],
      },
      { enhancedRelationshipAnalysis }
    );

    expect(enhancedRelationshipAnalysis).not.toHaveBeenCalled();
    expect(result.preview.success).toBe(true);
    expect(result.updatedHistory).toHaveLength(1);
    expect(result.updatedHistory[0]._id).toBe(result.preview.compositeChartId);
  });
});
