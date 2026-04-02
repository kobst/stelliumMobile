import { create } from 'zustand';
import { RELATIONSHIP_APP_DOMAIN } from '../../../shared/domain/relationshipUser';

export type TargetType = 'person' | 'celebrity' | null;

interface RelationshipAppStore {
  hasCompletedSelfProfile: boolean;
  selfProfileId: string | null;
  selfProfileDomain: typeof RELATIONSHIP_APP_DOMAIN;
  activeTargetType: TargetType;
  activeRelationshipId: string | null;
  setCompletedSelfProfile: (value: boolean) => void;
  setSelfProfileId: (value: string | null) => void;
  setActiveTargetType: (value: TargetType) => void;
  setActiveRelationshipId: (value: string | null) => void;
}

export const useRelationshipAppStore = create<RelationshipAppStore>((set) => ({
  hasCompletedSelfProfile: false,
  selfProfileId: null,
  selfProfileDomain: RELATIONSHIP_APP_DOMAIN,
  activeTargetType: null,
  activeRelationshipId: null,
  setCompletedSelfProfile: (value) => set({ hasCompletedSelfProfile: value }),
  setSelfProfileId: (value) => set({ selfProfileId: value }),
  setActiveTargetType: (value) => set({ activeTargetType: value }),
  setActiveRelationshipId: (value) => set({ activeRelationshipId: value }),
}));
