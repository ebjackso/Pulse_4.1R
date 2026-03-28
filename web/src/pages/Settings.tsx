import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Common';
import { Button } from '../components/Button';
import { useAuthStore } from '../stores/authStore';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [defaultRadius, setDefaultRadius] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  // Load theme preference on mount
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    updateTheme(isDark);

    // Load default radius
    const saved = localStorage.getItem('defaultRadius');
    if (saved) {
      setDefaultRadius(parseFloat(saved));
    }
  }, []);

  const updateTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    updateTheme(newDarkMode);
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDefaultRadius(value);
    localStorage.setItem('defaultRadius', String(value));
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        setIsLoading(true);
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('Sign out failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Theme Settings */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Display Settings
        </h3>
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Dark Mode</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use dark theme for the interface
              </p>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                darkMode ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Location Settings */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Location Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Radius: {defaultRadius} miles
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={defaultRadius}
              onChange={handleRadiusChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Adjust the default radius for area summaries
            </p>
          </div>
        </div>
      </Card>

      {/* About Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Pulse</strong> - Real-time local event intelligence
          </p>
          <p>
            Track what's happening in your area in real-time. Submit reports, get AI-powered
            summaries, and stay connected with your community.
          </p>
          <p className="text-xs">Version 1.0.0</p>
        </div>
      </Card>

      {/* Privacy & Terms */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Your location is used only to generate summaries of nearby reports. We do not store
            your personal information beyond your submission.
          </p>
          <p>
            All reports are publicly visible and automatically deleted after 24 hours. You can
            delete your own reports at any time.
          </p>
        </div>
      </Card>

      {/* Sign Out */}
      <Card>
        <Button
          variant="danger"
          onClick={handleSignOut}
          isLoading={isLoading}
          className="w-full"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
