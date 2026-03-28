import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600" />
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md ${className}`}
    style={style}
  >
    {children}
  </div>
);

export const Badge: React.FC<{
  label: string;
  color: string;
  className?: string;
}> = ({ label, color, className = '' }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${className}`}
    style={{ backgroundColor: color }}
  >
    {label}
  </span>
);
