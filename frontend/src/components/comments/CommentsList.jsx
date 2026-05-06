// src/components/comments/CommentsList.jsx
// Modern public comments list

import React from 'react';
import { FiMessageSquare, FiUser, FiClock } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

// ============================================================
// COMMENTS LIST
// ============================================================

const CommentsList = ({
  comments  = [],
  loading   = false,
  className = '',
}) => {

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className={`
        py-10 text-center
        rounded-xl bg-white/[0.02] border border-white/5
        ${className}
      `}>
        <FiMessageSquare className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/30 font-medium">
          No comments yet
        </p>
        <p className="text-xs text-white/20 mt-1">
          Be the first to comment!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {comments.map((comment) => (
        <CommentItem key={comment._id} comment={comment} />
      ))}
    </div>
  );
};

// ============================================================
// COMMENT ITEM
// ============================================================

const CommentItem = ({ comment }) => {
  const initial = (comment.name || 'A').charAt(0).toUpperCase();

  // Color based on first char
  const colors = [
    'bg-primary-600/30 text-primary-400',
    'bg-blue-500/30 text-blue-400',
    'bg-purple-500/30 text-purple-400',
    'bg-emerald-500/30 text-emerald-400',
    'bg-amber-500/30 text-amber-400',
  ];
  const colorClass = colors[initial.charCodeAt(0) % colors.length];

  return (
    <div className="
      flex gap-3 p-3.5 rounded-xl
      bg-white/[0.025] border border-white/6
      hover:bg-white/[0.04] hover:border-white/10
      transition-all duration-200
      animate-fade-in
    ">
      {/* Avatar */}
      <div className={`
        flex-shrink-0
        w-8 h-8 rounded-full
        flex items-center justify-center
        text-xs font-bold
        ${colorClass}
      `}>
        {initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white/80">
            {comment.name}
          </span>
          {comment.createdAt && (
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <FiClock className="w-2.5 h-2.5" />
              {formatDate(comment.createdAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-white/60 leading-relaxed break-words">
          {comment.message}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// SKELETON
// ============================================================

const CommentSkeleton = () => (
  <div className="flex gap-3 p-3.5 animate-pulse">
    <div className="w-8 h-8 rounded-full flex-shrink-0 skeleton-shimmer bg-dark-200" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <div className="h-3 w-20 rounded skeleton-shimmer bg-dark-200" />
        <div className="h-3 w-16 rounded skeleton-shimmer bg-dark-300" />
      </div>
      <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-full" />
      <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-4/5" />
    </div>
  </div>
);

export default CommentsList;