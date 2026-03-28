import { create } from 'zustand';
import type { Summary as SummaryType, Location } from '../types';
import { getSummary } from '../services/cloudFunctionsService';

interface SummaryStore {
  currentSummary: SummaryType | null;
  isLoading: boolean;
  error: string | null;
  fetchSummary: (location: Location, radiusMiles: number) => Promise<void>;
  clearSummary: () => void;
}

export const useSummaryStore = create<SummaryStore>((set) => ({
  currentSummary: null,
  isLoading: false,
  error: null,

  fetchSummary: async (location: Location, radiusMiles: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getSummary({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radiusMiles,
      });

      set({
        currentSummary: {
          text: result.data.summary,
          reportCount: result.data.reportCount,
          cached: result.data.cached,
          generatedAt: new Date(result.data.generatedAt),
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  clearSummary: () => {
    set({
      currentSummary: null,
      error: null,
    });
  },
}));
