import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return views.toString();
};

const formatDate = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return "";
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return new Date(date).toLocaleDateString();
};

const formatDuration = (duration) => {
  if (!duration) return "";
  if (typeof duration === "string" && duration.includes(":")) {
    if (duration === "00:00") return "";
    return duration;
  }
  return "";
};

const RelatedVideos = ({ videoId, limit = 12 }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!videoId) return;
      setLoading(true);
      try {
        const response = await publicAPI.getRelatedVideos(videoId, limit);
        if (response.data?.success) {
          setVideos(response.data.videos || []);
        }
      } catch (error) {
        // Fallback to latest videos
        try {
          const latest = await publicAPI.getLatestVideos(limit);
          if (latest.data?.success) {
            setVideos((latest.data.videos || []).filter(v => v._id !== videoId));
          }
        } catch (e) {
          console.error('Failed to fetch related videos:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [videoId, limit]);

  if (loading) return <LoadingSpinner size="sm" />;

  if (videos.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No related videos found</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">
        Related Videos
      </h3>
      <div className="space-y-3">
        {videos.filter(v => v._id !== videoId).slice(0, 15).map((video) => (
          <RelatedVideoItem key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};

const RelatedVideoItem = ({ video }) => {
  const [imgError, setImgError] = useState(false);

  const getThumbnail = () => {
    if (imgError) return PLACEHOLDER;
    const thumb = video.thumbnail;
    if (thumb && thumb.startsWith("http")) return thumb;
    if (thumb && thumb.length > 3) return `https://abyss.to/splash/${thumb}.jpg`;
    if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
    return PLACEHOLDER;
  };

  return (
    <Link
      to={`/watch/${video._id}${video.slug ? `/${video.slug}` : ''}`}
      className="flex gap-3 group rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 p-1.5 transition-colors"
    >
      <div className="relative w-[160px] min-w-[160px] sm:w-[180px] sm:min-w-[180px]">
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-100">
          <img
            src={getThumbnail()}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
        {video.duration && video.duration !== "00:00" && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-500 line-clamp-2 leading-snug transition-colors">
          {video.title}
        </h4>
        <div className="mt-1.5 space-y-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <FiEye className="w-3 h-3" />
            {formatViews(video.views || 0)} views
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(video.uploadDate || video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default RelatedVideos;