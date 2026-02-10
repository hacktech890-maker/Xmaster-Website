import React from 'react';
import VideoCard from './VideoCard';
import LoadingSpinner from '../common/LoadingSpinner';

const VideoGrid = ({ videos = [], loading = false, error = null, emptyMessage = 'No videos found', columns = 4 }) => {
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎬</div>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-3 sm:gap-4 md:gap-6`}>
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
};

export const VideoGridSkeleton = ({ count = 8, columns = 4 }) => {
  const gridCols = {
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-3 sm:gap-4 md:gap-6`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-200 rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200 dark:bg-dark-100"></div>
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-dark-100 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-dark-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;