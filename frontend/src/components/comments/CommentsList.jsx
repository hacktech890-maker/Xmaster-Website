import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiUser, FiClock, FiTag } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const categoryStyles = {
  suggestion: { label: '💡 Suggestion', bg: 'bg-blue-500/10 text-blue-500' },
  feedback: { label: '💬 Feedback', bg: 'bg-green-500/10 text-green-500' },
  bug: { label: '🐛 Bug Report', bg: 'bg-red-500/10 text-red-500' },
  feature: { label: '✨ Feature', bg: 'bg-purple-500/10 text-purple-500' },
  complaint: { label: '⚠️ Complaint', bg: 'bg-yellow-500/10 text-yellow-500' },
  other: { label: '📝 Other', bg: 'bg-gray-500/10 text-gray-500' },
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return past.toLocaleDateString();
};

const CommentsList = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  useEffect(() => {
    fetchComments();
  }, [page]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await publicAPI.getPublicComments(page, 10);
      if (response.data?.success) {
        setComments(response.data.comments || []);
        setPagination(response.data.pagination || { pages: 1 });
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) return <LoadingSpinner size="sm" />;

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-2xl border border-gray-200 dark:border-dark-100 p-8 text-center">
        <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 className="text-gray-900 dark:text-white font-medium mb-1">No Comments Yet</h4>
        <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FiMessageSquare className="w-5 h-5 text-primary-500" />
        Community Feedback
        <span className="text-sm font-normal text-gray-500">({pagination.total || comments.length})</span>
      </h3>

      {/* Comments */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const catStyle = categoryStyles[comment.category] || categoryStyles.other;

          return (
            <div
              key={comment._id}
              className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-100 p-4 sm:p-5 transition-all hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-500 font-bold text-sm">
                      {comment.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <FiUser className="w-3.5 h-3.5 text-gray-400" />
                      {comment.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatTimeAgo(comment.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Category Badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catStyle.bg}`}>
                  {catStyle.label}
                </span>
              </div>

              {/* Subject */}
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {comment.reason}
                </p>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap pl-5">
                {comment.message}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-dark-200 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-dark-200 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentsList;