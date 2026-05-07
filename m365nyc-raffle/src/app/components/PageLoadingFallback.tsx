import React from 'react';

const PageLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Loading"
    className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
  >
    <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-300">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  </div>
);

export default PageLoadingFallback;
