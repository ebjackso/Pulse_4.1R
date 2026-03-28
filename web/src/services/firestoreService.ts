import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebaseService';
import type { Location } from '../types';

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

export const getMyReports = async (userId: string): Promise<Report[]> => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        userId: data.userId,
        text: data.text,
        category: data.category,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        photoUrl: data.photoUrl,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status,
      });
    });

    return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};
