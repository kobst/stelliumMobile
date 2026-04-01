import { create } from 'zustand';

export type TargetType = 'person' | 'celebrity' | null;

interface RelationshipAppStore {
  hasCompletedSelfProfile: boolean;
  activeTargetType: TargetType;
  activeRelationshipId: string | null;
  setCompletedSelfProfile: (value: boolean) => void;
  setActiveTargetType: (value: TargetType) => void;
  setActiveRelationshipId: (value: string | null) => void;
}

export const useRelationshipAppStore = create<RelationshipAppStore>((set) => ({
  hasCompletedSelfProfile: false,
  activeTargetType: null,
  activeRelationshipId: null,
  setCompletedSelfProfile: (value) => set({ hasCompletedSelfProfile: value }),
  setActiveTargetType: (value) => set({ activeTargetType: value }),
  setActiveRelationshipId: (value) => set({ activeRelationshipId: value }),
}));
