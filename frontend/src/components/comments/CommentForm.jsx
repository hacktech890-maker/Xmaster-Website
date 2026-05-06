// src/components/comments/CommentForm.jsx
// Modern comment submission form
// Preserves: honeypot anti-spam, existing publicAPI.submitComment()

import React, { useState, useRef } from 'react';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';

const CommentForm = ({
  videoId,
  onCommentAdded = null,
  className      = '',
}) => {
  const [name,      setName]      = useState('');
  const [message,   setMessage]   = useState('');
  const [submitting,setSubmitting] = useState(false);
  const [submitted, setSubmitted]  = useState(false);

  // Honeypot — should stay empty (bots fill this)
  const honeypotRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Spam check: honeypot filled
    if (honeypotRef.current?.value) return;

    // Basic validation
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Please enter your name (min 2 characters)');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      toast.error('Comment must be at least 5 characters');
      return;
    }
    if (message.trim().length > 500) {
      toast.error('Comment must be under 500 characters');
      return;
    }

    setSubmitting(true);
    try {
      await publicAPI.submitComment({
        videoId,
        name:    name.trim(),
        message: message.trim(),
      });

      setSubmitted(true);
      setName('');
      setMessage('');
      toast.success('Comment submitted! It will appear after review.');
      onCommentAdded?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`
        rounded-xl p-5
        bg-emerald-500/8 border border-emerald-500/20
        text-center
        ${className}
      `}>
        <div className="
          w-10 h-10 rounded-full
          bg-emerald-500/20
          flex items-center justify-center
          mx-auto mb-3
        ">
          <FiSend className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-emerald-400 mb-1">
          Comment Submitted!
        </p>
        <p className="text-xs text-white/40">
          Your comment is pending review and will appear shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors underline"
        >
          Write another comment
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`
        rounded-xl p-4 sm:p-5
        bg-white/[0.03] border border-white/8
        space-y-3
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <FiMessageSquare className="w-4 h-4 text-primary-500" />
        <h3 className="text-sm font-semibold text-white/80">
          Leave a Comment
        </h3>
      </div>

      {/* Honeypot (hidden from real users) */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name input */}
      <div className="relative">
        <FiUser className="
          absolute left-3 top-1/2 -translate-y-1/2
          w-3.5 h-3.5 text-white/25
          pointer-events-none
        " />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          required
          className="
            input-base pl-9
          "
        />
      </div>

      {/* Message textarea */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your comment..."
          rows={3}
          maxLength={500}
          required
          className="
            input-base resize-none
            min-h-[80px]
          "
        />
        {/* Char count */}
        <span className={`
          absolute bottom-2 right-3
          text-[10px] tabular-nums
          ${message.length > 450 ? 'text-amber-400' : 'text-white/20'}
        `}>
          {message.length}/500
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !name.trim() || !message.trim()}
        className="
          btn-primary w-full sm:w-auto
          disabled:opacity-40 disabled:pointer-events-none
        "
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
            Submitting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FiSend className="w-3.5 h-3.5" />
            Post Comment
          </span>
        )}
      </button>
    </form>
  );
};

export default CommentForm;