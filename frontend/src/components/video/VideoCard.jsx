import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiClock } from 'react-icons/fi';

// Format view count (1000 -> 1K, 1000000 -> 1M)
const formatViews = (views) => {
  if (!views) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return views.toString();
};

// Format date to relative time
const formatDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
};

// Format duration
const formatDuration = (duration) => {
  if (!duration) return '0:00';
  if (typeof duration === 'string' && duration.includes(':')) return duration;
  return '0:00';
};

// Default placeholder image (Base64 encoded gray image)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=';

const VideoCard = ({ video, size = 'normal' }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!video) return null;

  const {
  _id,
  title,
  thumbnail,
  views,
  duration,
  uploadDate,
  createdAt,
  category,
  slug,
} = video;

const realViews = views ?? video.viewCount ?? 0;
const realDate = uploadDate || createdAt;
const realDuration = duration ?? video.videoDuration ?? video.length ?? "0:00";


  const sizes = {
    small: { title: 'text-sm line-clamp-2', meta: 'text-xs' },
    normal: { title: 'text-base line-clamp-2', meta: 'text-sm' },
    large: { title: 'text-lg line-clamp-2', meta: 'text-sm' },
  };

  const currentSize = sizes[size] || sizes.normal;

  // Get the best thumbnail URL
  const getThumbnailUrl = () => {
  if (imageError) return PLACEHOLDER_IMAGE;

  if (thumbnail && thumbnail.length > 10) {
    if (thumbnail.startsWith("http")) return thumbnail;
    return `https://${thumbnail}`;
  }

  return PLACEHOLDER_IMAGE;
};


  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link
      to={`/watch/${_id}${slug ? `/${slug}` : ''}`}
      className="group block w-full"
    >
      <div className="bg-white dark:bg-dark-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          <img
            src={getThumbnailUrl()}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImageError}
          />
          
          {/* Duration Badge */}
          {duration && duration !== '00:00' && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium flex items-center gap-1">
              <FiClock className="w-3 h-3" />
{formatDuration(realDuration)}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className={`font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors ${currentSize.title}`}>
            {title || 'Untitled Video'}
          </h3>
          
          <div className={`mt-2 flex items-center gap-3 text-gray-500 dark:text-gray-400 ${currentSize.meta}`}>
            {/* Views */}
            <span className="flex items-center gap-1">
              <FiEye className="w-3.5 h-3.5" />
{formatViews(realViews)} views
            </span>
            
            {/* Date */}
            <span>•</span>
<span>{formatDate(realDate)}</span>
          </div>

          {/* Category */}
          {category && category.name && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 rounded-full">
                {category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;