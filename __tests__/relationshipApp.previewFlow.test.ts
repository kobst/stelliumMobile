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
    const enhancedRelationshipAnalysis = jest.fn().mockResolvedValue({
      compositeChartId: 'rel_celeb_1',
    });

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
    expect(result.updatedHistory).toEqual([]);
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
