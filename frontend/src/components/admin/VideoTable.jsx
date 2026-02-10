import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiStar, FiEye, FiExternalLink, FiMoreVertical } from 'react-icons/fi';

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxZTFlMWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gVGh1bWI8L3RleHQ+PC9zdmc+";

const VideoTable = ({ videos = [], onDelete, onToggleFeatured, onStatusChange, loading = false }) => {
  const [menuOpen, setMenuOpen] = useState(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-100 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-dark-100 animate-pulse">
            <div className="w-24 h-14 bg-gray-200 dark:bg-dark-100 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-dark-100 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-dark-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-100 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No videos found</p>
      </div>
    );
  }

  const getThumbnail = (video) => {
    const thumb = video.thumbnail;
    if (thumb && thumb.startsWith("http")) return thumb;
    if (thumb && thumb.length > 3) return `https://abyss.to/splash/${thumb}.jpg`;
    if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
    return PLACEHOLDER;
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K";
    return views.toString();
  };

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-100 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-100 border-b border-gray-200 dark:border-dark-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Video</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Views</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video._id} className="border-b border-gray-100 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors">
                {/* Video Info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getThumbnail(video)}
                      alt={video.title}
                      className="w-24 h-14 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.src = PLACEHOLDER; }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{video.file_code}</p>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <select
                    value={video.status || 'public'}
                    onChange={(e) => onStatusChange && onStatusChange(video._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${
                      video.status === 'public'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : video.status === 'private'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </td>

                {/* Views */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <FiEye className="w-3.5 h-3.5" />
                    {formatViews(video.views)}
                  </span>
                </td>

                {/* Duration */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {video.duration || '00:00'}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : 'N/A'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onToggleFeatured && onToggleFeatured(video._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        video.featured
                          ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100'
                      }`}
                      title={video.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <FiStar className="w-4 h-4" />
                    </button>

                    <a
                      href={`/watch/${video._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-colors"
                      title="View video"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onDelete && onDelete(video._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-colors"
                      title="Delete video"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-dark-100">
        {videos.map((video) => (
          <div key={video._id} className="p-4">
            <div className="flex gap-3">
              <img
                src={getThumbnail(video)}
                alt={video.title}
                className="w-28 h-16 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {video.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatViews(video.views)} views</span>
                  <span>{video.duration || '00:00'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                video.status === 'public'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {video.status}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFeatured && onToggleFeatured(video._id)}
                  className={`p-2 rounded-lg ${video.featured ? 'text-yellow-500' : 'text-gray-400'}`}
                >
                  <FiStar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(video._id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoTable;