import { BroadTopicsEnum, HTTP_POST, CONTENT_TYPE_HEADER, APPLICATION_JSON, ERROR_API_CALL } from './constants';
import { REACT_APP_SERVER_URL, REACT_APP_GOOGLE_API_KEY } from '@env';

const SERVER_URL = REACT_APP_SERVER_URL;

export const fetchTimeZone = async (lat: number, lon: number, epochTimeSeconds: number) => {
  const apiKey = REACT_APP_GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${epochTimeSeconds}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Error from TimeZone API: ${data.status}`);
    }

    const totalOffsetHours = (data.rawOffset + data.dstOffset) / 3600;
    console.log(`Total Offset in Hours: ${totalOffsetHours}`);

    return totalOffsetHours;
  } catch (error) {
    console.error('Error fetching time zone:', error);
    throw error;
  }
};

export const postUserProfile = async (birthData: any) => {
  try {
    console.log(`${SERVER_URL}/createUser`);
    const response = await fetch(`${SERVER_URL}/createUser`, {
      method: HTTP_POST,
      headers: {
        [CONTENT_TYPE_HEADER]: APPLICATION_JSON,
      },
      body: JSON.stringify(birthData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const fetchUser = async (userId: string) => {
  console.log('fetchUseruserId');
  console.log(userId);
  try {
    const response = await fetch(`${SERVER_URL}/getUser`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/getUsers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Users:', data);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchComposites = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/getCompositeCharts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Composites:', data);
    return data;
  } catch (error) {
    console.error('Error fetching composites:', error);
    throw error;
  }
};

export const handleUserInput = async (userId: string, query: string) => {
  console.log(query);
  try {
    console.log('query:', query);
    console.log('userId:', userId);
    const response = await fetch(`${SERVER_URL}/handleUserQuery`, {
      method: HTTP_POST,
      headers: {
        [CONTENT_TYPE_HEADER]: APPLICATION_JSON,
      },
      body: JSON.stringify({ userId, query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const postCreateRelationshipProfile = async (userA: any, userB: any) => {
  console.log('userA');
  console.log(userA);
  console.log('userB');
  console.log(userB);
  try {
    const response = await fetch(`${SERVER_URL}/createRelationship`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ userA, userB }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const createCompositeChartProfile = async (
  userAId: string,
  userBId: string,
  userAName: string,
  userBName: string,
  userA_dateOfBirth: any,
  userB_dateOfBirth: any,
  synastryAspects: any,
  compositeBirthChart: any,
) => {
  console.log('compositeBirthChart x:');
  console.log(compositeBirthChart);
  try {
    const response = await fetch(`${SERVER_URL}/saveCompositeChartProfile`, {
      method: HTTP_POST,
      headers: {
        [CONTENT_TYPE_HEADER]: APPLICATION_JSON,
      },
      body: JSON.stringify({
        userA_id: userAId,
        userB_id: userBId,
        userA_name: userAName,
        userB_name: userBName,
        userA_dateOfBirth: userA_dateOfBirth,
        userB_dateOfBirth: userB_dateOfBirth,
        synastryAspects: synastryAspects,
        compositeBirthChart: compositeBirthChart,
      }),
    });
    const data = await response.json();
    return data.compositeChartId;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const getRelationshipScore = async (
  synastryAspects: any,
  compositeChart: any,
  userA: any,
  userB: any,
  compositeChartId: string,
) => {
  try {
    console.log('Calling getRelationshipScore API');
    console.log('synastryAspects: ', synastryAspects);
    console.log('compositeChart: ', compositeChart);
    console.log('birthChart1: ', userA.birthChart);
    console.log('birthChart2: ', userB.birthChart);
    const response = await fetch(`${SERVER_URL}/getRelationshipScore`, {
      method: HTTP_POST,
      headers: {
        [CONTENT_TYPE_HEADER]: APPLICATION_JSON,
      },
      body: JSON.stringify({
        synastryAspects,
        compositeChart,
        userA,
        userB,
        compositeChartId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const relationshipScore = await response.json();
    console.log('Relationship score received:', relationshipScore);
    return relationshipScore;
  } catch (error) {
    console.error('Error getting relationship score:', error);
    throw error;
  }
};

export const generateRelationshipAnalysis = async (compositeChartId: string) => {
  console.log('compositeChartId: ', compositeChartId);
  try {
    const response = await fetch(`${SERVER_URL}/generateRelationshipAnalysis`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ compositeChartId }),
    });
    const responseData = await response.json();
    console.log('responseData: ', responseData);
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const fetchRelationshipAnalysis = async (compositeChartId: string) => {
  console.log('compositeChartId: ', compositeChartId);
  try {
    const response = await fetch(`${SERVER_URL}/fetchRelationshipAnalysis`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ compositeChartId }),
    });
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const getShortOverview = async (birthData: any) => {
  console.log('birthchart: ', birthData);
  try {
    const response = await fetch(`${SERVER_URL}/getShortOverview`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ birthData }),
    });
    console.log('response', response);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const getPlanetOverview = async (planetName: string, birthData: any) => {
  console.log('Sending request with:', { planetName, birthData });
  try {
    const response = await fetch(`${SERVER_URL}/getShortOverviewPlanet`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ planetName, birthData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const rawResponse = await response.text();
    console.log('Raw response:', rawResponse);

    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in getPlanetOverview API call:', error);
    throw error;
  }
};

export const getFullBirthChartAnalysis = async (user: any) => {
  console.log('user: ', user);
  try {
    const response = await fetch(`${SERVER_URL}/getBirthChartAnalysis`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ user }),
    });
    console.log('response', response);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const fetchAnalysis = async (userId: string) => {
  console.log('userId: ', userId);
  try {
    const response = await fetch(`${SERVER_URL}/fetchAnalysis`, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
      body: JSON.stringify({ userId }),
    });
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(ERROR_API_CALL, error);
    throw error;
  }
};

export const generateTopicAnalysis = async (userId: string) => {
  console.log('Starting topic analysis for user:', userId);

  try {
    const topics = Object.entries(BroadTopicsEnum);
    const results: any = {};

    for (const [broadTopic, topicData] of topics) {
      console.log(`Processing topic: ${broadTopic}`);
      results[broadTopic] = {
        label: (topicData as any).label,
        subtopics: {},
      };

      for (const [subtopicKey, subtopicLabel] of Object.entries((topicData as any).subtopics)) {
        console.log(`Processing subtopic: ${subtopicKey}`);

        const response = await fetch(`${SERVER_URL}/getSubtopicAnalysis`, {
          method: HTTP_POST,
          headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
          body: JSON.stringify({
            userId,
            broadTopic,
            subtopicKey,
            subtopicLabel,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || `Subtopic analysis failed for ${subtopicLabel}`);
        }

        (results[broadTopic].subtopics as any)[subtopicKey] = result.result;
        console.log(`Completed subtopic: ${subtopicKey}`);
      }
    }

    console.log('All topics and subtopics completed');
    return {
      success: true,
      message: 'Topic analysis completed successfully',
      results,
    };
  } catch (error) {
    console.error('Error in topic analysis:', error);
    throw error;
  }
};

export const processAndVectorizeBasicAnalysis = async (userId: string) => {
  console.log('Starting vectorization for user:', userId);
  let section: string = 'overview';
  let index = 0;
  let isComplete = false;

  while (!isComplete) {
    try {
      console.log(`Processing section: ${section}, index: ${index}`);
      const response = await fetch(`${SERVER_URL}/processBasicAnalysis`, {
        method: HTTP_POST,
        headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
        body: JSON.stringify({ userId, section, index }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Vectorization failed');
      }

      console.log(`Processed ${result.recordCount} records for ${section}`);
      section = result.nextSection;
      index = result.nextIndex;
      isComplete = result.isComplete;
    } catch (error) {
      console.error('Error in vectorization process:', error);
      throw error;
    }
  }

  console.log('Vectorization complete for user:', userId);
  return { success: true };
};

export const processAndVectorizeTopicAnalysis = async (userId: string) => {
  let currentTopic: string | null = null;
  let currentSubtopic: string | null = null;
  let isComplete = false;

  try {
    while (!isComplete) {
      console.log(`Processing topic: ${currentTopic}, subtopic: ${currentSubtopic}`);

      const response = await fetch(`${SERVER_URL}/processTopicAnalysis`, {
        method: HTTP_POST,
        headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
        body: JSON.stringify({ userId, topic: currentTopic, subtopic: currentSubtopic }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Vectorization failed');
      }

      isComplete = data.isComplete;
      currentTopic = data.nextTopic;
      currentSubtopic = data.nextSubtopic;

      if (!isComplete) {
        console.log(`Processed ${currentTopic} - ${currentSubtopic}`);
      }
    }

    console.log('Topic analysis vectorization complete');
    return { success: true, isComplete: true };
  } catch (error) {
    console.error('Error in vectorization process:', error);
    return {
      success: false,
      error: (error as Error).message,
      lastProcessedTopic: currentTopic,
      lastProcessedSubtopic: currentSubtopic,
    };
  }
};

export const processAndVectorizeRelationshipAnalysis = async (compositeChartId: string) => {
  let currentCategory: string | null = null;
  let isComplete = false;

  try {
    while (!isComplete) {
      console.log(`Processing relationship category: ${currentCategory || 'initial'}`);

      const response = await fetch(`${SERVER_URL}/processRelationshipAnalysis`, {
        method: HTTP_POST,
        headers: { [CONTENT_TYPE_HEADER]: APPLICATION_JSON },
        body: JSON.stringify({ compositeChartId, category: currentCategory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Relationship analysis processing failed');
      }

      isComplete = data.isComplete;
      currentCategory = data.nextCategory;

      if (!isComplete && currentCategory) {
        console.log(`Processed category: ${currentCategory}`);
      }
    }

    console.log('Relationship analysis processing complete');
    return { success: true, isComplete: true };
  } catch (error) {
    console.error('Error in relationship analysis processing:', error);
    return {
      success: false,
      error: (error as Error).message,
      lastProcessedCategory: currentCategory,
    };
  }
};

