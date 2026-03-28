import React, { useState } from 'react';
import { Button } from './Button';
import { REPORT_CATEGORIES } from '../types';
import { submitReport } from '../services/cloudFunctionsService';
import { useLocationStore } from '../stores/locationStore';
import { useAuthStore } from '../stores/authStore';
import { useSummaryStore } from '../stores/summaryStore';

interface ReportModalProps {
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>('Other');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { currentLocation } = useLocationStore();
  const { userId } = useAuthStore();
  const { fetchSummary, currentSummary } = useSummaryStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !userId) {
      setError('Location or authentication not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitReport({
        text,
        category,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      });

      if (result.data.success) {
        setSuccess(true);
        setText('');
        setCategory('Other');

        // Refresh summary after 2 seconds
        setTimeout(() => {
          if (currentSummary) {
            fetchSummary(currentLocation, currentSummary.reportCount > 0 ? 2 : 2);
          }
        }, 2000);

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg w-full md:w-96 max-h-[90vh] md:max-h-96 overflow-y-auto p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Submit Report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-600 dark:text-green-400 font-semibold">
              Report submitted successfully!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              It will appear in summaries within 60 seconds.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What's happening? ({text.length}/280)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 280))}
                maxLength={280}
                placeholder="Describe the local event or situation..."
                className="input-field resize-none h-24"
                required
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {currentLocation?.latitude.toFixed(4)}°, {currentLocation?.longitude.toFixed(4)}°
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={!text.trim()}
              >
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
