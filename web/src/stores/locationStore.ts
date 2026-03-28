import { create } from 'zustand';
import type { Location } from '../types';

interface LocationStore {
  currentLocation: Location | null;
  selectedLocation: Location | null;
  radius: number;
  isLoading: boolean;
  error: string | null;
  updateCurrentLocation: (location: Location) => void;
  setSelectedLocation: (location: Location) => void;
  setRadius: (radiusMiles: number) => void;
  requestLocationPermission: () => Promise<void>;
}

export const useLocationStore = create<LocationStore>((set) => ({
  currentLocation: null,
  selectedLocation: null,
  radius: 2, // Default 2 miles
  isLoading: false,
  error: null,

  updateCurrentLocation: (location: Location) => {
    set({
      currentLocation: location,
      selectedLocation: location,
      error: null,
    });
  },

  setSelectedLocation: (location: Location) => {
    set({ selectedLocation: location, error: null });
  },

  setRadius: (radiusMiles: number) => {
    if (radiusMiles >= 0.5 && radiusMiles <= 10) {
      set({ radius: radiusMiles });
    }
  },

  requestLocationPermission: async () => {
    set({ isLoading: true, error: null });
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            selectedLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            isLoading: false,
            error: null,
          });
        },
        (error) => {
          set({
            error: error.message,
            isLoading: false,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },
}));
