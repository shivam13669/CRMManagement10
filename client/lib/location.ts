const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export interface LocationData {
  latitude: number;
  longitude: number;
  coordinates: string;
  address?: string;
}

export interface PermissionStatus {
  allowed: boolean;
  timestamp: number;
}

// Get location permission status from localStorage
export const getLocationPermissionStatus = (): PermissionStatus | null => {
  try {
    const status = localStorage.getItem("locationPermission");
    if (status) {
      return JSON.parse(status);
    }
  } catch (error) {
    console.error("Error reading location permission status:", error);
  }
  return null;
};

// Save location permission status
export const saveLocationPermissionStatus = (allowed: boolean) => {
  const status: PermissionStatus = {
    allowed,
    timestamp: Date.now(),
  };
  localStorage.setItem("locationPermission", JSON.stringify(status));
};

// Clear location permission (to allow re-asking)
export const clearLocationPermissionStatus = () => {
  localStorage.removeItem("locationPermission");
};

// Get stored location
export const getStoredLocation = (): LocationData | null => {
  try {
    const location = localStorage.getItem("userLocation");
    if (location) {
      return JSON.parse(location);
    }
  } catch (error) {
    console.error("Error reading stored location:", error);
  }
  return null;
};

// Save location to localStorage
export const saveLocation = (location: LocationData) => {
  localStorage.setItem("userLocation", JSON.stringify(location));
};

// Get address from coordinates using Google Geocoding API
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    }
  } catch (error) {
    console.error("Error fetching address:", error);
  }
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

// Request current location from browser
export const requestCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        const address = await getAddressFromCoordinates(latitude, longitude);

        const locationData: LocationData = {
          latitude,
          longitude,
          coordinates,
          address,
        };

        saveLocation(locationData);
        saveLocationPermissionStatus(true);
        resolve(locationData);
      },
      (error) => {
        saveLocationPermissionStatus(false);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

// Get location with permission request on first load
export const getLocationWithPermission =
  async (): Promise<LocationData | null> => {
    // Check if location already stored
    const storedLocation = getStoredLocation();
    if (storedLocation) {
      return storedLocation;
    }

    // Request location from browser
    try {
      return await requestCurrentLocation();
    } catch (error) {
      console.error("Error requesting location:", error);
      return null;
    }
  };
