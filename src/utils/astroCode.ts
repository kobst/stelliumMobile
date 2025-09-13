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

function houseLabel(h: number): string {
  return h === 1 ? '1st' : h === 2 ? '2nd' : h === 3 ? '3rd' : `${h}th`;
}

export function decodeAstroCode(code: string): Placement | Aspect | null {
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

  return null;
}

