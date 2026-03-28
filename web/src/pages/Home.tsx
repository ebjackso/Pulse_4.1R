import React, { useEffect, useState } from 'react';
import { useLocationStore } from '../stores/locationStore';
import { useSummaryStore } from '../stores/summaryStore';
import { useAuthStore } from '../stores/authStore';
import { Card, LoadingSpinner, Badge } from '../components/Common';
import { Button } from '../components/Button';
import ReportModal from '../components/ReportModal';

const Home: React.FC = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const { currentLocation, radius, requestLocationPermission } = useLocationStore();
  const { currentSummary, isLoading, error, fetchSummary } = useSummaryStore();
  const { isSignedIn, signInAnonymously } = useAuthStore();

  // Initialize auth and location on mount
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) {
        try {
          await signInAnonymously();
        } catch (err) {
          console.error('Failed to sign in:', err);
        }
      }
      await requestLocationPermission();
    };
    init();
  }, [isSignedIn, signInAnonymously, requestLocationPermission]);

  // Fetch summary when location or radius changes
  useEffect(() => {
    if (currentLocation) {
      fetchSummary(currentLocation, radius);
    }
  }, [currentLocation, radius, fetchSummary]);

  const handleRefresh = () => {
    if (currentLocation) {
      fetchSummary(currentLocation, radius);
    }
  };

  if (!currentLocation) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Enable Location
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            We need your location to show what's happening around you. Please enable
            location permission in your browser.
          </p>
          <Button variant="primary" onClick={requestLocationPermission}>
            Enable Location
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Card */}
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📍 Your Location
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Lat: {currentLocation.latitude.toFixed(4)}°
              <br />
              Lng: {currentLocation.longitude.toFixed(4)}°
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Radius: {radius} miles
            </p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Summary Card */}
      {error && (
        <Card>
          <div className="text-red-600 dark:text-red-400">
            <p className="font-semibold">Error loading summary</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Card>
      )}

      {isLoading && !currentSummary ? (
        <LoadingSpinner />
      ) : currentSummary ? (
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                What's Happening Now
              </h3>
              {currentSummary.cached && (
                <Badge label="Cached" color="#9CA3AF" />
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <Badge label={`${currentSummary.reportCount} reports`} color="#0A66C2" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentSummary.text}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              Generated at {currentSummary.generatedAt.toLocaleTimeString()}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No reports in your area yet
          </p>
        </Card>
      )}

      {/* Report Button */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => setShowReportModal(true)}
          className="flex-1"
        >
          + Submit Report
        </Button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
};

export default Home;
