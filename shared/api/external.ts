import Config from 'react-native-config';

export interface TimeZoneResponse {
  dstOffset: number;
  rawOffset: number;
  status: string;
  timeZoneId: string;
  timeZoneName: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  primaryText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  displayName: string;
  lat: number | null;
  lng: number | null;
}

function getGoogleApiKey(): string {
  return (Config.GOOGLE_API_KEY || '').trim().replace(/^['"]+|['"]+$/g, '');
}

export const externalApi = {
  // Fetch timezone information from Google Maps API
  fetchTimeZone: async (
    lat: number,
    lon: number,
    epochTimeSeconds: number
  ): Promise<number> => {
    const apiKey = getGoogleApiKey();
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${epochTimeSeconds}&key=${apiKey}`;

    console.log('\n=== FETCHING TIMEZONE ===');
    console.log('Google API Key:', apiKey ? 'Set' : 'Not set');
    console.log('URL:', url);
    console.log('Params:', { lat, lon, epochTimeSeconds });

    try {
      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}; body: ${errorBody}`);
      }

      const data: TimeZoneResponse = await response.json();
      console.log('Response data:', data);

      if (data.status !== 'OK') {
        throw new Error(`Error from TimeZone API: ${data.status}`);
      }

      const totalOffsetHours = (data.rawOffset + data.dstOffset) / 3600;
      console.log(`Total Offset in Hours: ${totalOffsetHours}`);
      console.log('=======================\n');

      return totalOffsetHours;
    } catch (error) {
      console.error('\n=== TIMEZONE FETCH ERROR ===');
      console.error('Error fetching time zone:', error);
      console.error('===========================\n');
      throw error;
    }
  },

  // Geocode location to get coordinates
  geocodeLocation: async (location: string): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  }> => {
    const apiKey = getGoogleApiKey();
    const encodedLocation = encodeURIComponent(location);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}; body: ${errorBody}`);
      }

      const data = await response.json();
      if (data.status !== 'OK' || !data.results.length) {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      console.error('Error geocoding location:', error);
      throw error;
    }
  },

  fetchPlaceSuggestions: async (
    input: string,
    sessionToken?: string
  ): Promise<PlaceSuggestion[]> => {
    const apiKey = getGoogleApiKey();
    const url = 'https://places.googleapis.com/v1/places:autocomplete';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text',
        },
        body: JSON.stringify({
          input: input.trim(),
          includedPrimaryTypes: ['(cities)'],
          ...(sessionToken ? { sessionToken } : {}),
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}; body: ${errorBody}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        return [];
      }

      return data.suggestions
        .map((suggestion: any) => suggestion.placePrediction)
        .filter(Boolean)
        .map((prediction: any) => {
          const text = prediction.text?.text ?? '';
          const matches = Array.isArray(prediction.text?.matches) ? prediction.text.matches : [];
          const firstMatch = matches[0];
          const endOffset =
            typeof firstMatch?.endOffset === 'number'
              ? firstMatch.endOffset
              : typeof firstMatch?.endOffset === 'string'
                ? Number(firstMatch.endOffset)
                : 0;
          const primaryText = endOffset > 0 ? text.slice(0, endOffset) : text;
          const secondaryText = endOffset > 0 ? text.slice(endOffset).replace(/^,\s*/, '') : '';

          return {
            placeId: prediction.placeId,
            description: text,
            primaryText: primaryText || text,
            secondaryText,
          };
        });
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      throw error;
    }
  },

  fetchPlaceDetails: async (
    placeId: string,
    sessionToken?: string
  ): Promise<PlaceDetails> => {
    const apiKey = getGoogleApiKey();
    const params = new URLSearchParams();
    if (sessionToken) {
      // RN's URLSearchParams has no `set` (throws at runtime); append is safe on an empty params object.
      params.append('sessionToken', sessionToken);
    }
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}; body: ${errorBody}`);
      }

      const data = await response.json();
      return {
        placeId: data.id ?? placeId,
        formattedAddress: data.formattedAddress ?? data.displayName?.text ?? '',
        displayName: data.displayName?.text ?? '',
        lat: typeof data.location?.latitude === 'number' ? data.location.latitude : null,
        lng: typeof data.location?.longitude === 'number' ? data.location.longitude : null,
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  },

  // Reverse geocode coordinates to get location
  reverseGeocode: async (lat: number, lng: number): Promise<string> => {
    const apiKey = getGoogleApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}; body: ${errorBody}`);
      }

      const data = await response.json();
      if (data.status !== 'OK' || !data.results.length) {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }

      return data.results[0].formatted_address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  },
};
