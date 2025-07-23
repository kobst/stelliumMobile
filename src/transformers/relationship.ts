import { RelationshipScore } from '../api';

export interface RawRelationshipData {
  scores: Record<string, { score: number; analysis: string }>;
  synastryAspects: any[];
  compositeChart: any;
  userA: any;
  userB: any;
}

export interface FormattedRelationshipScore {
  category: string;
  label: string;
  score: number;
  analysis: string;
  color: string;
  icon: string;
  order: number;
}

export const relationshipTransformers = {
  // Transform raw relationship scores to UI format
  formatRelationshipScores: (rawScores: RelationshipScore): FormattedRelationshipScore[] => {
    const categoryConfig: Record<string, { label: string; icon: string; order: number }> = {
      OVERALL_ATTRACTION_CHEMISTRY: {
        label: 'Overall Attraction & Chemistry',
        icon: '💫',
        order: 1,
      },
      EMOTIONAL_SECURITY_CONNECTION: {
        label: 'Emotional Security & Connection',
        icon: '🏡',
        order: 2,
      },
      COMMUNICATION_LEARNING: {
        label: 'Communication & Learning',
        icon: '💬',
        order: 3,
      },
      VALUES_GOALS_DIRECTION: {
        label: 'Values, Goals & Life Direction',
        icon: '🎯',
        order: 4,
      },
      INTIMACY_SEXUALITY: {
        label: 'Intimacy & Sexuality',
        icon: '🔥',
        order: 5,
      },
      LONG_TERM_STABILITY: {
        label: 'Long-term Stability & Commitment',
        icon: '💍',
        order: 6,
      },
      SPIRITUAL_GROWTH: {
        label: 'Spiritual Growth & Transformation',
        icon: '🌟',
        order: 7,
      },
    };

    return Object.entries(rawScores).map(([category, data]) => {
      const config = categoryConfig[category] || {
        label: category.replace(/_/g, ' '),
        icon: '⭐',
        order: 999,
      };

      return {
        category,
        label: config.label,
        score: data.score,
        analysis: data.analysis,
        color: relationshipTransformers.getScoreColor(data.score),
        icon: config.icon,
        order: config.order,
      };
    }).sort((a, b) => a.order - b.order);
  },

  // Get color based on score
  getScoreColor: (score: number): string => {
    if (score >= 85) {return '#4CAF50';} // Green - Excellent
    if (score >= 70) {return '#8BC34A';} // Light Green - Good
    if (score >= 55) {return '#FFC107';} // Yellow - Average
    if (score >= 40) {return '#FF9800';} // Orange - Below Average
    return '#F44336'; // Red - Challenging
  },

  // Get score description
  getScoreDescription: (score: number): string => {
    if (score >= 85) {return 'Excellent';}
    if (score >= 70) {return 'Good';}
    if (score >= 55) {return 'Average';}
    if (score >= 40) {return 'Below Average';}
    return 'Challenging';
  },

  // Calculate overall compatibility score
  calculateOverallScore: (scores: RelationshipScore): number => {
    const values = Object.values(scores);
    const totalScore = values.reduce((sum, item) => sum + item.score, 0);
    return Math.round(totalScore / values.length);
  },

  // Get top strengths and challenges
  getStrengthsAndChallenges: (scores: FormattedRelationshipScore[]): {
    strengths: FormattedRelationshipScore[];
    challenges: FormattedRelationshipScore[];
  } => {
    const sortedByScore = [...scores].sort((a, b) => b.score - a.score);

    const strengths = sortedByScore.filter(score => score.score >= 70).slice(0, 3);
    const challenges = sortedByScore.filter(score => score.score < 55).slice(-3);

    return { strengths, challenges };
  },

  // Format compatibility summary
  formatCompatibilitySummary: (
    overallScore: number,
    topStrength: FormattedRelationshipScore,
    mainChallenge: FormattedRelationshipScore
  ): string => {
    const description = relationshipTransformers.getScoreDescription(overallScore);

    let summary = `Your overall compatibility is ${description.toLowerCase()} (${overallScore}%).`;

    if (topStrength) {
      summary += ` Your strongest area is ${topStrength.label.toLowerCase()}.`;
    }

    if (mainChallenge) {
      summary += ` The main area for growth is ${mainChallenge.label.toLowerCase()}.`;
    }

    return summary;
  },

  // Transform synastry aspects for display
  formatSynastryAspects: (aspects: any[]): Array<{
    planet1: string;
    planet2: string;
    aspect: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    type: 'harmonious' | 'challenging' | 'neutral';
  }> => {
    const aspectTypes: Record<string, { type: 'harmonious' | 'challenging' | 'neutral'; intensity: 'low' | 'medium' | 'high' }> = {
      conjunction: { type: 'neutral', intensity: 'high' },
      sextile: { type: 'harmonious', intensity: 'medium' },
      square: { type: 'challenging', intensity: 'high' },
      trine: { type: 'harmonious', intensity: 'high' },
      opposition: { type: 'challenging', intensity: 'high' },
      quincunx: { type: 'neutral', intensity: 'low' },
    };

    return aspects.map(aspect => {
      const config = aspectTypes[aspect.aspect] || { type: 'neutral', intensity: 'low' };

      return {
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        aspect: aspect.aspect,
        description: aspect.description || `${aspect.planet1} ${aspect.aspect} ${aspect.planet2}`,
        intensity: config.intensity,
        type: config.type,
      };
    });
  },

  // Get relationship advice based on scores
  getRelationshipAdvice: (scores: FormattedRelationshipScore[]): {
    general: string;
    specific: string[];
  } => {
    const overallScore = scores.reduce((sum, score) => sum + score.score, 0) / scores.length;
    const { strengths, challenges } = relationshipTransformers.getStrengthsAndChallenges(scores);

    let general: string;
    const specific: string[] = [];

    if (overallScore >= 75) {
      general = 'You have a strong foundation for a lasting relationship. Focus on maintaining your connection and growing together.';
    } else if (overallScore >= 60) {
      general = 'Your relationship has good potential with some areas that need attention. Open communication will be key.';
    } else {
      general = 'This relationship will require significant effort and understanding from both partners to succeed.';
    }

    // Add specific advice based on top challenges
    challenges.forEach(challenge => {
      if (challenge.score < 40) {
        specific.push(`Work on ${challenge.label.toLowerCase()} through honest dialogue and mutual understanding.`);
      }
    });

    // Add advice based on strengths
    if (strengths.length > 0) {
      specific.push(`Build on your strength in ${strengths[0].label.toLowerCase()} to support other areas.`);
    }

    return { general, specific };
  },
};
