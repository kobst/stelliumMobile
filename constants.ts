export const zodiacIcons = [
  '/assets/signs/aries.svg',
  '/assets/signs/taurus.svg',
  '/assets/signs/gemini.svg',
  '/assets/signs/cancer.svg',
  '/assets/signs/leo.svg',
  '/assets/signs/virgo.svg',
  '/assets/signs/libra.svg',
  '/assets/signs/scorpio.svg',
  '/assets/signs/sagittarius.svg',
  '/assets/signs/capricorn.svg',
  '/assets/signs/aquarius.svg',
  '/assets/signs/pisces.svg',
];

export const planetIcons = [
  '/assets/planets/Sun.svg',
  '/assets/planets/Moon.svg',
  '/assets/planets/Mercury.svg',
  '/assets/planets/Venus.svg',
  '/assets/planets/Mars.svg',
  '/assets/planets/Jupiter.svg',
  '/assets/planets/Saturn.svg',
  '/assets/planets/Uranus.svg',
  '/assets/planets/Neptune.svg',
  '/assets/planets/Pluto.svg',
];

export const relevantPromptAspects = {
    'personality': {
      'planets': ['Sun', 'Moon', 'Ascendant'],
      'houses': [1],
    },
    'relationships': {
      'planets': [
        'Sun',
        'Moon',
        'Venus',
        'Mars',
        'Ascendant',
      ],
      'houses': [5, 7, 11],
    },
    'career': {
      'planets': ['Sun', 'Saturn', 'Jupiter', 'Midheaven', 'Part of Fortune'],
      'houses': [2, 6, 10],
    },
    'home': {
      'planets': ['Sun', 'Moon', 'Saturn'],
      'houses': [4],
    },
    'unconscious': {
      'planets': ['Pluto', 'Neptune', 'Mars', 'Node', 'South Node', 'Chiron'],
      'houses': [8, 12],
    },
    'communication': {
      'planets': ['Sun', 'Moon', 'Ascendant', 'Mercury', 'Jupiter'],
      'houses': [3, 9],
    },
    'everything': {
      'planets': [
        'Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 'Saturn',
        'Jupiter', 'Uranus', 'Neptune', 'Pluto', 'Part of Fortune', 'Node',
        'South Node',
      ],
      'houses': [1, 4, 7, 10],
    },
  };

export const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

export const zodiacSymbols = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓',
};

export const planetarySymbols = {
  'Sun': '☉',
  'Moon': '☽',
  'Ascendant': '↗',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇',
};

export const rulers = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Uranus',
    'Pisces': 'Neptune',
  };

  export const transitTopics = ['Progressed', 'Transits'];


  export const PlanetEnum = {
    SUN: 'Sun',
    MOON: 'Moon',
    ASCENDANT: 'Ascendant',
    MERCURY: 'Mercury',
    VENUS: 'Venus',
    MARS: 'Mars',
    SATURN: 'Saturn',
    JUPITER: 'Jupiter',
    URANUS: 'Uranus',
    NEPTUNE: 'Neptune',
    PLUTO: 'Pluto',
  };

  export const planets = [
    PlanetEnum.SUN,
    PlanetEnum.MOON,
    PlanetEnum.ASCENDANT,
    PlanetEnum.MERCURY,
    PlanetEnum.VENUS,
    PlanetEnum.MARS,
    PlanetEnum.SATURN,
    PlanetEnum.JUPITER,
    PlanetEnum.URANUS,
    PlanetEnum.NEPTUNE,
    PlanetEnum.PLUTO,
  ];



export const BroadTopicsEnum = {
  PERSONALITY_IDENTITY: {
    label: 'Self-Expression and Identity',
    subtopics: {
      PERSONAL_IDENTITY: 'Personal_Identity_and_Self-Image',
      OUTWARD_EXPRESSION: 'Outward_Expression_and_Appearance',
      INNER_EMOTIONAL_SELF: 'Inner_Self_and_Emotional_Dynamics',
      CHALLENGES_SELF_EXPRESSION: 'Challenges_and_Growth_of_Self-Expression',
    },
  },

  EMOTIONAL_FOUNDATIONS_HOME: {
    label: 'Emotional Foundations and Home Life',
    subtopics: {
      EMOTIONAL_FOUNDATIONS: 'Emotional_Foundations_and_Security_Needs',
      FAMILY_DYNAMICS: 'Family_Dynamics_and_Past_Influences',
      HOME_ENVIRONMENT: 'Home_Environment_and_Preferences',
      FAMILY_CHALLENGES: 'Challenges_and_Growth_in_Family_Life',
    },
  },

  RELATIONSHIPS_SOCIAL: {
    label: 'Relationships and Social Connections',
    subtopics: {
      RELATIONSHIP_DESIRES: 'Core_Relationship_Desires_and_Boundaries',
      LOVE_STYLE: 'Love_Style_and_Expression',
      SEXUAL_NATURE: 'Sexual_Nature_and_Intimacy',
      COMMITMENT_APPROACH: 'Commitment_Approach_and_Long-Term_Vision',
      RELATIONSHIP_CHALLENGES: 'Challenges_and_Growth_in_Relationships',
    },
  },

  CAREER_PURPOSE_PUBLIC_IMAGE: {
    label: 'Career, Purpose, and Public Image',
    subtopics: {
      CAREER_MOTIVATIONS: 'Career_Motivations_and_Aspirations',
      PUBLIC_IMAGE: 'Public_Image_Reputation_and_Leadership_Style',
      CAREER_CHALLENGES: 'Career_Challenges_and_Opportunities',
      SKILLS_TALENTS: 'Skills_Talents_and_Strengths',
    },
  },

  UNCONSCIOUS_SPIRITUALITY: {
    label: 'Unconscious Drives and Spiritual Growth',
    subtopics: {
      PSYCHOLOGICAL_PATTERNS: 'Deep_Psychological_Patterns_and_Shadow_Self',
      SPIRITUAL_GROWTH: 'Spiritual_Growth_and_Higher_Purpose',
      KARMIC_LESSONS: 'Karmic_Lessons_and_Past_Life_Themes',
      TRANSFORMATIVE_EVENTS: 'Transformative_Events_and_Rebirths',
    },
  },

  COMMUNICATION_BELIEFS: {
    label: 'Communication, Learning, and Belief Systems',
    subtopics: {
      COMMUNICATION_STYLES: 'Communication_and_Learning_Styles',
      PHILOSOPHICAL_BELIEFS: 'Philosophical_Beliefs_and_Personal_Worldview',
      TRAVEL_EXPERIENCES: 'Travel_and_Cross-Cultural_Experiences',
      MENTAL_GROWTH_CHALLENGES: 'Challenges_to_Mental_Growth_and_Adaptability',
    },
  },
};


  export const HeadingEnum = {
    PERSONAL_IDENTITY: 'Personal_Identity_and_Self-Image',
    OUTWARD_EXPRESSION: 'Outward_Expression_and_Appearance',
    INNER_SELF: 'Inner_Self_and_Emotional_Dynamics',
    CHALLENGES_TENSION: 'Challenges_and_Tension',
    PATH_INTEGRATION: 'Path_of_Integration',

    EMOTIONAL_FOUNDATIONS: 'Emotional_Foundations_and_Security_Needs',
    FAMILY_DYNAMICS: 'Family_Dynamics_and_Past_Influences',
    HOME_ENVIRONMENT: 'Home_Environment_and_Preferences',
    FAMILY_CHALLENGES: 'Challenges_and_Growth_in_Family_Life',
    HARMONIOUS_HOME: 'Synthesizing_a_Harmonious_Physical_and_Emotional_Home',

    RELATIONSHIP_DESIRES: 'Core_Relationship_Desires_and_Boundaries',
    LOVE_STYLE: 'Love_Style:_Expression_and_Attraction',
    SEXUAL_NATURE: 'Sexual_Nature_and_Intimacy',
    COMMITMENT_APPROACH: 'Commitment_Approach_and_Long-term_Vision',
    RELATIONSHIP_CHALLENGES: 'Challenges_and_Growth_in_Relationships',
    ROMANTIC_SUMMARY: 'Romantic_Summary',
    SOCIAL_NETWORKS: 'Social_Networks_and_Community',

    CAREER_MOTIVATIONS: 'Career_Motivations_and_Ambitions',
    PUBLIC_IMAGE: 'Public_Image,_Reputation,_and_Leadership_Style',
    CAREER_CHALLENGES: 'Challenges_and_Growth_Opportunities_in_Profession',
    SKILLS_TALENTS: 'Skills,_Talents,_and_Strengths',
    CAREER_SUMMARY: 'Summary_and_Path_To_Success',

    PSYCHOLOGICAL_PATTERNS: 'Deep_Psychological_Patterns',
    SPIRITUAL_GROWTH: 'Spiritual_Growth_and_Hidden_Strengths',
    KARMIC_LESSONS: 'Karmic_Lessons_and_Past_Life_Influences',
    TRANSFORMATIVE_EVENTS: 'Transformative_Events_and_Personal_Metamorphosis',

    COMMUNICATION_STYLES: 'Communication_and_Learning_Styles',
    PHILOSOPHICAL_BELIEFS: 'Philosophical_Beliefs_and_Higher_Learning',
    TRAVEL_EXPERIENCES: 'Travel_and_Cross-Cultural_Experiences',

    QUADRANTS: 'Quadrants',
    ELEMENTS: 'Elements',
    MODALITIES: 'Modalities',
    PATTERN: 'Pattern',

    SUN: 'Sun',
    MOON: 'Moon',
    ASCENDANT: 'Ascendant',
    MERCURY: 'Mercury',
    VENUS: 'Venus',
    MARS: 'Mars',
    SATURN: 'Saturn',
    JUPITER: 'Jupiter',
    URANUS: 'Uranus',
    NEPTUNE: 'Neptune',
    PLUTO: 'Pluto',

  };

  const personality_headings = [
    HeadingEnum.PERSONAL_IDENTITY,
    HeadingEnum.OUTWARD_EXPRESSION,
    HeadingEnum.INNER_SELF,
    HeadingEnum.CHALLENGES_TENSION,
    HeadingEnum.PATH_INTEGRATION,
  ];

  const home_headings = [
    HeadingEnum.EMOTIONAL_FOUNDATIONS,
    HeadingEnum.FAMILY_DYNAMICS,
    HeadingEnum.HOME_ENVIRONMENT,
    HeadingEnum.FAMILY_CHALLENGES,
    HeadingEnum.HARMONIOUS_HOME,
  ];

  const relationship_headings = [
    HeadingEnum.RELATIONSHIP_DESIRES,
    HeadingEnum.LOVE_STYLE,
    HeadingEnum.SEXUAL_NATURE,
    HeadingEnum.COMMITMENT_APPROACH,
    HeadingEnum.RELATIONSHIP_CHALLENGES,
    HeadingEnum.ROMANTIC_SUMMARY,
    HeadingEnum.SOCIAL_NETWORKS,
  ];

  const career_headings = [
    HeadingEnum.CAREER_MOTIVATIONS,
    HeadingEnum.PUBLIC_IMAGE,
    HeadingEnum.CAREER_CHALLENGES,
    HeadingEnum.SKILLS_TALENTS,
    HeadingEnum.CAREER_SUMMARY,
  ];

  const unconscious_headings = [
    HeadingEnum.PSYCHOLOGICAL_PATTERNS,
    HeadingEnum.SPIRITUAL_GROWTH,
    HeadingEnum.KARMIC_LESSONS,
    HeadingEnum.TRANSFORMATIVE_EVENTS,
  ];

  const communication_headings = [
    HeadingEnum.COMMUNICATION_STYLES,
    HeadingEnum.PHILOSOPHICAL_BELIEFS,
    HeadingEnum.TRAVEL_EXPERIENCES,
  ];

  export const dominance_headings = [
    HeadingEnum.QUADRANTS,
    HeadingEnum.ELEMENTS,
    HeadingEnum.MODALITIES,
    HeadingEnum.PATTERN,
  ];

  export const planet_headings = [
    HeadingEnum.SUN,
    HeadingEnum.MOON,
    HeadingEnum.ASCENDANT,
    HeadingEnum.MERCURY,
    HeadingEnum.VENUS,
    HeadingEnum.MARS,
    HeadingEnum.SATURN,
    HeadingEnum.JUPITER,
    HeadingEnum.URANUS,
    HeadingEnum.NEPTUNE,
    HeadingEnum.PLUTO,
  ];

  export function getBigFourType(subheading: string) {
    for (const [bigFourType, headings] of Object.entries(heading_map)) {
      if ((headings as string[]).includes(subheading)) {
        return bigFourType;
      }
    }
    return null;
  }

  export const HeadingTransitEnum = {
    PERSONAL_GROWTH: 'Personal Growth and Self-Improvement',
    RELATIONSHIPS: 'Relationships and Social Connections',
    CAREER_FINANCES: 'Career, Finances, and Professional Life',
    HEALTH_WELLBEING: 'Health, Wellness, and Vitality',
    HOME_ENVIRONMENT: 'Home Life and Living Environment',
    SOCIAL_LIFE: 'Social Life and Community Involvement',
    SPIRITUALITY_INNER_PEACE: 'Spirituality and Inner Peace',
    OPPORTUNITIES_CHALLENGES: 'Opportunities and Challenges Ahead',
};



export const heading_map: Record<string, string[]> = {
  'personality': personality_headings,
  'home': home_headings,
  'relationships': relationship_headings,
  'career': career_headings,
  'unconscious': unconscious_headings,
  'communication': communication_headings,
};

export const elements = {
  'Fire': ['Leo', 'Aries', 'Sagittarius'],
  'Earth': ['Taurus', 'Virgo', 'Capricorn'],
  'Air': ['Gemini', 'Libra', 'Aquarius'],
  'Water': ['Cancer', 'Scorpio', 'Pisces'],
};

export const elementPoints = {
  'Sun': 3,
  'Moon': 3,
  'Ascendant': 3,
  'Mercury': 2,
  'Venus': 2,
  'Mars': 2,
  'Saturn': 2,
  'Jupiter': 2,
  'Uranus': 1,
  'Neptune': 1,
  'Pluto': 1,
  'Node': 1,
  'Midheaven': 1,
};

export const quadrants = {
  'SouthEast': [10, 11, 12],
  'NorthEast': [1, 2, 3],
  'NorthWest': [4, 5, 6],
  'SouthWest': [7, 8, 9],
};

export const modalities = {
  'Cardinal': ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  'Fixed': ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  'Mutable': ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'],
};

export const ignorePlanets = [
  'Ascendant', 'Midheaven', 'Chiron', 'Part of Fortune', 'South Node', 'Node',
];
export const ignorePoints = ['Chiron', 'Part of Fortune', 'South Node'];

export const planetCodes = {
  'Sun': 'pSu',
  'Moon': 'pMo',
  'Mercury': 'pMe',
  'Venus': 'pVe',
  'Mars': 'pMa',
  'Jupiter': 'pJu',
  'Saturn': 'pSa',
  'Uranus': 'pUr',
  'Neptune': 'pNe',
  'Pluto': 'pPl',
  'Ascendant': 'pAs',
  'Midheaven': 'pMi',
  'Node': 'pNo',
  'South Node': 'pSo',
  'Chiron': 'pCh',
  'Part of Fortune': 'pPa',
};

  export const signCodes = {
    'Aries': 'sAr',
    'Taurus': 'sTa',
    'Gemini': 'sGe',
    'Cancer': 'sCa',
    'Leo': 'sLe',
    'Virgo': 'sVi',
    'Libra': 'sLi',
    'Scorpio': 'sSc',
    'Sagittarius': 'sSa',
    'Capricorn': 'sCp',
    'Aquarius': 'sAq',
    'Pisces': 'sPi',
  };

export const transitCodes = {
    'conjunction': 'aCo',
    'sextile': 'aSe',
    'square': 'aSq',
    'trine': 'aTr',
    'opposition': 'aOp',
    'quincunx': 'aQu',
  };

  export const orbCodes = {
    'loose': 'L',
    'close': 'C',
    'exact': 'E',
    '': 'G',
  };

  export const chart = {
    'natal': 'Na-',
    'progressed': 'Pg-',
    'transiting': 'Tr-',
  };


  export const orbDegrees = {
    'Moon': 8,
    'Mercury': 5,
    'Venus': 5,
    'Sun': 5,
    'Mars': 3,
    'Jupiter': 3,
    'Saturn': 3,
    'Uranus': 3,
    'Neptune': 3,
    'Pluto': 3,
  };

  export const aspects = [
    { 'name': 'conjunction', 'orb': 0 },
    { 'name': 'sextile', 'orb': 60 },
    { 'name': 'square', 'orb': 90 },
    { 'name': 'trine', 'orb': 120 },
    { 'name': 'quincunx', 'orb': 150 },
    { 'name': 'opposition', 'orb': 180 },
  ];

  export const moonPhases = {
    conjunction: 'New Moon',
    square: 'Quarter Moon',
    opposition: 'Full Moon',
    sextile: 'Waxing/Waning Moon',
    trine: 'Waxing/Waning Moon',
  };


  export const CompositeChartHeadingEnums = {
    ATTRACTION_CHEMISTRY: 'Attraction & Chemistry',
    EMOTIONAL_SECURITY_CONNECTION: 'Emotional Security and Connection',
    SEXUAL_NATURE: 'Sexual Nature and Intimacy',
    COMMUNICATION_STYLE: 'Communication Style and Learning Styles',
    MENTAL_CONNECTION: 'Mental Connection and Intellectual Compatibility',
    COMMITMENT_LONG_TERM_POTENTIAL: 'Commitment Approach and Long-term potential',
    RELATIONSHIP_CHALLENGES: 'Challenges and Growth in Relationships',
    SHARED_GOALS_VALUES: 'Shared Goals and Values',
    SOCIAL_COMMUNITY: 'Social Community and Social Networks',
    SPIRITUAL_KARMIC_LESSONS: 'Spiritual Lessons and Karmic Patterns',
};

export const CONTENT_TYPE_HEADER = 'Content-Type';
export const APPLICATION_JSON = 'application/json';
export const HTTP_POST = 'POST';
export const JSON_HEADERS = { [CONTENT_TYPE_HEADER]: APPLICATION_JSON };
export const ERROR_API_CALL = 'Error in API call:';

