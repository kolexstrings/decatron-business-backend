export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  confidence?: number;
  addressComponents?: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface GeocodingError {
  error: string;
  message: string;
  code?: string;
}

/**
 * Enhanced geocoding service for production use
 * In production, integrate with Google Maps Geocoding API, Mapbox, or OpenStreetMap
 */
export class GeocodingService {
  private static readonly DEFAULT_COORDINATES = { lat: 9.0765, lng: 8.6753 }; // Abuja, Nigeria

  /**
   * Geocode an address to latitude/longitude coordinates
   * Enhanced version with better error handling and caching
   */
  static async geocodeAddress(address: string, city: string, state: string): Promise<GeocodingResult | GeocodingError> {
    try {
      // Clean and format the address
      const fullAddress = `${address}, ${city}, ${state}, Nigeria`.trim();

      // In production, this should call a real geocoding service
      // For now, using enhanced Nigerian location mapping
      const result = await this.getNigerianCoordinates(fullAddress);

      if (result) {
        return {
          latitude: result.lat,
          longitude: result.lng,
          confidence: result.confidence || 0.8,
          formattedAddress: fullAddress,
          addressComponents: {
            streetName: address,
            city: city,
            state: state,
            country: 'Nigeria'
          }
        };
      }

      // Fallback to default coordinates
      return {
        latitude: this.DEFAULT_COORDINATES.lat,
        longitude: this.DEFAULT_COORDINATES.lng,
        confidence: 0.3,
        formattedAddress: fullAddress,
        addressComponents: {
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria'
        }
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        error: 'GEOCODING_ERROR',
        message: 'Failed to geocode address',
        code: 'SERVICE_UNAVAILABLE'
      };
    }
  }

  /**
   * Enhanced Nigerian location mapping with more cities and areas
   */
  private static async getNigerianCoordinates(address: string): Promise<{ lat: number; lng: number; confidence: number } | null> {
    const searchAddress = address.toLowerCase();

    // Enhanced location database with more Nigerian cities
    const locationMap: Record<string, { lat: number; lng: number; confidence: number }> = {
      // Lagos State
      'victoria island': { lat: 6.4474, lng: 3.3903, confidence: 0.9 },
      'vi': { lat: 6.4474, lng: 3.3903, confidence: 0.85 },
      'ikeja': { lat: 6.6018, lng: 3.3515, confidence: 0.9 },
      'lekki': { lat: 6.4698, lng: 3.5852, confidence: 0.9 },
      'surulere': { lat: 6.4975, lng: 3.3579, confidence: 0.9 },
      'yaba': { lat: 6.5075, lng: 3.3792, confidence: 0.9 },
      'lagos island': { lat: 6.4541, lng: 3.3947, confidence: 0.9 },
      'maryland': { lat: 6.5736, lng: 3.3679, confidence: 0.9 },
      'ogba': { lat: 6.6342, lng: 3.3390, confidence: 0.9 },

      // Abuja FCT
      'asokoro': { lat: 9.0556, lng: 7.4951, confidence: 0.9 },
      'wuse': { lat: 9.0765, lng: 7.3986, confidence: 0.9 },
      'maitama': { lat: 9.0935, lng: 7.4869, confidence: 0.9 },
      'garki': { lat: 9.0277, lng: 7.4898, confidence: 0.9 },
      'gwarinpa': { lat: 9.1181, lng: 7.3986, confidence: 0.9 },
      'utako': { lat: 9.0670, lng: 7.4677, confidence: 0.9 },
      'jabi': { lat: 9.0765, lng: 7.4186, confidence: 0.9 },
      'life camp': { lat: 9.0417, lng: 7.3986, confidence: 0.9 },

      // Kano State
      'kano': { lat: 12.0022, lng: 8.5920, confidence: 0.8 },
      'sabon gari': { lat: 11.9964, lng: 8.5671, confidence: 0.8 },

      // Rivers State (Port Harcourt)
      'port harcourt': { lat: 4.8156, lng: 7.0498, confidence: 0.8 },
      'gra': { lat: 4.8242, lng: 7.0004, confidence: 0.8 },
      'rumuokwuta': { lat: 4.8607, lng: 7.0405, confidence: 0.8 },

      // Oyo State (Ibadan)
      'ibadan': { lat: 7.3775, lng: 3.9470, confidence: 0.8 },
      'dugbe': { lat: 7.3847, lng: 3.8722, confidence: 0.8 },

      // Enugu State
      'enugu': { lat: 6.4474, lng: 7.4946, confidence: 0.8 },

      // Delta State (Warri/Asaba)
      'warri': { lat: 5.5544, lng: 5.7932, confidence: 0.8 },
      'asaba': { lat: 6.2059, lng: 6.6959, confidence: 0.8 },

      // Kaduna State
      'kaduna': { lat: 10.5105, lng: 7.4165, confidence: 0.8 },

      // Ogun State (Abeokuta)
      'abeokuta': { lat: 7.1608, lng: 3.3483, confidence: 0.8 },

      // Imo State (Owerri)
      'owerri': { lat: 5.4855, lng: 7.0353, confidence: 0.8 }
    };

    // Check for exact matches first
    for (const [key, coords] of Object.entries(locationMap)) {
      if (searchAddress.includes(key)) {
        return coords;
      }
    }

    // Check for partial matches (city names)
    const cityMatches = Object.entries(locationMap).filter(([key]) =>
      searchAddress.includes(key) && key.length > 3
    );

    if (cityMatches.length > 0) {
      // Return the highest confidence match
      return cityMatches.reduce((best, current) =>
        current[1].confidence > best[1].confidence ? current : best
      )[1];
    }

    return null;
  }

  /**
   * Geocode organization address to coordinates
   * This is specifically for organization office locations
   */
  static async geocodeOrganizationAddress(street: string, city: string, state: string, zip?: string): Promise<GeocodingResult | GeocodingError> {
    try {
      // Similar to address geocoding but with organization-specific logic
      return await this.geocodeAddress(street, city, state);
    } catch (error) {
      console.error('Organization geocoding error:', error);
      return {
        error: 'ORGANIZATION_GEOCODING_ERROR',
        message: 'Failed to geocode organization address'
      };
    }
  }

  /**
   * Batch geocode multiple addresses
   * Useful for bulk property geocoding
   */
  static async batchGeocode(addresses: Array<{ address: string; city: string; state: string }>): Promise<(GeocodingResult | GeocodingError)[]> {
    const results: (GeocodingResult | GeocodingError)[] = [];

    for (const addr of addresses) {
      const result = await this.geocodeAddress(addr.address, addr.city, addr.state);
      results.push(result);

      // Add delay to avoid rate limiting (if using external APIs)
      if (addresses.length > 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Enhanced reverse geocoding with better address formatting
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<{ address: string; city: string; state: string; formattedAddress: string } | GeocodingError> {
    try {
      // Validate coordinates
      if (!this.validateCoordinates(latitude, longitude)) {
        return {
          error: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude values'
        };
      }

      // Find closest known location
      const closest = this.findClosestLocation(latitude, longitude);

      return {
        address: closest.name,
        city: closest.city,
        state: closest.state,
        formattedAddress: `${closest.name}, ${closest.city}, ${closest.state}, Nigeria`
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
   * Find closest known location to given coordinates
   */
  private static findClosestLocation(lat: number, lng: number): { name: string; city: string; state: string; distance: number } {
    const knownLocations = [
      { name: 'Victoria Island', city: 'Lagos', state: 'Lagos', lat: 6.4474, lng: 3.3903 },
      { name: 'Ikeja', city: 'Lagos', state: 'Lagos', lat: 6.6018, lng: 3.3515 },
      { name: 'Lekki', city: 'Lagos', state: 'Lagos', lat: 6.4698, lng: 3.5852 },
      { name: 'Asokoro', city: 'Abuja', state: 'FCT', lat: 9.0556, lng: 7.4951 },
      { name: 'Wuse', city: 'Abuja', state: 'FCT', lat: 9.0765, lng: 7.3986 },
      { name: 'Maitama', city: 'Abuja', state: 'FCT', lat: 9.0935, lng: 7.4869 },
      { name: 'Port Harcourt', city: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
      { name: 'Kano', city: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.5920 },
      { name: 'Ibadan', city: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.9470 },
      { name: 'Enugu', city: 'Enugu', state: 'Enugu', lat: 6.4474, lng: 7.4946 }
    ];

    let closest = knownLocations[0];
    let minDistance = this.calculateDistance(lat, lng, knownLocations[0].lat, knownLocations[0].lng);

    for (const location of knownLocations.slice(1)) {
      const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = location;
      }
    }

    return { ...closest, distance: minDistance };
  }

  /**
   * Calculate distance between two points using Haversine formula
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

  /**
   * Check if coordinates are in Nigeria (for validation)
   */
  static isInNigeria(latitude: number, longitude: number): boolean {
    // Nigeria bounding box (approximate)
    return latitude >= 4.0 && latitude <= 14.0 && longitude >= 3.0 && longitude <= 15.0;
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
