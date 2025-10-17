export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  confidence?: number;
}

export interface GeocodingError {
  error: string;
  message: string;
}

/**
 * Simple geocoding service using a basic algorithm
 * In production, this should use a proper geocoding API like Google Maps or OpenStreetMap
 */
export class GeocodingService {
  /**
   * Geocode an address to latitude/longitude coordinates
   * This is a simplified implementation - in production, use a proper geocoding service
   */
  static async geocodeAddress(address: string, city: string, state: string): Promise<GeocodingResult | GeocodingError> {
    try {
      // For demo purposes, we'll use a simple mapping for Nigerian cities
      // In production, integrate with Google Maps Geocoding API, Mapbox, or similar

      const addressKey = `${address.toLowerCase()}, ${city.toLowerCase()}, ${state.toLowerCase()}`;

      // Simple mapping for common Nigerian locations (demo data)
      const locationMap: Record<string, { lat: number; lng: number; confidence: number }> = {
        // Lagos coordinates
        'victoria island': { lat: 6.4474, lng: 3.3903, confidence: 0.9 },
        'ikeja': { lat: 6.6018, lng: 3.3515, confidence: 0.9 },
        'lekki': { lat: 6.4698, lng: 3.5852, confidence: 0.9 },

        // Abuja coordinates
        'asokoro': { lat: 9.0556, lng: 7.4951, confidence: 0.9 },
        'wuse': { lat: 9.0765, lng: 7.3986, confidence: 0.9 },
        'maitama': { lat: 9.0935, lng: 7.4869, confidence: 0.9 },

        // Default fallback coordinates (Abuja center)
        'default': { lat: 9.0765, lng: 8.6753, confidence: 0.5 }
      };

      // Try to find a match
      for (const [key, coords] of Object.entries(locationMap)) {
        if (addressKey.includes(key) || city.toLowerCase().includes(key)) {
          return {
            latitude: coords.lat,
            longitude: coords.lng,
            confidence: coords.confidence
          };
        }
      }

      // Return default coordinates if no match found
      return {
        latitude: locationMap.default.lat,
        longitude: locationMap.default.lng,
        confidence: locationMap.default.confidence
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        error: 'GEOCODING_ERROR',
        message: 'Failed to geocode address'
      };
    }
  }

  /**
   * Reverse geocode coordinates to address (simplified implementation)
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<{ address: string; city: string; state: string } | GeocodingError> {
    try {
      // Simplified reverse geocoding - in production, use proper service
      const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Check against known locations
      const knownLocations = [
        { name: 'Victoria Island, Lagos', lat: 6.4474, lng: 3.3903, city: 'Lagos', state: 'Lagos' },
        { name: 'Ikeja, Lagos', lat: 6.6018, lng: 3.3515, city: 'Lagos', state: 'Lagos' },
        { name: 'Asokoro, Abuja', lat: 9.0556, lng: 7.4951, city: 'Abuja', state: 'FCT' },
        { name: 'Wuse, Abuja', lat: 9.0765, lng: 7.3986, city: 'Abuja', state: 'FCT' },
        { name: 'Maitama, Abuja', lat: 9.0935, lng: 7.4869, city: 'Abuja', state: 'FCT' }
      ];

      let closestLocation = knownLocations[0];
      let minDistance = distance(latitude, longitude, knownLocations[0].lat, knownLocations[0].lng);

      for (const location of knownLocations.slice(1)) {
        const dist = distance(latitude, longitude, location.lat, location.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestLocation = location;
        }
      }

      // If within 50km, return the location, otherwise return generic
      if (minDistance <= 50) {
        return {
          address: closestLocation.name,
          city: closestLocation.city,
          state: closestLocation.state
        };
      }

      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: 'Unknown',
        state: 'Unknown'
      };

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        error: 'REVERSE_GEOCODING_ERROR',
        message: 'Failed to reverse geocode coordinates'
      };
    }
  }

  /**
   * Calculate distance between two points
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Validate coordinates are within reasonable bounds
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }
}
