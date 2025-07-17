import { User, SubjectDocument } from '../types';
import { CreateUserRequest, UserResponse } from '../api';

export interface DisplayUser {
  id: string;
  name: string;
  displayName: string;
  initials: string;
  birthInfo: {
    date: string;
    time: string;
    location: string;
    age: number;
    zodiacSign: string;
  };
  hasExactTime: boolean;
  profileComplete: boolean;
}

export const userTransformers = {
  // Transform SubjectDocument from backend to internal User type
  subjectDocumentToUser: (subject: SubjectDocument): User => {
    console.log('\n=== SUBJECT DOCUMENT TRANSFORMER ===');
    console.log('Raw Subject Document:', JSON.stringify(subject, null, 2));
    
    // Parse date of birth
    const dateOfBirth = new Date(subject.dateOfBirth);
    
    // Parse time if available
    let birthHour = 12;
    let birthMinute = 0;
    
    if (subject.time && !subject.birthTimeUnknown) {
      const [hours, minutes] = subject.time.split(':').map(Number);
      birthHour = hours;
      birthMinute = minutes;
    }
    
    const transformedUser: User = {
      id: subject._id,
      name: `${subject.firstName} ${subject.lastName}`,
      email: subject.email || '',
      birthYear: dateOfBirth.getFullYear(),
      birthMonth: dateOfBirth.getMonth() + 1,
      birthDay: dateOfBirth.getDate(),
      birthHour,
      birthMinute,
      birthLocation: subject.placeOfBirth,
      timezone: subject.totalOffsetHours.toString(),
      birthChart: subject.birthChart,
    };
    
    console.log('Transformed User:', JSON.stringify(transformedUser, null, 2));
    console.log('====================================\n');
    
    return transformedUser;
  },

  // Transform API user response to internal User type (legacy)
  apiResponseToUser: (apiResponse: any): User => {
    console.log('\n=== USER TRANSFORMER ===');
    console.log('Raw API response:', JSON.stringify(apiResponse, null, 2));
    
    // Handle the actual response structure: response.user contains the user data
    const userData = apiResponse.user || apiResponse;
    const userId = apiResponse.userId || userData.id;
    
    console.log('Extracted userData:', JSON.stringify(userData, null, 2));
    console.log('Extracted userId:', userId);
    
    // Extract birth data - could be nested or flat
    const birthData = userData.birthData || userData;
    console.log('Extracted birthData:', JSON.stringify(birthData, null, 2));
    
    // Extract timezone from various possible locations
    let timezone = birthData.timezone || birthData.tzone;
    
    // If not found in birthData, check the birth chart
    if (!timezone && (userData.birthChart || apiResponse.birthChart)) {
      const chartData = userData.birthChart || apiResponse.birthChart;
      if (chartData && chartData.tzone !== undefined) {
        timezone = chartData.tzone.toString();
      }
    }
    
    console.log('Timezone extraction:', {
      fromBirthData: birthData.timezone || birthData.tzone,
      fromChart: (userData.birthChart || apiResponse.birthChart)?.tzone,
      final: timezone
    });

    const transformedUser = {
      id: userId,
      name: userData.name || birthData.name,
      email: '', // Not typically returned from API
      birthYear: birthData.birthYear,
      birthMonth: birthData.birthMonth,
      birthDay: birthData.birthDay,
      birthHour: birthData.birthHour || 12,
      birthMinute: birthData.birthMinute || 0,
      birthLocation: birthData.birthLocation || birthData.placeOfBirth,
      timezone: timezone,
      birthChart: userData.birthChart || apiResponse.birthChart,
    };
    
    console.log('Final transformed user:', JSON.stringify(transformedUser, null, 2));
    console.log('birthLocation:', transformedUser.birthLocation);
    console.log('timezone:', transformedUser.timezone);
    console.log('=======================\n');
    
    return transformedUser;
  },

  // Transform internal User to API create request
  userToApiRequest: (user: User): CreateUserRequest => {
    return {
      name: user.name,
      birthYear: user.birthYear,
      birthMonth: user.birthMonth,
      birthDay: user.birthDay,
      birthHour: user.birthHour,
      birthMinute: user.birthMinute,
      birthLocation: user.birthLocation,
      timezone: user.timezone,
    };
  },

  // Transform user to display format
  userToDisplayFormat: (user: User): DisplayUser => {
    const birthDate = new Date(user.birthYear, user.birthMonth - 1, user.birthDay);
    const age = userTransformers.calculateAge(birthDate);
    const zodiacSign = userTransformers.getZodiacSign(user.birthMonth, user.birthDay);
    
    return {
      id: user.id,
      name: user.name,
      displayName: userTransformers.formatDisplayName(user.name),
      initials: userTransformers.getInitials(user.name),
      birthInfo: {
        date: userTransformers.formatBirthDate(birthDate),
        time: userTransformers.formatBirthTime(user.birthHour, user.birthMinute),
        location: user.birthLocation,
        age,
        zodiacSign,
      },
      hasExactTime: user.birthHour !== 12 || user.birthMinute !== 0, // Default time assumption
      profileComplete: userTransformers.isProfileComplete(user),
    };
  },

  // Calculate age from birth date
  calculateAge: (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Get zodiac sign from birth month and day
  getZodiacSign: (month: number, day: number): string => {
    const signs = [
      { name: 'Capricorn', start: [12, 22], end: [1, 19] },
      { name: 'Aquarius', start: [1, 20], end: [2, 18] },
      { name: 'Pisces', start: [2, 19], end: [3, 20] },
      { name: 'Aries', start: [3, 21], end: [4, 19] },
      { name: 'Taurus', start: [4, 20], end: [5, 20] },
      { name: 'Gemini', start: [5, 21], end: [6, 20] },
      { name: 'Cancer', start: [6, 21], end: [7, 22] },
      { name: 'Leo', start: [7, 23], end: [8, 22] },
      { name: 'Virgo', start: [8, 23], end: [9, 22] },
      { name: 'Libra', start: [9, 23], end: [10, 22] },
      { name: 'Scorpio', start: [10, 23], end: [11, 21] },
      { name: 'Sagittarius', start: [11, 22], end: [12, 21] },
    ];

    for (const sign of signs) {
      const [startMonth, startDay] = sign.start;
      const [endMonth, endDay] = sign.end;
      
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (startMonth > endMonth && (month === startMonth || month === endMonth))
      ) {
        return sign.name;
      }
    }
    
    return 'Unknown';
  },

  // Format display name
  formatDisplayName: (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  },

  // Get initials from name
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },

  // Format birth date for display
  formatBirthDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  },

  // Format birth time for display
  formatBirthTime: (hour: number, minute: number): string => {
    if (hour === 12 && minute === 0) {
      return 'Unknown time';
    }
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  },

  // Check if user profile is complete
  isProfileComplete: (user: User): boolean => {
    return !!(
      user.id &&
      user.name &&
      user.birthYear &&
      user.birthMonth &&
      user.birthDay &&
      user.birthLocation &&
      user.birthChart
    );
  },

  // Validate user data
  validateUserData: (user: Partial<User>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!user.name || user.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!user.birthYear || user.birthYear < 1900 || user.birthYear > new Date().getFullYear()) {
      errors.push('Please enter a valid birth year');
    }
    
    if (!user.birthMonth || user.birthMonth < 1 || user.birthMonth > 12) {
      errors.push('Please enter a valid birth month');
    }
    
    if (!user.birthDay || user.birthDay < 1 || user.birthDay > 31) {
      errors.push('Please enter a valid birth day');
    }
    
    if (user.birthHour !== undefined && (user.birthHour < 0 || user.birthHour > 23)) {
      errors.push('Birth hour must be between 0 and 23');
    }
    
    if (user.birthMinute !== undefined && (user.birthMinute < 0 || user.birthMinute > 59)) {
      errors.push('Birth minute must be between 0 and 59');
    }
    
    if (!user.birthLocation || user.birthLocation.trim().length < 2) {
      errors.push('Birth location is required');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Generate user summary for display
  generateUserSummary: (user: DisplayUser): string => {
    return `${user.displayName}, ${user.birthInfo.age} years old, ${user.birthInfo.zodiacSign} born in ${user.birthInfo.location}`;
  },

  // Format user for relationship display
  formatForRelationship: (user: User): string => {
    const sign = userTransformers.getZodiacSign(user.birthMonth, user.birthDay);
    return `${user.name} (${sign})`;
  },
};