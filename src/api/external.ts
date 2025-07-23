import { REACT_APP_GOOGLE_API_KEY } from '@env';

export interface TimeZoneResponse {
  dstOffset: number;
  rawOffset: number;
  status: string;
  timeZoneId: string;
  timeZoneName: string;
}

export const externalApi = {
  // Fetch timezone information from Google Maps API
  fetchTimeZone: async (
    lat: number,
    lon: number,
    epochTimeSeconds: number
  ): Promise<number> => {
    const apiKey = REACT_APP_GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${epochTimeSeconds}&key=${apiKey}`;

    console.log('\n=== FETCHING TIMEZONE ===');
    console.log('Google API Key:', apiKey ? 'Set' : 'Not set');
    console.log('URL:', url);
    console.log('Params:', { lat, lon, epochTimeSeconds });

    try {
      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    const apiKey = REACT_APP_GOOGLE_API_KEY;
    const encodedLocation = encodeURIComponent(location);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  // Reverse geocode coordinates to get location
  reverseGeocode: async (lat: number, lng: number): Promise<string> => {
    const apiKey = REACT_APP_GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
