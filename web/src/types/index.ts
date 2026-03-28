export interface Location {
  latitude: number;
  longitude: number;
}

export interface Report {
  id: string;
  userId: string;
  text: string;
  category: string;
  location: Location;
  photoUrl?: string;
  timestamp: Date;
  status: string;
}

export interface Summary {
  text: string;
  reportCount: number;
  cached: boolean;
  generatedAt: Date;
}

export const REPORT_CATEGORIES = [
  'Traffic',
  'Safety',
  'Event',
  'Weather',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  Traffic: '#F59E0B',
  Safety: '#EF4444',
  Event: '#3B82F6',
  Weather: '#6B7280',
  Other: '#8B5CF6',
};
