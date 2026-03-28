import React, { useEffect, useState } from 'react';
import { Card, LoadingSpinner, Badge } from '../components/Common';
import { useAuthStore } from '../stores/authStore';
import { getMyReports } from '../services/firestoreService';
import type { Report } from '../types';
import { CATEGORY_COLORS } from '../types';

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userId } = useAuthStore();

  useEffect(() => {
    const fetchReports = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getMyReports(userId);
        setReports(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [userId]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <div className="text-red-600 dark:text-red-400">
          <p className="font-semibold">Error loading reports</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-6xl mb-4">📝</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No reports yet
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Your submitted reports will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Reports ({reports.length})
        </h2>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    label={report.category}
                    color={
                      CATEGORY_COLORS[report.category as keyof typeof CATEGORY_COLORS] ||
                      '#8B5CF6'
                    }
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(report.timestamp)}
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100 mb-2">{report.text}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>
                    📍 {report.location.latitude.toFixed(4)}°,{' '}
                    {report.location.longitude.toFixed(4)}°
                  </p>
                  <p>Status: {report.status}</p>
                </div>
              </div>
              {report.photoUrl && (
                <img
                  src={report.photoUrl}
                  alt="Report"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyReports;
