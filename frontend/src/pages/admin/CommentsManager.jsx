import React, { useState, useEffect } from 'react';
import {
  FiMessageSquare, FiEye, FiEyeOff, FiTrash2, FiMail,
  FiUser, FiClock, FiTag, FiFilter, FiCheck, FiX,
  FiEdit3, FiChevronDown, FiChevronUp, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const categoryStyles = {
  suggestion: { label: '💡 Suggestion', bg: 'bg-blue-500/10 text-blue-500' },
  feedback: { label: '💬 Feedback', bg: 'bg-green-500/10 text-green-500' },
  bug: { label: '🐛 Bug Report', bg: 'bg-red-500/10 text-red-500' },
  feature: { label: '✨ Feature', bg: 'bg-purple-500/10 text-purple-500' },
  complaint: { label: '⚠️ Complaint', bg: 'bg-yellow-500/10 text-yellow-500' },
  other: { label: '📝 Other', bg: 'bg-gray-500/10 text-gray-500' },
};

const CommentsManager = () => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, visible: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [filter, page]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getComments({ page, limit: 30, filter });
      if (response.data?.success) {
        setComments(response.data.comments || []);
        setStats(response.data.stats || {});
        setPagination(response.data.pagination || { pages: 1 });
      }
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      const response = await adminAPI.toggleCommentVisibility(id);
      if (response.data?.success) {
        setComments(comments.map((c) =>
          c._id === id ? { ...c, isVisible: response.data.isVisible, isRead: true } : c
        ));
        setStats({
          ...stats,
          visible: response.data.isVisible ? stats.visible + 1 : stats.visible - 1,
          hidden: response.data.isVisible ? stats.hidden - 1 : stats.hidden + 1,
        });
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle visibility');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await adminAPI.deleteComment(id);
      setComments(comments.filter((c) => c._id !== id));
      toast.success('Comment deleted');
      setStats({ ...stats, total: stats.total - 1 });
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} comments?`)) return;
    try {
      await adminAPI.bulkDeleteComments(selectedIds);
      setComments(comments.filter((c) => !selectedIds.includes(c._id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} comments deleted`);
      fetchComments();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminAPI.markCommentRead(id);
      setComments(comments.map((c) =>
        c._id === id ? { ...c, isRead: true } : c
      ));
    } catch (error) {}
  };

  const handleSaveNote = async (id) => {
    try {
      await adminAPI.addCommentNote(id, noteText);
      setComments(comments.map((c) =>
        c._id === id ? { ...c, adminNote: noteText, isRead: true } : c
      ));
      setEditingNoteId(null);
      setNoteText('');
      toast.success('Note saved');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map((c) => c._id));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  if (loading && page === 1) {
    return (
      <AdminLayout title="Comments & Suggestions">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Comments & Suggestions">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <p className="text-gray-400 text-xs">Unread</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.unread}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <p className="text-gray-400 text-xs">Visible</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats.visible}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <p className="text-gray-400 text-xs">Hidden</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.hidden}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-400" />
          {['all', 'unread', 'visible', 'hidden'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{selectedIds.length} selected</span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FiTrash2 className="w-4 h-4 inline mr-1" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="bg-dark-200 rounded-xl border border-dark-100 p-12 text-center">
          <FiMessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No comments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2">
            <input
              type="checkbox"
              checked={selectedIds.length === comments.length && comments.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-600"
            />
            <span className="text-sm text-gray-400">Select All</span>
          </div>

          {comments.map((comment) => {
            const catStyle = categoryStyles[comment.category] || categoryStyles.other;
            const isExpanded = expandedId === comment._id;

            return (
              <div
                key={comment._id}
                className={`bg-dark-200 rounded-xl border transition-all ${
                  !comment.isRead
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-dark-100'
                }`}
                onClick={() => {
                  if (!comment.isRead) handleMarkRead(comment._id);
                }}
              >
                {/* Main Row */}
                <div className="p-4 flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(comment._id)}
                    onChange={() => toggleSelect(comment._id)}
                    className="rounded border-gray-600 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Unread Dot */}
                  {!comment.isRead && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm flex items-center gap-1">
                            <FiUser className="w-3.5 h-3.5 text-gray-400" />
                            {comment.name}
                          </span>
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <FiMail className="w-3 h-3" />
                            {comment.email}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${catStyle.bg}`}>
                            {catStyle.label}
                          </span>
                        </div>

                        <p className="text-gray-300 text-sm mt-1 flex items-center gap-1">
                          <FiTag className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">{comment.reason}</span>
                        </p>

                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {comment.message}
                        </p>

                        <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(comment._id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            comment.isVisible
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                          }`}
                          title={comment.isVisible ? 'Hide from public' : 'Show to public'}
                        >
                          {comment.isVisible ? (
                            <FiEye className="w-4 h-4" />
                          ) : (
                            <FiEyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {/* Expand */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : comment._id);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-dark-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <FiChevronUp className="w-4 h-4" />
                          ) : (
                            <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(comment._id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-dark-100 pt-4 ml-8">
                    {/* Full Message */}
                    <div className="bg-dark-100 rounded-lg p-4 mb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Full Message</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.message}</p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">IP:</span>{' '}
                        <span className="text-gray-400">{comment.ip || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>{' '}
                        <span className={comment.isVisible ? 'text-green-500' : 'text-red-500'}>
                          {comment.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Note */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <FiEdit3 className="w-3 h-3" />
                        Admin Note
                      </p>
                      {editingNoteId === comment._id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 px-3 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Add a note..."
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNote(comment._id)}
                            className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingNoteId(null); setNoteText(''); }}
                            className="px-3 py-2 bg-dark-100 text-gray-400 text-sm rounded-lg hover:text-white"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNoteId(comment._id);
                            setNoteText(comment.adminNote || '');
                          }}
                          className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                          {comment.adminNote || 'Click to add note...'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-dark-100 text-gray-400 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.pages}
            className="px-4 py-2 text-sm bg-dark-100 text-gray-400 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
};

export default CommentsManager;