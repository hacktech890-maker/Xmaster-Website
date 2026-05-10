// src/pages/admin/ContactManager.jsx
// Admin page — view and manage contact form submissions (Task 9)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMail, FiTrash2, FiRefreshCw,
  FiCheck, FiCircle, FiChevronDown, FiChevronUp,
  FiUser, FiCalendar,
} from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PER_PAGE = 25;

const ContactManager = () => {
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [expanded,     setExpanded]     = useState(null); // expanded submission _id

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchSubmissions = useCallback(async (pg = 1, unreadOnly = filterUnread) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await adminAPI.getContactSubmissions({ page: pg, limit: PER_PAGE, unreadOnly });
      const data = res?.data;
      if (!mountedRef.current) return;
      setSubmissions(data?.submissions || []);
      setTotalPages(data?.totalPages   || 1);
      setTotalCount(data?.total        || 0);
      setUnreadCount(data?.unreadCount || 0);
      setPage(pg);
    } catch (err) {
      if (mountedRef.current) setError('Failed to load submissions.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filterUnread]);

  useEffect(() => { fetchSubmissions(1, filterUnread); }, [filterUnread]);

  const handleMarkRead = async (id) => {
    try {
      await adminAPI.markContactRead(id);
      setSubmissions((prev) =>
        prev.map((s) => s._id === id ? { ...s, read: true } : s)
      );
      setUnreadCount((p) => Math.max(0, p - 1));
    } catch { toast.error('Failed to mark as read.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try {
      await adminAPI.deleteContactSubmission(id);
      toast.success('Submission deleted.');
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      setTotalCount((p) => Math.max(0, p - 1));
    } catch { toast.error('Failed to delete submission.'); }
  };

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    // Auto-mark as read when opened
    const sub = submissions.find((s) => s._id === id);
    if (sub && !sub.read) await handleMarkRead(id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-600/20 flex items-center justify-center">
            <FiMail className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Contact Submissions</h1>
            <p className="text-xs text-white/40">{totalCount} total · {unreadCount} unread</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${filterUnread ? 'bg-primary-600/15 text-primary-400 border-primary-600/30' : 'bg-white/[0.05] text-white/50 border-white/[0.08] hover:bg-white/[0.1]'}`}
          >
            <FiCircle className="w-3 h-3" />
            {filterUnread ? 'Showing Unread' : 'Show Unread Only'}
          </button>
          <button
            onClick={() => fetchSubmissions(page, filterUnread)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.05] text-white/50 border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-200 disabled:opacity-40"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Submissions list */}
      {loading && submissions.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <FiMail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{filterUnread ? 'No unread submissions.' : 'No submissions yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub._id}
              sub={sub}
              expanded={expanded === sub._id}
              onToggle={() => toggleExpand(sub._id)}
              onMarkRead={() => handleMarkRead(sub._id)}
              onDelete={() => handleDelete(sub._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => fetchSubmissions(pg, filterUnread)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${pg === page ? 'bg-primary-600 text-white' : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.1]'}`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Submission Card ───────────────────────────────────────────
const SubmissionCard = ({ sub, expanded, onToggle, onMarkRead, onDelete }) => {
  const date = sub.createdAt
    ? new Date(sub.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${sub.read ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-primary-600/[0.04] border-primary-600/20'}`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Unread dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.read ? 'bg-white/10' : 'bg-primary-500'}`} />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-white truncate">
            <FiUser className="w-3 h-3 text-white/30 flex-shrink-0" />
            {sub.name}
          </div>
          <div className="text-xs text-white/40 truncate">{sub.email}</div>
          <div className="flex items-center gap-1 text-[11px] text-white/25">
            <FiCalendar className="w-3 h-3" />{date}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!sub.read && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
              title="Mark as read"
              className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          {expanded
            ? <FiChevronUp className="w-4 h-4 text-white/20" />
            : <FiChevronDown className="w-4 h-4 text-white/20" />
          }
        </div>
      </div>

      {/* Expanded message */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] animate-fade-in-down">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">From</span>
            <a href={`mailto:${sub.email}`} className="text-xs text-primary-400 hover:underline">{sub.email}</a>
          </div>
          {sub.message ? (
            <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{sub.message}</p>
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">No message body.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactManager;
