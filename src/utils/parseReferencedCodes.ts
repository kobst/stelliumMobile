// Utility to parse referenced codes from API responses and convert them to rich element objects
import { decodeAstroCode, Placement, Aspect, SynastryAspect, Transit, CompositePlacement, CompositeAspect } from './astroCode';
import { BirthChartElement, BirthChartPosition, BirthChartAspect } from '../api/charts';

// Type for decoded elements
export type DecodedElement = Placement | Aspect | SynastryAspect | Transit | CompositePlacement | CompositeAspect;

// Parse referenced codes and return decoded elements
export function parseReferencedCodes(
  codes: string[] | undefined,
  options?: { person1Name?: string; person2Name?: string }
): DecodedElement[] {
  if (!codes || codes.length === 0) {
    return [];
  }

  const decodedElements: DecodedElement[] = [];

  for (const code of codes) {
    try {
      const decoded = decodeAstroCode(code, options);
      if (decoded) {
        decodedElements.push(decoded);
      } else {
        console.warn(`Could not decode referenced code: ${code}`);
      }
    } catch (error) {
      console.error(`Error decoding referenced code ${code}:`, error);
    }
  }

  return decodedElements;
}

// Convert decoded placements/aspects to BirthChartElement format
export function convertToBirthChartElements(
  decodedElements: DecodedElement[]
): BirthChartElement[] {
  const birthChartElements: BirthChartElement[] = [];

  for (const element of decodedElements) {
    if (element.type === 'placement') {
      const position: BirthChartPosition = {
        type: 'position',
        planet: element.planet,
        sign: element.sign,
        house: element.house,
        degree: 0, // Not available from code
        description: element.pretty,
      };
      birthChartElements.push(position);
    } else if (element.type === 'aspect') {
      const aspect: BirthChartAspect = {
        type: 'aspect',
        planet1: element.p1.planet,
        planet2: element.p2.planet,
        aspectType: element.aspect,
        orb: 0, // Not available from code
        planet1Sign: element.p1.sign,
        planet2Sign: element.p2.sign,
        planet1House: element.p1.house,
        planet2House: element.p2.house,
        description: element.pretty,
      };
      birthChartElements.push(aspect);
    }
    // Skip synastry and transit elements for birth chart conversion
  }

  return birthChartElements;
}

// Helper to get display description for any decoded element
export function getElementDescription(element: DecodedElement): string {
  return element.pretty;
}

// Helper to categorize element type for UI display
export function getElementCategory(element: DecodedElement): 'natal' | 'synastry' | 'transit' | 'composite' {
  if (element.type === 'placement' || element.type === 'aspect') {
    return 'natal';
  } else if (element.type === 'synastry') {
    return 'synastry';
  } else if (element.type === 'compositePlacement' || element.type === 'compositeAspect') {
    return 'composite';
  } else {
    return 'transit';
  }
}
