# Relationship App Onboarding API Guide

This guide documents the staged onboarding flow for the relationship app.

It covers:
- The purpose of each onboarding endpoint
- Exact request and response shapes
- Which fields the mobile app should render directly
- Status transitions
- Recommended frontend orchestration
- Failure and retry behavior

This is the current implementation in dev/prod as of April 10, 2026.

## Overview

The onboarding flow is intentionally split into three steps:

1. `POST /relationship-app/onboarding-preview`
2. `POST /relationship-app/onboarding-preview/:previewId/celeb-matches`
3. `POST /relationship-app/onboarding-preview/:previewId/celeb-annotations`

There is also one read endpoint:

4. `GET /relationship-app/onboarding-preview/:previewId/celeb-matches?claimToken=...`

And one final claim endpoint:

5. `POST /relationship-app/onboarding-claim`

The split exists for performance:
- Step 1 returns the user chart and romantic overview first
- Step 2 computes the celebrity aspect bank without waiting on LLM copy
- Step 3 starts annotation generation asynchronously and returns immediately
- The frontend polls the `GET` endpoint until annotations are ready

## Frontend Contract

For mobile, the backend now exposes two parallel views of the same onboarding celebrity data:

- `topAspects`
- `topCelebMatches`

The frontend should treat them differently:

- `topCelebMatches` is the primary UI payload for the 3 surfaced onboarding celebrity cards
- `topAspects` is the source-compatible aspect-bucket payload that remains available for analytics, debugging, and backward compatibility

In other words:

- Render celeb cards from `topCelebMatches`
- Do not try to reconstruct the 3 cards by walking `topAspects[].matches[0]`
- Use `topAspects` only if you explicitly need the bucketed aspect-bank representation

Each `topCelebMatches[]` item represents:

- the same already-selected surfaced celebrity
- the selected onboarding aspect used for copy
- the annotation generated from that selected aspect
- the 5 cluster scores plus `overall`

This field is additive. It does not change selection behavior, ranking behavior, or annotation behavior.

## Data Model Summary

Each onboarding preview is stored as a temporary `accountSelf` subject in the `relationship-app` domain.

The preview is identified by:
- `previewId`
- `claimToken`

These two values are the contract that ties every onboarding request to the same temporary subject document.

The temporary subject stores:
- Birth chart
- Romantic overview
- `relationshipApp.celebAspectBank`
- `relationshipApp.onboarding.celebMatchesStatus`
- `relationshipApp.onboarding.celebAnnotationsStatus`
- `onboardingPreview.claimToken`
- `onboardingPreview.isPreview`

## Status Objects

Both staged operations return the same status shape:

```json
{
  "status": "pending",
  "startedAt": null,
  "completedAt": null,
  "error": null,
  "lastRequestedAt": null
}
```

Possible `status` values:
- `pending`
- `running`
- `completed`
- `failed`

There are two independent status objects:
- `celebMatchesStatus`
- `celebAnnotationsStatus`

## Canonical Response Schema

The backend shape for onboarding celebrity aspect buckets is:

```ts
type AsyncStatus = {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  lastRequestedAt: string | null;
};

type PlacementSummary = {
  planet: string;
  sign: string | null;
  house: number | null;
  display: string;
  compactDisplay: string;
};

type MatchAnnotation = {
  title: string;
  sentence: string;
  generatedBy: 'llm';
  version: 'v1';
};

type CelebAspectMatch = {
  celebId: string;
  celebName: string | null;
  profilePhotoUrl: string | null;
  orb: number;
  userPlacement: PlacementSummary;
  celebPlacement: PlacementSummary;
  annotation?: MatchAnnotation;
};

type CelebAspectBucket = {
  aspectType: string;
  label: string;
  shortMeaning: string;
  primaryCluster: string;
  clusterThemes: string[];
  weight: number;
  maxOrb: number;
  score: number;
  matchCount: number;
  sweetSpotPenalty: number;
  averageOrb: number | null;
  matches: CelebAspectMatch[];
};

type CelebAspectBank = {
  version: string;
  configVersion: string;
  computedAt: string;
  lastCelebSyncAt: string;
  celebGenderFilter: 'all' | 'male' | 'female';
  celebrityCountScanned: number;
  aspectCountConfigured: number;
  annotationStrategy: 'llm-v1' | 'none';
  annotationRefreshNeeded: boolean;
  topAspects: CelebAspectBucket[];
  fullBank: CelebAspectBucket[];
  topCelebMatches: TopCelebMatch[];
};

type TopCelebMatch = {
  key: string;
  celebId: string;
  celebName: string | null;
  profilePhotoUrl: string | null;
  selectedAspect: {
    aspectType: string;
    label: string;
    shortMeaning: string;
    primaryCluster: string;
    clusterThemes: string[];
    orb: number;
    userPlacement: PlacementSummary;
    celebPlacement: PlacementSummary;
    annotation?: MatchAnnotation;
  };
  annotation?: MatchAnnotation;
  clusterScores: {
    Harmony: number;
    Passion: number;
    Connection: number;
    Stability: number;
    Growth: number;
    overall: number;
  } | null;
  archetype: {
    version: string;
    archetypeKey: string;
    label: string;
    blurb: string;
    blurbRendering?: {
      source: 'template' | 'llm' | 'template_fallback' | 'cached';
      version: string;
      decisionHash: string;
      decisionVersion: string;
      model?: string;
      generatedAt?: string;
      fallbackReason?: string;
    };
    headline?: {
      strengthScore: number;
      flavorCluster: 'Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth' | null;
      flavorPresent: boolean;
      topCluster: 'Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth';
      secondCluster: 'Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth';
      topBoundaryGap: number;
      topBoundaryThreshold: number;
    };
    dominantClusters: string[];
    supportClusters: string[];
    tensionClusters: string[];
    shape: 'balanced' | 'polarized' | 'concentrated' | 'flat' | 'conflicted';
    tone: 'steady' | 'easy' | 'magnetic' | 'growth-heavy' | 'volatile' | 'mixed';
    resolvedLabel?: string;
    resolvedArchetypeKey?: string;
    resolvedLevel?: 'leaf' | 'family' | 'substrate';
    resolvedFamily?: string;
    confidence: number;
  } | null;
};
```

Important:
- Aspect buckets use `label` and `shortMeaning`
- They do not use `title` and `description`
- Only match-level `annotation` uses `title`
- `celebAspectBank` is nullable during early onboarding states
- `topAspects` is always present and is an empty array until matches exist
- `topCelebMatches` is a normalized 3-card view of the currently surfaced matches
- `topCelebMatches` preserves the existing aspect-based selection and annotation behavior while adding 5-cluster scores per surfaced celebrity
- `topCelebMatches` now also includes the derived relationship archetype for each surfaced celebrity match, using the v4/resolved summary fields when scoring returns them
- For the mobile reveal UI, `topCelebMatches` should be treated as the canonical field
- Archetype headlines follow the A-4 contract: render continuous `archetype.headline.strengthScore` plus an optional `archetype.headline.flavorCluster` tag when `archetype.headline.flavorPresent === true`; do not render a discretized strength word or tier in the headline
- `resolvedLabel` and substrate labels such as `Low Broad Connection` are internal/detail-tier labels. Do not render them on onboarding cards/lists as consumer labels; if `resolvedLevel === "substrate"`, use the strength visual instead. Leaf/family evocative labels may be shown in detail contexts.
- `archetype.blurb` is rendered copy with a validated fallback path. Display the returned copy, but do not infer headline shape, dominance, or numeric score claims from the prose.

## High-Level Flow

Recommended frontend sequence:

1. Submit onboarding form to `POST /relationship-app/onboarding-preview`
2. Render the returned `overview` immediately
3. Start `POST /relationship-app/onboarding-preview/:previewId/celeb-matches`
4. When matches are ready, render `topCelebMatches`
5. Start `POST /relationship-app/onboarding-preview/:previewId/celeb-annotations`
6. Poll `GET /relationship-app/onboarding-preview/:previewId/celeb-matches?claimToken=...`
7. Replace the loading state in the celeb section when `celebAnnotationsStatus.status === "completed"`
8. When the user signs up or logs in, call `POST /relationship-app/onboarding-claim`

## 1. Create Onboarding Preview

### Endpoint

`POST /relationship-app/onboarding-preview`

### Auth

No Firebase auth required.

This endpoint is intended for pre-signup onboarding.

### Purpose

Creates a temporary preview subject, generates the user birth chart, and generates the romantic overview.

This call does not compute celebrity matches and does not generate annotations.

### Request Body

```json
{
  "firstName": "Edward",
  "lastName": "Han",
  "gender": "male",
  "preferredPartnerGender": "female",
  "placeOfBirth": "New York, NY",
  "dateOfBirth": "1990-01-15",
  "time": "13:45",
  "lat": "40.7128",
  "lon": "-74.0060",
  "tzone": "-5",
  "totalOffsetHours": -5,
  "profilePhotoUrl": "https://example.com/profile.jpg"
}
```

### Required Fields

- `firstName`
- `lastName`
- `dateOfBirth`
- `placeOfBirth`
- `lat`
- `lon`
- `tzone`

### Optional Fields

- `gender`
- `preferredPartnerGender`
- `time`
- `totalOffsetHours`
- `profilePhotoUrl`

### Notes

- If `time` is omitted, the backend creates an unknown-time chart and sets `birthTimeUnknown: true`.
- `preferredPartnerGender` is currently used when generating celeb matches.
- `previewId` and `claimToken` must be persisted by the frontend. They are required for every later preview-scoped request.

### Response

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "claimToken": "651f922f-7ba7-45ed-bd3d-f444ba5d60a1",
  "user": {
    "_id": "69d99949297fc507cd250b65",
    "firstName": "Edward",
    "lastName": "Han",
    "gender": "male",
    "preferredPartnerGender": "female",
    "kind": "accountSelf",
    "appDomain": "relationship-app"
  },
  "birthChart": {
    "...": "full chart payload"
  },
  "overview": "Romance-focused overview text",
  "referencedCodes": ["Pp-...", "A-..."],
  "celebMatchesStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAnnotationsStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAspectBank": null,
  "topAspects": [],
  "topCelebMatches": [],
  "overviewMode": "romantic",
  "status": "onboarding_preview_created"
}
```

### Frontend Use

Use this response to:
- Navigate to the reveal screen immediately
- Render the romantic overview immediately
- Cache `previewId` and `claimToken`
- Start the celeb matches request in the background

## 2. Generate Celebrity Matches

### Endpoint

`POST /relationship-app/onboarding-preview/:previewId/celeb-matches`

### Auth

No Firebase auth required.

This endpoint is authorized by `claimToken`.

### Purpose

Computes and stores the celebrity aspect bank for the preview subject.

This call does not wait on LLM annotations.

### Path Params

- `previewId`

### Request Body

```json
{
  "claimToken": "651f922f-7ba7-45ed-bd3d-f444ba5d60a1"
}
```

### Behavior

- If matches have not started, the backend marks the preview as `running`, computes the bank, stores it, and returns `200`
- If another request is already computing matches, the endpoint can return `202`
- If matches are already done, the endpoint returns the stored bank and `200`

### Response

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "completed",
    "startedAt": "2026-04-11T00:44:09.045Z",
    "completedAt": "2026-04-11T00:44:09.200Z",
    "error": null,
    "lastRequestedAt": "2026-04-11T00:44:09.045Z"
  },
  "celebAnnotationsStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAspectBank": {
    "version": "v2",
    "configVersion": "v2",
    "computedAt": "2026-04-11T00:44:09.190Z",
    "lastCelebSyncAt": "2026-04-11T00:44:09.190Z",
    "annotationStrategy": "none",
    "annotationRefreshNeeded": true,
    "topAspects": [
      {
        "aspectType": "moon_venus_trine",
        "label": "Moon-Venus trine",
        "shortMeaning": "sweet affection",
        "primaryCluster": "Harmony",
        "score": 0.91,
        "matches": [
          {
            "celebId": "celebrity-subject-id",
            "celebName": "Ariana Grande",
            "profilePhotoUrl": "https://example.com/ariana.jpg",
            "orb": 0.42,
            "userPlacement": {
              "planet": "Moon",
              "sign": "Virgo",
              "house": 4,
              "display": "Moon in Virgo in the 4th house",
              "compactDisplay": "Moon in Virgo"
            },
            "celebPlacement": {
              "planet": "Venus",
              "sign": "Taurus",
              "house": 8,
              "display": "Venus in Taurus in the 8th house",
              "compactDisplay": "Venus in Taurus"
            }
          }
        ]
      }
    ],
    "fullBank": [
      {
        "...": "all ranked aspect buckets"
      }
    ],
    "topCelebMatches": [
      {
        "key": "moon_venus_trine:celebrity-subject-id",
        "celebId": "celebrity-subject-id",
        "celebName": "Ariana Grande",
        "profilePhotoUrl": "https://example.com/ariana.jpg",
        "selectedAspect": {
          "aspectType": "moon_venus_trine",
          "label": "Moon-Venus trine",
          "shortMeaning": "sweet affection",
          "primaryCluster": "Harmony",
          "clusterThemes": ["Harmony"],
          "orb": 0.42,
          "userPlacement": {
            "planet": "Moon",
            "sign": "Virgo",
            "house": 4,
            "display": "Moon in Virgo in the 4th house",
            "compactDisplay": "Moon in Virgo"
          },
          "celebPlacement": {
            "planet": "Venus",
            "sign": "Taurus",
            "house": 8,
            "display": "Venus in Taurus in the 8th house",
            "compactDisplay": "Venus in Taurus"
          }
        },
        "clusterScores": {
          "Harmony": 78,
          "Passion": 61,
          "Connection": 54,
          "Stability": 69,
          "Growth": 47,
          "overall": 64
        },
        "archetype": {
          "version": "archetype-summary-v4-shape-family",
          "archetypeKey": "steady_hearth",
          "label": "Steady Hearth",
          "blurb": "This connection has a steady center with enough warmth to feel reliable without becoming static.",
          "blurbRendering": {
            "source": "template",
            "version": "relationship-archetype-llm-blurb-v3",
            "decisionHash": "abc123def4567890",
            "decisionVersion": "relationship-archetype-blurb-decision-v1"
          },
          "headline": {
            "strengthScore": 64,
            "flavorCluster": null,
            "flavorPresent": false,
            "topCluster": "Harmony",
            "secondCluster": "Stability",
            "topBoundaryGap": 9,
            "topBoundaryThreshold": 12.5
          },
          "dominantClusters": ["Harmony", "Stability"],
          "supportClusters": ["Harmony", "Stability"],
          "tensionClusters": ["Growth"],
          "shape": "balanced",
          "tone": "steady",
          "resolvedLabel": "Steady Hearth",
          "resolvedArchetypeKey": "steady_hearth",
          "resolvedLevel": "leaf",
          "resolvedFamily": "Harmony+Stability / Growth low",
          "confidence": 0.82
        }
      }
    ]
  },
  "topAspects": [
    {
      "...": "same entries as celebAspectBank.topAspects"
    }
  ],
  "topCelebMatches": [
    {
      "...": "same entries as celebAspectBank.topCelebMatches"
    }
  ],
  "status": "celeb_matches_ready"
}
```

### Important Notes

- Match generation currently returns the top 3 aspects in `topAspects`
- Match generation also returns the same 3 surfaced celeb cards in `topCelebMatches`
- Matches do not include template annotations
- Before annotation generation completes, the `annotation` field is absent from matches
- The full bank is stored, but the frontend should treat `topCelebMatches` as the primary onboarding payload
- `selectedAspect` is the exact aspect used to pick the surfaced celeb and later generate annotation copy
- `clusterScores` are already computed at match-generation time; the frontend does not need to wait for annotations to read scores
- `archetype` is already computed at match-generation time; the frontend does not need to wait for annotations to read the archetype label or blurb
- `archetype.headline` is the primary headline contract when present: continuous `strengthScore`, optional flavor tag only when `flavorPresent === true`, no discretized strength word/tier

## 3. Start Celebrity Annotation Generation

### Endpoint

`POST /relationship-app/onboarding-preview/:previewId/celeb-annotations`

### Auth

No Firebase auth required.

This endpoint is authorized by `claimToken`.

### Purpose

Starts LLM annotation generation for the top onboarding matches.

This endpoint is asynchronous. It does not wait for Gemini to finish.

### Path Params

- `previewId`

### Request Body

```json
{
  "claimToken": "651f922f-7ba7-45ed-bd3d-f444ba5d60a1"
}
```

### Behavior

- If matches are not completed, the endpoint returns `409`
- If annotations are already completed, the endpoint returns `200`
- If annotations are already running, the endpoint returns `202`
- Otherwise, the endpoint marks the preview annotation job as `running`, enqueues a background Lambda, and returns `202`

### Typical Response While Starting

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "completed",
    "startedAt": "2026-04-11T00:44:09.045Z",
    "completedAt": "2026-04-11T00:44:09.190Z",
    "error": null,
    "lastRequestedAt": "2026-04-11T00:44:09.045Z"
  },
  "celebAnnotationsStatus": {
    "status": "running",
    "startedAt": "2026-04-11T00:44:19.363Z",
    "completedAt": null,
    "error": null,
    "lastRequestedAt": "2026-04-11T00:44:19.363Z"
  },
  "celebAspectBank": {
    "...": "same stored bank returned by celeb-matches"
  },
  "topAspects": [
    {
      "...": "same entries as celebAspectBank.topAspects"
    }
  ],
  "topCelebMatches": [
    {
      "...": "same entries as celebAspectBank.topCelebMatches"
    }
  ],
  "status": "celeb_annotations_running"
}
```

### Important Notes

- The annotation worker currently generates annotations for the top 3 onboarding aspect buckets only
- Within each of those top aspects, only the top-ranked match is annotated
- That means the expected maximum on onboarding is 3 annotation objects total
- Annotation copy is generated by Gemini, not by template fallback

## 4. Poll Matches and Annotation Status

### Endpoint

`GET /relationship-app/onboarding-preview/:previewId/celeb-matches?claimToken=...`

### Auth

No Firebase auth required.

This endpoint is authorized by `claimToken`.

### Purpose

Returns the current preview-scoped celebrity bank plus both status objects.

The frontend should use this endpoint to poll while annotations are being generated.

### Query Params

- `claimToken`

### Response States

#### Matches not started yet

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "pending"
  },
  "celebAnnotationsStatus": {
    "status": "pending"
  },
  "celebAspectBank": null,
  "topAspects": [],
  "topCelebMatches": [],
  "status": "celeb_matches_pending"
}
```

#### Matches ready, annotations not started

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "completed"
  },
  "celebAnnotationsStatus": {
    "status": "pending"
  },
  "celebAspectBank": {
    "...": "bank without annotation fields"
  },
  "topAspects": [
    {
      "...": "top aspects"
    }
  ],
  "topCelebMatches": [
      {
        "...": "top surfaced celeb cards without annotation"
      }
  ],
  "status": "celeb_matches_ready"
}
```

#### Annotations running

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "completed"
  },
  "celebAnnotationsStatus": {
    "status": "running"
  },
  "celebAspectBank": {
    "...": "bank still without annotations or partially enriched"
  },
  "topAspects": [
    {
      "...": "top aspects"
    }
  ],
  "topCelebMatches": [
      {
        "...": "top surfaced celeb cards, cluster scores and archetype present, annotation may still be absent"
      }
  ],
  "status": "celeb_annotations_running"
}
```

#### Annotations completed

```json
{
  "success": true,
  "previewId": "69d99949297fc507cd250b65",
  "celebMatchesStatus": {
    "status": "completed"
  },
  "celebAnnotationsStatus": {
    "status": "completed"
  },
  "celebAspectBank": {
    "topAspects": [
      {
        "aspectType": "moon_venus_trine",
        "label": "Moon-Venus trine",
        "shortMeaning": "sweet affection",
        "matches": [
          {
            "celebId": "celebrity-subject-id",
            "celebName": "Ariana Grande",
            "orb": 0.42,
            "userPlacement": {
              "compactDisplay": "Moon in Virgo"
            },
            "celebPlacement": {
              "compactDisplay": "Venus in Taurus"
            },
            "annotation": {
              "title": "Moon-Venus trine · sweet affection",
              "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
              "generatedBy": "llm",
              "version": "v1"
            }
          }
        ]
      }
    ],
    "topCelebMatches": [
      {
        "key": "moon_venus_trine:celebrity-subject-id",
        "celebId": "celebrity-subject-id",
        "celebName": "Ariana Grande",
        "profilePhotoUrl": "https://example.com/ariana.jpg",
        "selectedAspect": {
          "aspectType": "moon_venus_trine",
          "label": "Moon-Venus trine",
          "shortMeaning": "sweet affection",
          "primaryCluster": "Harmony",
          "clusterThemes": ["Harmony"],
          "orb": 0.42,
          "userPlacement": {
            "compactDisplay": "Moon in Virgo"
          },
          "celebPlacement": {
            "compactDisplay": "Venus in Taurus"
          },
          "annotation": {
            "title": "Moon-Venus trine · sweet affection",
            "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
            "generatedBy": "llm",
            "version": "v1"
          }
        },
        "annotation": {
          "title": "Moon-Venus trine · sweet affection",
          "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
          "generatedBy": "llm",
          "version": "v1"
        },
        "clusterScores": {
          "Harmony": 78,
          "Passion": 61,
          "Connection": 54,
          "Stability": 69,
          "Growth": 47,
          "overall": 64
        },
        "archetype": {
          "version": "archetype-summary-v4-shape-family",
          "archetypeKey": "steady_hearth",
          "label": "Steady Hearth",
          "blurb": "This connection has a steady center with enough warmth to feel reliable without becoming static.",
          "blurbRendering": {
            "source": "template",
            "version": "relationship-archetype-llm-blurb-v3",
            "decisionHash": "abc123def4567890",
            "decisionVersion": "relationship-archetype-blurb-decision-v1"
          },
          "headline": {
            "strengthScore": 64,
            "flavorCluster": null,
            "flavorPresent": false,
            "topCluster": "Harmony",
            "secondCluster": "Stability",
            "topBoundaryGap": 9,
            "topBoundaryThreshold": 12.5
          },
          "dominantClusters": ["Harmony", "Stability"],
          "supportClusters": ["Harmony", "Stability"],
          "tensionClusters": ["Growth"],
          "shape": "balanced",
          "tone": "steady",
          "resolvedLabel": "Steady Hearth",
          "resolvedArchetypeKey": "steady_hearth",
          "resolvedLevel": "leaf",
          "resolvedFamily": "Harmony+Stability / Growth low",
          "confidence": 0.82
        }
      }
    ]
  },
  "topAspects": [
    {
      "...": "same entries as celebAspectBank.topAspects"
    }
  ],
  "topCelebMatches": [
    {
      "...": "same entries as celebAspectBank.topCelebMatches"
    }
  ],
  "status": "celeb_annotations_ready"
}
```

### Frontend Rendering Rules

- Render the 3 celebrity onboarding cards from `topCelebMatches`
- Read the compatibility bars, pills, or score chips from `topCelebMatches[i].clusterScores`
- Read the primary archetype headline from `topCelebMatches[i].archetype.headline`: continuous `strengthScore` plus optional `flavorCluster` when `flavorPresent === true`
- Read the archetype label and blurb from `topCelebMatches[i].archetype`, but treat resolved/substrate labels as detail-tier labels, not card/list titles
- Read the surfaced copy from `topCelebMatches[i].annotation` when present
- If `annotation` is absent, use `selectedAspect.label`, `selectedAspect.shortMeaning`, and placements to render loading or fallback UI
- If you need the exact aspect metadata that drove the card, use `topCelebMatches[i].selectedAspect`
- Do not assume `topAspects[i]` and `topCelebMatches[i]` must be joined client-side

### Frontend Polling Recommendation

- Start polling immediately after `POST /celeb-annotations` returns `202`
- Poll every 2 to 3 seconds
- Stop polling when:
  - `celebAnnotationsStatus.status === "completed"`
  - `celebAnnotationsStatus.status === "failed"`
- Also stop if the user leaves onboarding

## 5. Claim Preview into the Authenticated Account

### Endpoint

`POST /relationship-app/onboarding-claim`

### Auth

Requires Firebase auth via `verifyFirebaseToken`.

### Purpose

Converts the temporary preview subject into the authenticated user’s relationship-app `accountSelf`.

This keeps the same subject document and attaches:
- `firebaseUid`
- `email`
- permanent account ownership

### Request Body

```json
{
  "previewId": "69d99949297fc507cd250b65",
  "claimToken": "651f922f-7ba7-45ed-bd3d-f444ba5d60a1"
}
```

### Response

```json
{
  "success": true,
  "user": {
    "_id": "69d99949297fc507cd250b65",
    "firstName": "Edward",
    "lastName": "Han",
    "kind": "accountSelf",
    "appDomain": "relationship-app",
    "firebaseUid": "firebase-user-id"
  },
  "userId": "69d99949297fc507cd250b65",
  "birthChart": {
    "...": "chart payload"
  },
  "overview": "Romance-focused overview text",
  "referencedCodes": ["Pp-...", "A-..."],
  "celebMatchesStatus": {
    "status": "completed"
  },
  "celebAnnotationsStatus": {
    "status": "completed"
  },
  "celebAspectBank": {
    "...": "stored bank"
  },
  "topAspects": [
    {
      "...": "same entries as celebAspectBank.topAspects"
    }
  ],
  "topCelebMatches": [
    {
      "...": "same entries as celebAspectBank.topCelebMatches"
    }
  ],
  "overviewMode": "romantic",
  "status": "onboarding_preview_claimed"
}
```

### Important Notes

- If the Firebase user already has a different `relationship-app` account, this returns `409`
- The claim endpoint returns whatever overview and celeb bank are already stored on the preview subject
- Claiming does not rerun overview, matches, or annotations

## Match Object Shape

Each match inside `topAspects[].matches[]` uses this structure:

```json
{
  "celebId": "celebrity-subject-id",
  "celebName": "Ariana Grande",
  "profilePhotoUrl": "https://example.com/ariana.jpg",
  "orb": 0.42,
  "userPlacement": {
    "planet": "Moon",
    "sign": "Virgo",
    "house": 4,
    "display": "Moon in Virgo in the 4th house",
    "compactDisplay": "Moon in Virgo"
  },
  "celebPlacement": {
    "planet": "Venus",
    "sign": "Taurus",
    "house": 8,
    "display": "Venus in Taurus in the 8th house",
    "compactDisplay": "Venus in Taurus"
  },
  "annotation": {
    "title": "Moon-Venus trine · sweet affection",
    "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
    "generatedBy": "llm",
    "version": "v1"
  }
}
```

Notes:
- `annotation` is omitted until LLM generation completes
- `generatedBy` is always `llm` for onboarding annotations
- There is no template fallback in the current flow

## TopCelebMatch Object Shape

Each surfaced onboarding celebrity card inside `topCelebMatches[]` uses this structure:

```json
{
  "key": "moon_venus_trine:celebrity-subject-id",
  "celebId": "celebrity-subject-id",
  "celebName": "Ariana Grande",
  "profilePhotoUrl": "https://example.com/ariana.jpg",
  "selectedAspect": {
    "aspectType": "moon_venus_trine",
    "label": "Moon-Venus trine",
    "shortMeaning": "sweet affection",
    "primaryCluster": "Harmony",
    "clusterThemes": ["Harmony"],
    "orb": 0.42,
    "userPlacement": {
      "planet": "Moon",
      "sign": "Virgo",
      "house": 4,
      "display": "Moon in Virgo in the 4th house",
      "compactDisplay": "Moon in Virgo"
    },
    "celebPlacement": {
      "planet": "Venus",
      "sign": "Taurus",
      "house": 8,
      "display": "Venus in Taurus in the 8th house",
      "compactDisplay": "Venus in Taurus"
    },
    "annotation": {
      "title": "Moon-Venus trine · sweet affection",
      "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
      "generatedBy": "llm",
      "version": "v1"
    }
  },
  "annotation": {
    "title": "Moon-Venus trine · sweet affection",
    "sentence": "Your Moon in Virgo trades the urge to fix everything for the stubborn physical ease of Ariana's Venus in Taurus, leaving a profound stillness that demands total surrender.",
    "generatedBy": "llm",
    "version": "v1"
  },
  "clusterScores": {
    "Harmony": 78,
    "Passion": 61,
    "Connection": 54,
    "Stability": 69,
    "Growth": 47,
    "overall": 64
  },
  "archetype": {
    "version": "archetype-summary-v4-shape-family",
    "archetypeKey": "steady_hearth",
    "label": "Steady Hearth",
    "blurb": "This connection has a steady center with enough warmth to feel reliable without becoming static.",
    "blurbRendering": {
      "source": "template",
      "version": "relationship-archetype-llm-blurb-v3",
      "decisionHash": "abc123def4567890",
      "decisionVersion": "relationship-archetype-blurb-decision-v1"
    },
    "headline": {
      "strengthScore": 64,
      "flavorCluster": null,
      "flavorPresent": false,
      "topCluster": "Harmony",
      "secondCluster": "Stability",
      "topBoundaryGap": 9,
      "topBoundaryThreshold": 12.5
    },
    "dominantClusters": ["Harmony", "Stability"],
    "supportClusters": ["Harmony", "Stability"],
    "tensionClusters": ["Growth"],
    "shape": "balanced",
    "tone": "steady",
    "resolvedLabel": "Steady Hearth",
    "resolvedArchetypeKey": "steady_hearth",
    "resolvedLevel": "leaf",
    "resolvedFamily": "Harmony+Stability / Growth low",
    "confidence": 0.82
  }
}
```

Notes:

- `selectedAspect` is the canonical aspect object for the surfaced card
- `annotation` at the top level is duplicated for convenience
- `selectedAspect.annotation` and top-level `annotation` should be treated as the same content
- `clusterScores` is present as soon as celeb matches are ready
- `archetype` is present as soon as celeb matches are ready
- `archetype.headline.strengthScore` is the continuous A-4 strength signal; `archetype.headline.flavorCluster` is rendered only when `archetype.headline.flavorPresent === true`
- `archetype.resolvedLabel` and related resolved fields are detail-tier taxonomy; do not show substrate labels such as `Low Broad Connection` as onboarding-card labels
- `archetype.blurb` is rendered copy. Display it directly, but do not parse it for score claims, shape, or cluster dominance.
- `annotation` is only present after the annotation worker completes
- `clusterScores` may be `null` only if scoring failed unexpectedly; the frontend should tolerate that case
- `archetype` may be `null` only if scoring failed unexpectedly; the frontend should tolerate that case

## Preview-Specific Type Notes

For staged onboarding, the frontend should model the preview responses like this:

```ts
type OnboardingPreviewResponse = {
  success: true;
  previewId: string;
  claimToken: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    gender?: string | null;
    preferredPartnerGender?: string | null;
    kind: 'accountSelf';
    appDomain: 'relationship-app';
  };
  birthChart: Record<string, unknown>;
  overview: string | null;
  referencedCodes: string[];
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
  topAspects: CelebAspectBucket[];
  topCelebMatches: TopCelebMatch[];
  overviewMode: 'romantic';
  status: 'onboarding_preview_created';
};

type OnboardingPreviewCelebResponse = {
  success: boolean;
  previewId: string;
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
  topAspects: CelebAspectBucket[];
  topCelebMatches: TopCelebMatch[];
  status:
    | 'celeb_matches_pending'
    | 'celeb_matches_running'
    | 'celeb_matches_ready'
    | 'celeb_annotations_running'
    | 'celeb_annotations_ready';
  error?: string;
};
```

This is the schema the frontend should implement against for the staged flow.

## Mobile Integration Guidance

Use this order of precedence in the app:

1. `topCelebMatches`
2. `celebAspectBank.topCelebMatches`
3. `topAspects` only as a legacy fallback

Recommended rendering behavior:

- On preview creation: show overview immediately; celeb section is loading
- On matches ready: render 3 cards from `topCelebMatches`
- On annotations pending/running: show scores and the A-4 archetype headline immediately, show annotation skeleton or placeholder copy
- On annotations completed: hydrate each card’s annotation from `topCelebMatches[i].annotation`
- On claim: keep using the returned `topCelebMatches` payload as-is; do not refetch unless needed

## Status Transition Rules

### Matches

Normal path:

1. `pending`
2. `running`
3. `completed`

Failure path:

1. `pending`
2. `running`
3. `failed`

### Annotations

Normal path:

1. `pending`
2. `running`
3. `completed`

Failure path:

1. `pending`
2. `running`
3. `failed`

Important relationship between them:
- `celebAnnotationsStatus` cannot start until `celebMatchesStatus.status === "completed"`
- When matches are regenerated, annotations reset back to `pending`

## Recommended Frontend Implementation

### UI Sequence

1. Submit onboarding form
2. Show a processing state while preview is loading
3. When preview returns:
   - render the romantic overview
   - store `previewId`
   - store `claimToken`
4. Fire celeb matches request
5. When matches return:
   - render `topAspects`
   - show annotation skeleton or loading treatment inside the celeb section
6. Fire celeb annotations request
7. Poll the `GET /celeb-matches` endpoint until annotation status resolves
8. Swap in annotation copy when completed

### Minimal Frontend Pseudocode

```ts
const preview = await api.createOnboardingPreview(formData);

renderOverview(preview.overview);
cachePreviewSession(preview.previewId, preview.claimToken);

const matches = await api.startCelebMatches(preview.previewId, preview.claimToken);
renderTopAspects(matches.topAspects);

api.startCelebAnnotations(preview.previewId, preview.claimToken);

const poll = async () => {
  const latest = await api.getCelebMatches(preview.previewId, preview.claimToken);

  if (latest.celebAnnotationsStatus.status === 'completed') {
    renderTopAspects(latest.topAspects);
    return;
  }

  if (latest.celebAnnotationsStatus.status === 'failed') {
    renderAnnotationUnavailableState();
    return;
  }

  setTimeout(poll, 2500);
};

poll();
```

## Error Handling

### `400`

Returned when required fields are missing.

Examples:
- missing preview input fields
- missing `claimToken`
- missing `previewId`

### `404`

Returned when the preview subject cannot be found for the given `previewId` and `claimToken`.

### `409`

Returned when:
- annotations are started before matches are complete
- a Firebase user attempts to claim a preview while already owning a different relationship-app account

### `500`

Returned when backend processing fails.

### Recommended Frontend Handling

- Treat preview failure as blocking
- Treat matches failure as retryable
- Treat annotations failure as non-blocking
- Allow the profile/overview experience to remain usable even if annotations fail

## Operational Notes

- The annotation worker is asynchronous and runs out of band from API Gateway
- This is specifically to avoid the 30-second API Gateway timeout
- Annotation generation is currently pinned to `claude-haiku-4-5`
- Romantic summary generation is currently pinned to `claude-haiku-4-5`
- Romantic profile blurb generation is currently pinned to `claude-haiku-4-5`
- If the blurb fails validation, the backend retries it with `claude-haiku-4-5`
- The onboarding flow currently generates annotations only for the top 3 onboarding slots

## Related Docs

- [RELATIONSHIP_APP_API_SUMMARY.md](./RELATIONSHIP_APP_API_SUMMARY.md)
- [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
- [MOBILE_DEVELOPER_QUICK_START.md](./MOBILE_DEVELOPER_QUICK_START.md)
