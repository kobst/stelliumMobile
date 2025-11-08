// Utility to decode natal placement (Pp-) and aspect (A-) codes
// Example:
//  - Pp-SusSc12 -> Sun in Scorpio, 12th house
//  - A-MesSa01CaSqJusVi10 -> Mercury in Sagittarius (1st) close square Jupiter in Virgo (10th)

export type Placement = {
  type: 'placement';
  planet: string;
  sign: string;
  house: number;
  pretty: string;
};

export type Aspect = {
  type: 'aspect';
  p1: { planet: string; sign: string; house: number };
  p2: { planet: string; sign: string; house: number };
  aspect: string; // e.g., 'square'
  orbTier: string; // e.g., 'close'
  pretty: string;
};

export type SynastryAspect = {
  type: 'synastry';
  p1: { planet: string; sign: string; house: number; person: 1 };
  p2: { planet: string; sign: string; house: number; person: 2 };
  aspect: string; // e.g., 'conjunction'
  orbTier: string; // e.g., 'close'
  pretty: string;
};

export type Transit = {
  type: 'transit';
  transitPlanet: string;
  transitSign: string;
  aspect: string;
  orbTier: string;
  natalPlanet: string;
  natalSign: string;
  pretty: string;
};

export type CompositePlacement = {
  type: 'compositePlacement';
  planet: string;
  house: number;
  pretty: string;
};

export type CompositeAspect = {
  type: 'compositeAspect';
  p1: { planet: string; house: number };
  p2: { planet: string; house: number };
  aspect: string;
  orbTier: string;
  pretty: string;
};

const planetMap: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Me: 'Mercury', Ve: 'Venus', Ma: 'Mars',
  Ju: 'Jupiter', Sa: 'Saturn', Ur: 'Uranus', Ne: 'Neptune', Pl: 'Pluto',
  No: 'Node', As: 'Ascendant', Mi: 'Midheaven', Ds: 'Descendant', Ic: 'IC'
};

const signMap: Record<string, string> = {
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Ca: 'Cancer', Le: 'Leo', Vi: 'Virgo',
  Li: 'Libra', Sc: 'Scorpio', Sa: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
};

const aspectTypeMap: Record<string, string> = {
  Co: 'conjunction', Sq: 'square', Tr: 'trine', Se: 'sextile', Op: 'opposition', Qu: 'quincunx'
};

const orbTierMap: Record<string, string> = {
  Ea: 'exact', Ca: 'close', Ga: 'wide'
};

// Pp-<Pl>s<Si><HH>
const placementRe = /^Pp-([A-Za-z]{2})s([A-Za-z]{2})(\d{2})$/;

// A-<Pl1>s<Si1><H1><Orb><Type><Pl2>s<Si2><H2>
const aspectRe = /^A-([A-Za-z]{2})s([A-Za-z]{2})(\d{2})(Ea|Ca|Ga)(Co|Sq|Tr|Se|Op|Qu)([A-Za-z]{2})s([A-Za-z]{2})(\d{2})$/;

// SynA-P1(<Pl1>s<Si1><H1>)-<Orb><Type>-P2(<Pl2>s<Si2><H2>)
// Example: SynA-P1(SusAr03)-CaCo-P2(MesAr04)
const synastryRe = /^SynA-P1\(([A-Za-z]{2})s([A-Za-z]{2})(\d{2})\)-(Ea|Ca|Ga)(Co|Sq|Tr|Se|Op|Qu)-P2\(([A-Za-z]{2})s([A-Za-z]{2})(\d{2})\)$/;

// Transit pattern: Tr-<TransitPl>s<TransitSi>-<Orb><Type>-Na<NatalPl>s<NatalSi>
// Example: Tr-MesSa-CaCo-NaVeSa (Transit Mercury in Sag close conjunction natal Venus in Sag)
const transitRe = /^Tr-([A-Za-z]{2})s([A-Za-z]{2})-(Ea|Ca|Ga)(Co|Sq|Tr|Se|Op|Qu)-Na([A-Za-z]{2})s([A-Za-z]{2})$/;

// Composite placement pattern: CompP-<PlanetName>-H<HH>
// Example: CompP-Mercury-H07 (Composite Mercury in 7th house)
const compositePlacementRe = /^CompP-([A-Za-z]+)-H(\d{2})$/;

// Composite aspect pattern: CompA-<Pl1><H1><Orb><Type><Pl2><H2>
// Example: CompA-Mo00CaSeSa00 (Composite Moon in house 0 close sextile Saturn in house 0)
const compositeAspectRe = /^CompA-([A-Za-z]{2})(\d{2})(Ea|Ca|Ga)(Co|Sq|Tr|Se|Op|Qu)([A-Za-z]{2})(\d{2})$/;

function houseLabel(h: number): string {
  return h === 1 ? '1st' : h === 2 ? '2nd' : h === 3 ? '3rd' : `${h}th`;
}

export function decodeAstroCode(
  code: string,
  options?: { person1Name?: string; person2Name?: string }
): Placement | Aspect | SynastryAspect | Transit | CompositePlacement | CompositeAspect | null {
  // Try placement pattern
  const pMatch = placementRe.exec(code);
  if (pMatch) {
    const [, pTok, sTok, hStr] = pMatch;
    const planet = planetMap[pTok] || pTok;
    const sign = signMap[sTok] || sTok;
    const house = parseInt(hStr, 10);
    return {
      type: 'placement',
      planet,
      sign,
      house,
      pretty: `${planet} in ${sign}, ${houseLabel(house)} house`,
    };
  }

  // Try natal aspect pattern
  const aMatch = aspectRe.exec(code);
  if (aMatch) {
    const [, p1Tok, s1Tok, h1Str, orbTok, aspTok, p2Tok, s2Tok, h2Str] = aMatch;
    const p1 = {
      planet: planetMap[p1Tok] || p1Tok,
      sign: signMap[s1Tok] || s1Tok,
      house: parseInt(h1Str, 10),
    };
    const p2 = {
      planet: planetMap[p2Tok] || p2Tok,
      sign: signMap[s2Tok] || s2Tok,
      house: parseInt(h2Str, 10),
    };
    const aspect = aspectTypeMap[aspTok] || aspTok;
    const orbTier = orbTierMap[orbTok] || orbTok;

    return {
      type: 'aspect',
      p1,
      p2,
      aspect,
      orbTier,
      pretty: `${p1.planet} in ${p1.sign} (${houseLabel(p1.house)}) ${orbTier} ${aspect} ${p2.planet} in ${p2.sign} (${houseLabel(p2.house)})`,
    };
  }

  // Try synastry aspect pattern
  const synMatch = synastryRe.exec(code);
  if (synMatch) {
    const [, p1Tok, s1Tok, h1Str, orbTok, aspTok, p2Tok, s2Tok, h2Str] = synMatch;
    const p1 = {
      planet: planetMap[p1Tok] || p1Tok,
      sign: signMap[s1Tok] || s1Tok,
      house: parseInt(h1Str, 10),
      person: 1 as const,
    };
    const p2 = {
      planet: planetMap[p2Tok] || p2Tok,
      sign: signMap[s2Tok] || s2Tok,
      house: parseInt(h2Str, 10),
      person: 2 as const,
    };
    const aspect = aspectTypeMap[aspTok] || aspTok;
    const orbTier = orbTierMap[orbTok] || orbTok;

    // Use actual person names if provided, otherwise fall back to "Person 1" / "Person 2"
    const person1Label = options?.person1Name || 'Person 1';
    const person2Label = options?.person2Name || 'Person 2';

    return {
      type: 'synastry',
      p1,
      p2,
      aspect,
      orbTier,
      pretty: `${person1Label}'s ${p1.planet} in ${p1.sign} (${houseLabel(p1.house)}) ${orbTier} ${aspect} ${person2Label}'s ${p2.planet} in ${p2.sign} (${houseLabel(p2.house)})`,
    };
  }

  // Try transit pattern
  const trMatch = transitRe.exec(code);
  if (trMatch) {
    const [, trPlTok, trSiTok, orbTok, aspTok, naPlTok, naSiTok] = trMatch;
    const transitPlanet = planetMap[trPlTok] || trPlTok;
    const transitSign = signMap[trSiTok] || trSiTok;
    const natalPlanet = planetMap[naPlTok] || naPlTok;
    const natalSign = signMap[naSiTok] || naSiTok;
    const aspect = aspectTypeMap[aspTok] || aspTok;
    const orbTier = orbTierMap[orbTok] || orbTok;

    return {
      type: 'transit',
      transitPlanet,
      transitSign,
      aspect,
      orbTier,
      natalPlanet,
      natalSign,
      pretty: `Transit ${transitPlanet} in ${transitSign} ${orbTier} ${aspect} natal ${natalPlanet} in ${natalSign}`,
    };
  }

  // Try composite placement pattern
  const compPlMatch = compositePlacementRe.exec(code);
  if (compPlMatch) {
    const [, planetName, hStr] = compPlMatch;
    const house = parseInt(hStr, 10);

    return {
      type: 'compositePlacement',
      planet: planetName,
      house,
      pretty: `Composite ${planetName} in ${houseLabel(house)} house`,
    };
  }

  // Try composite aspect pattern
  const compAspMatch = compositeAspectRe.exec(code);
  if (compAspMatch) {
    const [, p1Tok, h1Str, orbTok, aspTok, p2Tok, h2Str] = compAspMatch;
    const p1 = {
      planet: planetMap[p1Tok] || p1Tok,
      house: parseInt(h1Str, 10),
    };
    const p2 = {
      planet: planetMap[p2Tok] || p2Tok,
      house: parseInt(h2Str, 10),
    };
    const aspect = aspectTypeMap[aspTok] || aspTok;
    const orbTier = orbTierMap[orbTok] || orbTok;

    // Format pretty string - only include house if not 0
    const p1HouseStr = p1.house > 0 ? ` (${houseLabel(p1.house)})` : '';
    const p2HouseStr = p2.house > 0 ? ` (${houseLabel(p2.house)})` : '';

    return {
      type: 'compositeAspect',
      p1,
      p2,
      aspect,
      orbTier,
      pretty: `Composite ${p1.planet}${p1HouseStr} ${orbTier} ${aspect} ${p2.planet}${p2HouseStr}`,
    };
  }

  return null;
}

