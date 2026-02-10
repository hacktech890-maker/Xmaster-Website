import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiClock } from "react-icons/fi";

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return views.toString();
};

const formatDate = (date) => {
  if (!date) return "Unknown Date";
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return "Unknown Date";
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

const formatDuration = (duration) => {
  if (!duration) return "";
  if (typeof duration === "string" && duration.includes(":")) {
    if (duration === "00:00" || duration === "0:00") return "";
    return duration;
  }
  if (typeof duration === "number" && duration > 0) {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return "";
};

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";

const VideoCard = ({ video, size = "normal" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!video) return null;

  const { _id, title, thumbnail, views, duration, uploadDate, createdAt, category, slug, file_code } = video;

  const realViews = views ?? 0;
  const realDate = uploadDate || createdAt;
  const formattedDuration = formatDuration(duration);

  const sizes = {
    small: { title: "text-sm line-clamp-2", meta: "text-xs" },
    normal: { title: "text-sm sm:text-base line-clamp-2", meta: "text-xs sm:text-sm" },
    large: { title: "text-lg line-clamp-2", meta: "text-sm" },
  };
  const currentSize = sizes[size] || sizes.normal;

  const getThumbnailUrl = () => {
    if (imageError) return PLACEHOLDER;
    if (thumbnail && thumbnail.startsWith("http")) return thumbnail;
    if (thumbnail && thumbnail.length > 3) return `https://abyss.to/splash/${thumbnail}.jpg`;
    if (file_code) return `https://abyss.to/splash/${file_code}.jpg`;
    return PLACEHOLDER;
  };

  return (
    <Link to={`/watch/${_id}${slug ? `/${slug}` : ""}`} className="group block w-full">
      <div className="bg-white dark:bg-dark-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}
          <img
            src={getThumbnailUrl()}
            alt={title || "Video"}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
          />
          {formattedDuration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {formattedDuration}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <h3 className={`font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors ${currentSize.title}`}>
            {title || "Untitled Video"}
          </h3>
          <div className={`mt-1.5 flex items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 ${currentSize.meta}`}>
            <span className="flex items-center gap-1">
              <FiEye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {formatViews(realViews)} views
            </span>
            <span>•</span>
            <span>{formatDate(realDate)}</span>
          </div>
          {category && (
            <div className="mt-1.5">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 rounded-full">
                {typeof category === "string" ? category : category?.name || "General"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;