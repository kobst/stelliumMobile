import { useState, useEffect } from 'react';
import { usersApi, CreateUserRequest, UserResponse, ApiError } from '../api';
import { useStore } from '../store';
import { userTransformers } from '../transformers/user';

export interface UseUserReturn {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  createUser: (userData: CreateUserRequest) => Promise<UserResponse | null>;
  updateUser: (updates: Partial<CreateUserRequest>) => Promise<UserResponse | null>;
  deleteUser: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useUser = (userId?: string): UseUserReturn => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userData, setUserData } = useStore();

  const clearError = () => setError(null);

  const fetchUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.getUser(id);
      setUser(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserRequest): Promise<UserResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.createUser(userData);
      setUser(response);

      // Update global store with normalized User shape
      const normalized = userTransformers.apiResponseToUser(response);
      setUserData(normalized);

      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create user';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<CreateUserRequest>): Promise<UserResponse | null> => {
    if (!user?.id) {
      setError('No user to update');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.updateUser(user.id, updates);
      setUser(response);

      // Update global store if this is the current user
      if (userData?.id === user.id) {
        setUserData({
          ...userData,
          ...updates,
        });
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (): Promise<boolean> => {
    if (!user?.id) {
      setError('No user to delete');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await usersApi.deleteUser(user.id);
      setUser(null);

      // Clear global store if this is the current user
      if (userData?.id === user.id) {
        setUserData(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (userId) {
      await fetchUser(userId);
    }
  };

  // Fetch user on mount if userId provided
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refreshUser,
    clearError,
  };
};
