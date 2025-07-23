import { useState, useEffect, useCallback } from 'react';
import {
  relationshipsApi,
  RelationshipResponse,
  RelationshipScore,
  RelationshipWorkflowResponse,
  ApiError,
} from '../api';
import { useStore } from '../store';
import { User } from '../types';

export interface UseRelationshipsReturn {
  relationships: RelationshipResponse[];
  currentRelationship: RelationshipResponse | null;
  scores: RelationshipScore | null;
  workflowState: RelationshipWorkflowResponse | null;
  loading: boolean;
  error: string | null;
  createRelationship: (userB: User) => Promise<RelationshipResponse | null>;
  getRelationshipScores: (relationshipId: string) => Promise<RelationshipScore | null>;
  startRelationshipAnalysis: (userB: User) => Promise<void>;
  loadUserRelationships: () => Promise<void>;
  deleteRelationship: (relationshipId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useRelationships = (userId?: string): UseRelationshipsReturn => {
  const [relationships, setRelationships] = useState<RelationshipResponse[]>([]);
  const [currentRelationship, setCurrentRelationship] = useState<RelationshipResponse | null>(null);
  const [scores, setScores] = useState<RelationshipScore | null>(null);
  const [workflowState, setWorkflowState] = useState<RelationshipWorkflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userData,
    relationshipWorkflowState,
    setActiveUserContext,
  } = useStore();

  const clearError = () => setError(null);

  const createRelationship = useCallback(async (userB: User): Promise<RelationshipResponse | null> => {
    if (!userData) {
      setError('No user data available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.createRelationship({
        userA: userData,
        userB,
      });

      setCurrentRelationship(response);
      setRelationships(prev => [...prev, response]);

      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create relationship';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userData]);

  const getRelationshipScores = useCallback(async (relationshipId: string): Promise<RelationshipScore | null> => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (!relationship) {
      setError('Relationship not found');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.getRelationshipScore({
        synastryAspects: relationship.synastryAspects,
        compositeChart: relationship.compositeBirthChart,
        userA: relationship.userA,
        userB: relationship.userB,
        compositeChartId: relationship.id,
      });

      setScores(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to get relationship scores';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [relationships]);

  const startRelationshipAnalysis = useCallback(async (userB: User) => {
    if (!userData) {
      setError('No user data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.startRelationshipWorkflow(userData, userB);
      setWorkflowState(response);

      // Start polling for status
      if (response.workflowId) {
        pollRelationshipStatus(response.workflowId);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to start relationship analysis';
      setError(errorMessage);
      setLoading(false);
    }
  }, [userData]);

  const pollRelationshipStatus = useCallback(async (workflowId: string) => {
    try {
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await relationshipsApi.pollRelationshipStatus(workflowId);
          setWorkflowState(statusResponse);

          if (statusResponse.isCompleted) {
            clearInterval(pollInterval);
            setLoading(false);

            // Load updated relationships
            loadUserRelationships();
          }
        } catch (err) {
          clearInterval(pollInterval);
          const errorMessage = err instanceof ApiError ? err.message : 'Relationship workflow polling failed';
          setError(errorMessage);
          setLoading(false);
        }
      }, 3000);

      // Cleanup interval after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setError('Relationship analysis workflow timeout');
          setLoading(false);
        }
      }, 600000);

    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to start polling relationship status';
      setError(errorMessage);
      setLoading(false);
    }
  }, [loading, loadUserRelationships]);

  const loadUserRelationships = useCallback(async () => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.getUserRelationships(targetUserId);
      setRelationships(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load relationships';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, userData?.id]);

  const deleteRelationship = useCallback(async (relationshipId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await relationshipsApi.deleteRelationship(relationshipId);

      setRelationships(prev => prev.filter(r => r.id !== relationshipId));

      if (currentRelationship?.id === relationshipId) {
        setCurrentRelationship(null);
        setScores(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete relationship';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentRelationship?.id]);

  // Load user relationships on mount
  useEffect(() => {
    if (userId || userData?.id) {
      loadUserRelationships();
    }
  }, [userId, userData?.id, loadUserRelationships]);

  return {
    relationships,
    currentRelationship,
    scores,
    workflowState,
    loading,
    error,
    createRelationship,
    getRelationshipScores,
    startRelationshipAnalysis,
    loadUserRelationships,
    deleteRelationship,
    clearError,
  };
};
