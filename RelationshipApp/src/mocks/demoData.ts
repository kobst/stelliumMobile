import {
  EnhancedRelationshipAnalysisResponse,
  RelationshipAnalysisResponse,
  UserCompositeChart,
} from '../../../shared/api/relationships';
import { RelationshipAppProfile, RELATIONSHIP_APP_DOMAIN } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';

function makeDateStamp(): string {
  return new Date().toISOString();
}

function createDemoSubject(input: {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time?: string;
  birthTimeUnknown?: boolean;
  ownerUserId?: string | null;
  kind: 'accountSelf' | 'guest';
}): SubjectDocument {
  return {
    _id: input.id,
    createdAt: makeDateStamp(),
    updatedAt: makeDateStamp(),
    kind: input.kind,
    ownerUserId: input.ownerUserId ?? null,
    isCelebrity: false,
    isReadOnly: false,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    placeOfBirth: input.placeOfBirth,
    time: input.time,
    birthTimeUnknown: input.birthTimeUnknown,
    totalOffsetHours: -5,
    appDomain: RELATIONSHIP_APP_DOMAIN,
    firebaseUid: input.kind === 'accountSelf' ? 'local-demo-user' : null,
  };
}

export function createLocalRelationshipProfile(input: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time?: string;
  birthTimeUnknown?: boolean;
}): RelationshipAppProfile {
  const subject = createDemoSubject({
    id: 'local-self-profile',
    kind: 'accountSelf',
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dateOfBirth: input.dateOfBirth,
    placeOfBirth: input.placeOfBirth,
    time: input.time,
    birthTimeUnknown: input.birthTimeUnknown,
  });

  return {
    id: subject._id,
    appDomain: RELATIONSHIP_APP_DOMAIN,
    firebaseUid: 'local-demo-user',
    firstName: subject.firstName,
    lastName: subject.lastName,
    displayName: `${subject.firstName} ${subject.lastName}`.trim(),
    dateOfBirth: subject.dateOfBirth,
    placeOfBirth: subject.placeOfBirth,
    time: subject.time,
    birthTimeUnknown: subject.birthTimeUnknown,
    totalOffsetHours: subject.totalOffsetHours,
    subject,
    backendAppDomain: RELATIONSHIP_APP_DOMAIN,
    isDomainExplicit: true,
  };
}

export function createLocalPartnerSubject(input: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time?: string;
  birthTimeUnknown?: boolean;
  ownerUserId: string;
}): SubjectDocument {
  return createDemoSubject({
    id: `local-guest-${Date.now()}`,
    kind: 'guest',
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dateOfBirth: input.dateOfBirth,
    placeOfBirth: input.placeOfBirth,
    time: input.time,
    birthTimeUnknown: input.birthTimeUnknown,
    ownerUserId: input.ownerUserId,
  });
}

export function createLocalPreviewAnalysis(params: {
  selfProfile: RelationshipAppProfile;
  partner: SubjectDocument;
  isCelebrityRelationship?: boolean;
}): EnhancedRelationshipAnalysisResponse {
  const compositeChartId = `local-relationship-${Date.now()}`;

  return {
    success: true,
    compositeChartId,
    userA: { id: params.selfProfile.id, name: params.selfProfile.displayName },
    userB: { id: params.partner._id, name: `${params.partner.firstName} ${params.partner.lastName}`.trim() },
    clusters: {
      Harmony: {
        score: 82,
        rawScore: 8.2,
        supportPct: 74,
        challengePct: 26,
        heatPct: 61,
        activityPct: 67,
        sparkElements: 3,
        quadrant: 'Easy-going',
        keystoneAspects: [],
      },
      Passion: {
        score: 76,
        rawScore: 7.6,
        supportPct: 63,
        challengePct: 37,
        heatPct: 80,
        activityPct: 71,
        sparkElements: 4,
        quadrant: 'Dynamic',
        keystoneAspects: [],
      },
      Connection: {
        score: 79,
        rawScore: 7.9,
        supportPct: 70,
        challengePct: 30,
        heatPct: 65,
        activityPct: 73,
        sparkElements: 2,
        quadrant: 'Easy-going',
        keystoneAspects: [],
      },
      Stability: {
        score: 68,
        rawScore: 6.8,
        supportPct: 56,
        challengePct: 44,
        heatPct: 49,
        activityPct: 58,
        sparkElements: 1,
        quadrant: 'Dynamic',
        keystoneAspects: [],
      },
      Growth: {
        score: 74,
        rawScore: 7.4,
        supportPct: 60,
        challengePct: 40,
        heatPct: 64,
        activityPct: 69,
        sparkElements: 2,
        quadrant: 'Dynamic',
        keystoneAspects: [],
      },
    },
    overall: {
      score: 76,
      formula: 'Local UX demo score',
      dominantCluster: 'Harmony',
      challengeCluster: 'Stability',
      profile: 'Strong attraction with steady emotional support',
      tier: 'Flourishing',
      strengthClusters: ['Harmony', 'Connection'],
      growthClusters: ['Stability'],
      quadrantAnalytics: {
        distribution: {},
        entropy: 1.1,
        dominantQuadrant: 'Dynamic',
        uniformity: 'Moderate',
      },
      keystoneAspects: [],
    },
    scoredItems: [],
    initialOverview:
      'You feel easy emotional warmth together, with enough spark and difference to keep the relationship compelling.',
    tensionFlowAnalysis: {
      supportDensity: 0.7,
      challengeDensity: 0.3,
      polarityRatio: 2.3,
      quadrant: 'Dynamic',
      totalAspects: 12,
      supportAspects: 8,
      challengeAspects: 4,
      keystoneAspects: [],
      insight: {
        quadrant: 'Dynamic',
        description: 'The relationship combines comfort with enough tension to stay alive.',
        recommendations: ['Name conflict early', 'Protect time for closeness'],
      },
    },
    compositeChart: {
      planets: [],
      houses: [],
      aspects: [],
      houseSystem: 'placidus',
      hasAccurateBirthTimes: !params.partner.birthTimeUnknown && !params.selfProfile.birthTimeUnknown,
    },
    synastryAspects: [],
    synastryHousePlacements: { AinB: [], BinA: [] },
    status: 'scores_calculated',
    metadata: {
      processingTime: 'local',
      clustersAnalyzed: 5,
      totalScoredItems: 12,
      workflowType: 'direct-cluster-scoring',
      version: 'local-demo',
      isCelebrityRelationship: params.isCelebrityRelationship ?? false,
      initialOverviewGenerated: true,
    },
  };
}

export function createLocalFullAnalysis(
  preview: EnhancedRelationshipAnalysisResponse
): RelationshipAnalysisResponse {
  const clusterEntries = Object.keys(preview.clusters).reduce<Record<string, any>>((acc, key) => {
    acc[key] = {
      synastry: {
        supportPanel: `${key} feels naturally supported when you slow down and notice what already works between you.`,
        challengePanel: `${key} gets strained when assumptions replace direct communication.`,
        synthesisPanel: `${key} grows when you make expectations explicit and repair quickly.`,
      },
      composite: {
        supportPanel: `Together you create a shared ${key.toLowerCase()} pattern that can feel grounded and encouraging.`,
        challengePanel: `The shared ${key.toLowerCase()} pattern becomes harder when one of you overfunctions for the relationship.`,
        synthesisPanel: `Your best results come from treating ${key.toLowerCase()} as something you build deliberately together.`,
      },
      generatedAt: makeDateStamp(),
      panelFormat: 'text',
      workflowType: 'local-demo',
    };
    return acc;
  }, {});

  return {
    overall: preview.overall,
    initialOverview: preview.initialOverview,
    holisticOverview:
      'This full read suggests a relationship with strong emotional ease, good conversational chemistry, and enough productive friction to support long-term growth if both people stay honest.',
    completeAnalysis: clusterEntries,
    clusterScoring: {
      clusters: preview.clusters,
      overall: preview.overall,
      scoredItems: preview.scoredItems,
    },
    tensionFlowAnalysis: preview.tensionFlowAnalysis,
    userA_name: preview.userA.name,
    userB_name: preview.userB.name,
  };
}

export function createLocalHistoryEntry(params: {
  preview: EnhancedRelationshipAnalysisResponse;
  fullAnalysis?: RelationshipAnalysisResponse | null;
}): UserCompositeChart {
  return {
    _id: params.preview.compositeChartId,
    userA_name: params.preview.userA.name,
    userB_name: params.preview.userB.name,
    userA_dateOfBirth: '',
    userB_dateOfBirth: '',
    createdAt: makeDateStamp(),
    clusterScoring: {
      clusters: params.preview.clusters,
      overall: params.preview.overall,
      scoredItems: params.preview.scoredItems,
    },
    completeAnalysis: params.fullAnalysis?.completeAnalysis,
    initialOverview: params.preview.initialOverview ?? undefined,
    relationshipAnalysisStatus: {
      level: params.fullAnalysis ? 'complete' : 'scores',
      tier: params.preview.overall.tier,
      profile: params.preview.overall.profile,
      clusterScores: {
        Harmony: Math.round(params.preview.clusters.Harmony.score),
        Passion: Math.round(params.preview.clusters.Passion.score),
        Connection: Math.round(params.preview.clusters.Connection.score),
        Growth: Math.round(params.preview.clusters.Growth.score),
        Stability: Math.round(params.preview.clusters.Stability.score),
      },
      hasClusterAnalysis: Boolean(params.fullAnalysis?.completeAnalysis),
    },
  };
}
