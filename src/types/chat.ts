import { User } from './index';
import { UserCompositeChart } from '../api/relationships';
import { SubjectDocument } from './index';

/**
 * Chat thread types representing different conversation contexts
 */
export type ChatThreadType = 'horoscope' | 'birth_chart' | 'relationship';

/**
 * Unified chat thread interface for all conversation types
 */
export interface ChatThread {
  id: string;
  type: ChatThreadType;
  title: string;
  subtitle?: string;
  lastMessagePreview?: string;
  lastMessageTimestamp?: Date;

  // Context-specific data
  userId?: string; // For birth charts (owner user ID)
  compositeChartId?: string; // For relationships
  guestSubject?: SubjectDocument; // For guest charts
  relationship?: UserCompositeChart; // For relationships

  // UI metadata
  iconName?: string; // For thread list icon
  isLocked?: boolean; // If analysis not complete
  requiresAnalysis?: boolean; // If thread needs analysis to be complete
}

/**
 * Section grouping for thread list
 */
export interface ChatThreadSection {
  title: string;
  data: ChatThread[];
  type: 'fixed' | 'guest_charts' | 'relationships';
}
