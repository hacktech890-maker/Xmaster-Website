import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import { formatViews, formatDate, formatDuration } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const RelatedVideos = ({ videoId, limit = 10 }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!videoId) return;
      
      setLoading(true);
      try {
        const response = await publicAPI.getRelatedVideos(videoId, limit);
        if (response.data.success) {
          setVideos(response.data.videos);
        }
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [videoId, limit]);

  if (loading) {
    return <LoadingSpinner size="sm" />;
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No related videos found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
        Related Videos
      </h3>
      
      {videos.map((video) => (
        <Link
          key={video._id}
          to={`/watch/${video._id}${video.slug ? `/${video.slug}` : ''}`}
          className="flex gap-3 group"
        >
          {/* Thumbnail */}
          <div className="relative w-40 flex-shrink-0">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-100">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/160x90?text=Video';
                }}
              />
            </div>
            {video.duration && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-500 line-clamp-2 transition-colors">
              {video.title}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FiEye className="w-3 h-3" />
                {formatViews(video.views)}
              </span>
              <span>•</span>
              <span>{formatDate(video.uploadDate)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedVideos;