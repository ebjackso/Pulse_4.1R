import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseService';

export interface ReportSubmissionData {
  text: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  photo?: string; // Base64 encoded
}

export interface SubmitReportResponse {
  success: boolean;
  reportId: string;
  message: string;
}

export interface SummaryRequest {
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMiles: number;
}

export interface Summary {
  summary: string;
  reportCount: number;
  cached: boolean;
  generatedAt: string;
}

export const submitReport = httpsCallable<ReportSubmissionData, SubmitReportResponse>(
  functions,
  'submitReport'
);

export const getSummary = httpsCallable<SummaryRequest, Summary>(
  functions,
  'getSummary'
);
