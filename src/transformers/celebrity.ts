import { Celebrity } from '../api/celebrities';
import { User } from '../types';

/**
 * Transforms a Celebrity object from the API to a User object
 * that can be used with existing chart components
 */
export const celebrityToUser = (celebrity: Celebrity): User => {
  // Create a full name from the celebrity data
  const fullName = `${celebrity.firstName} ${celebrity.lastName}`;

  // Parse the date of birth
  const birthDate = new Date(celebrity.dateOfBirth);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth() + 1; // getMonth() returns 0-based month
  const birthDay = birthDate.getDate();

  // Extract birth time components with defaults
  let birthHour = 12; // Default to noon if not specified
  let birthMinute = 0; // Default to :00 if not specified

  if (celebrity.time) {
    const timeParts = celebrity.time.split(':');
    if (timeParts.length >= 2) {
      birthHour = parseInt(timeParts[0], 10) || 12;
      birthMinute = parseInt(timeParts[1], 10) || 0;
    }
  }

  return {
    id: celebrity._id,
    name: fullName,
    email: undefined, // Celebrities don't have email in the public interface
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    birthLocation: celebrity.placeOfBirth,
    timezone: celebrity.totalOffsetHours ? celebrity.totalOffsetHours.toString() : '0',
    birthChart: celebrity.birthChart, // Pass through birth chart data as-is
  };
};

/**
 * Transforms an array of Celebrity objects to User objects
 */
export const celebritiesToUsers = (celebrities: Celebrity[]): User[] => {
  return celebrities.map(celebrityToUser);
};

/**
 * Checks if a User object was originally a Celebrity
 * (useful for determining display behavior)
 */
export const isUserFromCelebrity = (user: User): boolean => {
  // Celebrities don't have email addresses in our interface
  return user.email === undefined;
};

/**
 * Creates a display name for a celebrity in the context of viewing their chart
 */
export const getCelebrityDisplayName = (celebrity: Celebrity): string => {
  return `${celebrity.firstName} ${celebrity.lastName}`;
};

/**
 * Creates a subtitle for a celebrity showing birth info
 */
export const getCelebritySubtitle = (celebrity: Celebrity): string => {
  const birthDate = new Date(celebrity.dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const birthTime = celebrity.time ? ` at ${celebrity.time}` : '';

  return `Born ${birthDate}${birthTime} in ${celebrity.placeOfBirth}`;
};
