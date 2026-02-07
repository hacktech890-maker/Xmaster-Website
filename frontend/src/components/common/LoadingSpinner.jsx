import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false, text = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const Spinner = () => (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-dark-100"></div>
        <div className="absolute inset-0 rounded-full border-2 border-primary-600 border-t-transparent animate-spin"></div>
      </div>
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-dark-400 flex items-center justify-center z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Spinner />
    </div>
  );
};

export default LoadingSpinner;