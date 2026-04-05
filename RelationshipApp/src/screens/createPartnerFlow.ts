import { SubjectDocument } from '../../../shared/types/subject';
import {
  getEpochSeconds,
  isValidDate,
  isValidTime,
  parseNumberInput,
} from '../utils/birthData';

export interface PartnerDraft {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  birthTimeUnknown: boolean;
  placeOfBirth: string;
  latitude: string;
  longitude: string;
  timezoneOffset: string;
}

export interface RelationshipSelfProfileRef {
  id: string;
  firebaseUid: string | null;
}

export interface ResolvedLocationFields {
  placeOfBirth: string;
  lat: number | null;
  lon: number | null;
  tzone: number | null;
}

interface LocationResolverDeps {
  canUseGoogleServices: boolean;
  geocodeLocation: (place: string) => Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  }>;
  fetchTimeZone: (lat: number, lon: number, epochSeconds: number) => Promise<number>;
}

interface SubmitPartnerPreviewDeps extends LocationResolverDeps {
  createGuestSubject: (request: {
    firstName: string;
    lastName: string;
    gender: string;
    placeOfBirth: string;
    dateOfBirth: string;
    time: string;
    lat: number;
    lon: number;
    tzone: number;
    unknownTime: false;
    firebaseUid: string;
    ownerUserId: string;
  }) => Promise<SubjectDocument>;
  createGuestSubjectUnknownTime: (request: {
    firstName: string;
    lastName: string;
    gender: string;
    placeOfBirth: string;
    dateOfBirth: string;
    lat: number;
    lon: number;
    tzone: number;
    ownerUserId: string;
  }) => Promise<SubjectDocument>;
}

export function validatePartnerDraft(
  draft: PartnerDraft,
  selfProfile: RelationshipSelfProfileRef | null
): string | null {
  if (!selfProfile?.id) {
    return 'Create your self profile before starting a relationship preview.';
  }

  if (!draft.firstName.trim() || !draft.lastName.trim()) {
    return 'First and last name are required.';
  }

  if (!isValidDate(draft.dateOfBirth)) {
    return 'Date of birth must use YYYY-MM-DD and be a real date.';
  }

  if (!draft.birthTimeUnknown && !isValidTime(draft.timeOfBirth)) {
    return 'Birth time must use 24-hour HH:MM format.';
  }

  if (!draft.placeOfBirth.trim()) {
    return 'Place of birth is required.';
  }

  return null;
}

export async function resolvePartnerLocationFields(
  draft: PartnerDraft,
  deps: LocationResolverDeps
): Promise<ResolvedLocationFields> {
  let resolvedPlace = draft.placeOfBirth.trim();
  let resolvedLat = parseNumberInput(draft.latitude);
  let resolvedLon = parseNumberInput(draft.longitude);
  let resolvedTzone = parseNumberInput(draft.timezoneOffset);

  if (
    (resolvedLat === null || resolvedLon === null) &&
    resolvedPlace &&
    deps.canUseGoogleServices
  ) {
    const geocoded = await deps.geocodeLocation(resolvedPlace);
    resolvedLat = geocoded.lat;
    resolvedLon = geocoded.lng;
    resolvedPlace = geocoded.formattedAddress;
  }

  if (
    resolvedTzone === null &&
    resolvedLat !== null &&
    resolvedLon !== null &&
    deps.canUseGoogleServices
  ) {
    const timeForTimezone = draft.birthTimeUnknown ? '12:00' : draft.timeOfBirth;
    const epochTimeSeconds = getEpochSeconds(draft.dateOfBirth, timeForTimezone);
    resolvedTzone = await deps.fetchTimeZone(resolvedLat, resolvedLon, epochTimeSeconds);
  }

  return {
    placeOfBirth: resolvedPlace,
    lat: resolvedLat,
    lon: resolvedLon,
    tzone: resolvedTzone,
  };
}

export async function submitPartnerPreview(
  draft: PartnerDraft,
  selfProfile: RelationshipSelfProfileRef,
  deps: SubmitPartnerPreviewDeps
): Promise<{
  partner: SubjectDocument;
  resolvedLocation: ResolvedLocationFields;
}> {
  const validationError = validatePartnerDraft(draft, selfProfile);
  if (validationError) {
    throw new Error(validationError);
  }

  const resolvedLocation = await resolvePartnerLocationFields(draft, deps);

  if (
    resolvedLocation.lat === null ||
    resolvedLocation.lon === null ||
    resolvedLocation.tzone === null
  ) {
    throw new Error(
      'Latitude, longitude, and timezone offset are required. Use autofill or enter them manually.'
    );
  }

  const partner = draft.birthTimeUnknown
    ? await deps.createGuestSubjectUnknownTime({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender,
        placeOfBirth: resolvedLocation.placeOfBirth,
        dateOfBirth: draft.dateOfBirth,
        lat: resolvedLocation.lat,
        lon: resolvedLocation.lon,
        tzone: resolvedLocation.tzone,
        ownerUserId: selfProfile.id,
      })
    : await deps.createGuestSubject({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender,
        placeOfBirth: resolvedLocation.placeOfBirth,
        dateOfBirth: draft.dateOfBirth,
        time: draft.timeOfBirth,
        lat: resolvedLocation.lat,
        lon: resolvedLocation.lon,
        tzone: resolvedLocation.tzone,
        unknownTime: false,
        firebaseUid: selfProfile.firebaseUid ?? selfProfile.id,
        ownerUserId: selfProfile.id,
      });

  return {
    partner,
    resolvedLocation,
  };
}
