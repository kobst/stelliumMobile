import {
  PartnerDraft,
  resolvePartnerLocationFields,
  submitPartnerPreview,
  validatePartnerDraft,
} from '../RelationshipApp/src/screens/createPartnerFlow';

function makeDraft(overrides: Partial<PartnerDraft> = {}): PartnerDraft {
  return {
    firstName: 'Taylor',
    lastName: 'Smith',
    gender: 'other',
    dateOfBirth: '1995-01-01',
    timeOfBirth: '12:00',
    birthTimeUnknown: false,
    placeOfBirth: 'Brooklyn, NY',
    latitude: '',
    longitude: '',
    timezoneOffset: '',
    ...overrides,
  };
}

describe('relationship app partner preview flow', () => {
  test('validates required self profile before preview creation', () => {
    const error = validatePartnerDraft(makeDraft(), null);
    expect(error).toBe('Create your self profile before starting a relationship preview.');
  });

  test('validates required name, date, time, and location fields', () => {
    expect(validatePartnerDraft(makeDraft({ firstName: '', lastName: '' }), { id: 'self_1', firebaseUid: null })).toBe(
      'First and last name are required.'
    );
    expect(validatePartnerDraft(makeDraft({ dateOfBirth: '2023-02-29' }), { id: 'self_1', firebaseUid: null })).toBe(
      'Date of birth must use YYYY-MM-DD and be a real date.'
    );
    expect(validatePartnerDraft(makeDraft({ timeOfBirth: '25:99' }), { id: 'self_1', firebaseUid: null })).toBe(
      'Birth time must use 24-hour HH:MM format.'
    );
    expect(validatePartnerDraft(makeDraft({ placeOfBirth: ' ' }), { id: 'self_1', firebaseUid: null })).toBe(
      'Place of birth is required.'
    );
    expect(
      validatePartnerDraft(
        makeDraft({ birthTimeUnknown: true, timeOfBirth: 'invalid' }),
        { id: 'self_1', firebaseUid: null }
      )
    ).toBeNull();
  });

  test('geocodes and derives timezone when location fields are missing and google services are enabled', async () => {
    const geocodeLocation = jest.fn().mockResolvedValue({
      lat: 40.7128,
      lng: -74.006,
      formattedAddress: 'New York, NY, USA',
    });
    const fetchTimeZone = jest.fn().mockResolvedValue(-5);

    const resolved = await resolvePartnerLocationFields(makeDraft(), {
      canUseGoogleServices: true,
      geocodeLocation,
      fetchTimeZone,
    });

    expect(geocodeLocation).toHaveBeenCalledWith('Brooklyn, NY');
    expect(fetchTimeZone).toHaveBeenCalledWith(40.7128, -74.006, expect.any(Number));
    expect(resolved).toEqual({
      placeOfBirth: 'New York, NY, USA',
      lat: 40.7128,
      lon: -74.006,
      tzone: -5,
    });
  });

  test('uses manual location values without geocoding when already provided', async () => {
    const geocodeLocation = jest.fn();
    const fetchTimeZone = jest.fn();

    const resolved = await resolvePartnerLocationFields(
      makeDraft({
        latitude: '34.0522',
        longitude: '-118.2437',
        timezoneOffset: '-8',
      }),
      {
        canUseGoogleServices: true,
        geocodeLocation,
        fetchTimeZone,
      }
    );

    expect(geocodeLocation).not.toHaveBeenCalled();
    expect(fetchTimeZone).not.toHaveBeenCalled();
    expect(resolved).toEqual({
      placeOfBirth: 'Brooklyn, NY',
      lat: 34.0522,
      lon: -118.2437,
      tzone: -8,
    });
  });

  test('does not attempt geocoding or timezone lookup when google services are disabled', async () => {
    const geocodeLocation = jest.fn();
    const fetchTimeZone = jest.fn();

    const resolved = await resolvePartnerLocationFields(makeDraft(), {
      canUseGoogleServices: false,
      geocodeLocation,
      fetchTimeZone,
    });

    expect(geocodeLocation).not.toHaveBeenCalled();
    expect(fetchTimeZone).not.toHaveBeenCalled();
    expect(resolved).toEqual({
      placeOfBirth: 'Brooklyn, NY',
      lat: null,
      lon: null,
      tzone: null,
    });
  });

  test('creates a known-time guest subject', async () => {
    const createGuestSubject = jest.fn().mockResolvedValue({ _id: 'guest_1' });
    const createGuestSubjectUnknownTime = jest.fn();

    const result = await submitPartnerPreview(
      makeDraft({
        firstName: ' Taylor ',
        lastName: ' Smith ',
        latitude: '40.7128',
        longitude: '-74.0060',
        timezoneOffset: '-5',
      }),
      { id: 'self_1', firebaseUid: 'firebase_123' },
      {
        canUseGoogleServices: false,
        geocodeLocation: jest.fn(),
        fetchTimeZone: jest.fn(),
        createGuestSubject,
        createGuestSubjectUnknownTime,
      }
    );

    expect(createGuestSubject).toHaveBeenCalledWith({
      firstName: 'Taylor',
      lastName: 'Smith',
      gender: 'other',
      placeOfBirth: 'Brooklyn, NY',
      dateOfBirth: '1995-01-01',
      time: '12:00',
      lat: 40.7128,
      lon: -74.006,
      tzone: -5,
      unknownTime: false,
      firebaseUid: 'firebase_123',
      ownerUserId: 'self_1',
    });
    expect(createGuestSubjectUnknownTime).not.toHaveBeenCalled();
    expect(result.partner).toEqual({ _id: 'guest_1' });
  });

  test('creates an unknown-time guest subject through the unknown-time path', async () => {
    const createGuestSubject = jest.fn();
    const createGuestSubjectUnknownTime = jest.fn().mockResolvedValue({ _id: 'guest_2' });
    await submitPartnerPreview(
      makeDraft({
        birthTimeUnknown: true,
        latitude: '51.5072',
        longitude: '-0.1276',
        timezoneOffset: '0',
      }),
      { id: 'self_2', firebaseUid: null },
      {
        canUseGoogleServices: false,
        geocodeLocation: jest.fn(),
        fetchTimeZone: jest.fn(),
        createGuestSubject,
        createGuestSubjectUnknownTime,
      }
    );

    expect(createGuestSubject).not.toHaveBeenCalled();
    expect(createGuestSubjectUnknownTime).toHaveBeenCalledWith({
      firstName: 'Taylor',
      lastName: 'Smith',
      gender: 'other',
      placeOfBirth: 'Brooklyn, NY',
      dateOfBirth: '1995-01-01',
      lat: 51.5072,
      lon: -0.1276,
      tzone: 0,
      ownerUserId: 'self_2',
    });
  });

  test('throws when location data is still incomplete after resolution', async () => {
    await expect(
      submitPartnerPreview(
        makeDraft(),
        { id: 'self_1', firebaseUid: null },
        {
          canUseGoogleServices: false,
          geocodeLocation: jest.fn(),
          fetchTimeZone: jest.fn(),
          createGuestSubject: jest.fn(),
          createGuestSubjectUnknownTime: jest.fn(),
        }
      )
    ).rejects.toThrow(
      'Latitude, longitude, and timezone offset are required. Use autofill or enter them manually.'
    );
  });
});
