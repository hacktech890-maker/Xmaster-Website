// src/pages/admin/CommentsManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiMessageSquare, FiEye, FiEyeOff,
  FiTrash2, FiRefreshCw, FiSearch,
  FiCheckSquare, FiSquare, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI }   from '../../services/api';
import AdminLayout    from '../../components/admin/AdminLayout';
import Pagination     from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;

const CommentsManager = () => {
  const [comments,   setComments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(new Set());
  const [processing, setProcessing] = useState(null);

  const mountedRef  = useRef(true);
  const searchTimer = useRef(null);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { fetchComments(1); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchComments(1), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchComments = async (pg = 1) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res  = await adminAPI.getComments({
        page: pg, limit: PAGE_SIZE,
        visibility: filter !== 'all' ? filter : undefined,
        search: search || undefined,
      });
      const data  = res?.data?.comments || res?.data || [];
      const pages = res?.data?.totalPages || 1;
      if (!mountedRef.current) return;
      setComments(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setPage(pg);
    } catch {
      if (mountedRef.current) setError('Failed to load comments');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleToggleVisibility = async (comment) => {
    setProcessing(comment._id);
    try {
      await adminAPI.toggleCommentVisibility(comment._id);
      setComments((p) => p.map((c) => c._id === comment._id ? { ...c, visible: !c.visible } : c));
      toast.success(comment.visible ? 'Comment hidden' : 'Comment shown');
    } catch { toast.error('Failed to update comment'); }
    finally  { if (mountedRef.current) setProcessing(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    setProcessing(id);
    try {
      await adminAPI.deleteComment(id);
      setComments((p) => p.filter((c) => c._id !== id));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
    finally  { if (mountedRef.current) setProcessing(null); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} comment(s)?`)) return;
    try {
      await adminAPI.bulkDeleteComments([...selected]);
      setComments((p) => p.filter((c) => !selected.has(c._id)));
      setSelected(new Set());
      toast.success(`${selected.size} comment(s) deleted`);
    } catch { toast.error('Bulk delete failed'); }
  };

  const toggleSelect    = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === comments.length) setSelected(new Set());
    else setSelected(new Set(comments.map((c) => c._id)));
  };

  return (
    <AdminLayout title="Comments">
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments..." className="input-base pl-9 h-9 text-sm" />
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/[0.08] rounded-xl p-1">
            {['all', 'visible', 'hidden'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${filter === f ? 'bg-white/12 text-white' : 'text-white/30 hover:text-white/60'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => fetchComments(page)} disabled={loading} className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 border border-white/[0.08] disabled:opacity-50 transition-all duration-200">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {selected.size > 0 && (
          <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in-down">
            <span className="text-sm font-semibold text-primary-400">{selected.size} selected</span>
            <button onClick={handleBulkDelete} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all duration-200">
              <FiTrash2 className="w-3.5 h-3.5" />Delete Selected
            </button>
          </div>
        )}

        <div className="glass-panel rounded-2xl overflow-hidden">
          {loading && <div className="divide-y divide-white/5">{Array.from({ length: 6 }).map((_, i) => <CommentSkeleton key={i} />)}</div>}
          {error   && <div className="p-8 text-center"><FiAlertCircle className="w-8 h-8 text-red-400/50 mx-auto mb-2" /><p className="text-sm text-white/40">{error}</p></div>}
          {!loading && !error && comments.length === 0 && <div className="p-12 text-center"><FiMessageSquare className="w-10 h-10 text-white/15 mx-auto mb-3" /><p className="text-sm text-white/30">No comments found</p></div>}
          {!loading && comments.length > 0 && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
                <button onClick={toggleSelectAll} className="text-white/30 hover:text-white transition-colors">
                  {selected.size === comments.length ? <FiCheckSquare className="w-4 h-4 text-primary-400" /> : <FiSquare className="w-4 h-4" />}
                </button>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex-1">Comment</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest w-20 text-right hidden sm:block">Status</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest w-20 text-right">Actions</span>
              </div>
              <div className="divide-y divide-white/5">
                {comments.map((comment) => (
                  <CommentRow
                    key={comment._id}
                    comment={comment}
                    selected={selected.has(comment._id)}
                    onSelect={() => toggleSelect(comment._id)}
                    onToggleVisibility={() => handleToggleVisibility(comment)}
                    onDelete={() => handleDelete(comment._id)}
                    processing={processing === comment._id}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(pg) => fetchComments(pg)} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const CommentRow = ({ comment, selected, onSelect, onToggleVisibility, onDelete, processing }) => {
  const initial = (comment.name || 'A').charAt(0).toUpperCase();
  const colors  = ['bg-primary-600/20 text-primary-400', 'bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400', 'bg-emerald-500/20 text-emerald-400'];
  const color   = colors[initial.charCodeAt(0) % colors.length];

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors ${selected ? 'bg-primary-600/5' : ''} ${processing ? 'opacity-60' : ''}`}>
      <button onClick={onSelect} className="mt-0.5 text-white/30 hover:text-white transition-colors flex-shrink-0">
        {selected ? <FiCheckSquare className="w-4 h-4 text-primary-400" /> : <FiSquare className="w-4 h-4" />}
      </button>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${color}`}>{initial}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white/80">{comment.name}</span>
          <span className="text-[10px] text-white/30">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{comment.message}</p>
        {comment.videoId && <p className="text-[10px] text-white/25 mt-1">Video: {comment.videoId}</p>}
      </div>
      <div className="hidden sm:flex w-20 justify-end">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${comment.visible ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-gray-500/15 text-gray-400 border-gray-500/25'}`}>
          {comment.visible ? 'Visible' : 'Hidden'}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onToggleVisibility} disabled={processing} title={comment.visible ? 'Hide comment' : 'Show comment'} className={`p-1.5 rounded-lg transition-all duration-150 ${comment.visible ? 'text-white/25 hover:text-amber-400 hover:bg-amber-500/10' : 'text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10'} disabled:opacity-50`}>
          {comment.visible ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onDelete} disabled={processing} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all duration-150">
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const CommentSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
    <div className="w-4 h-4 rounded flex-shrink-0 skeleton-shimmer bg-dark-200 mt-0.5" />
    <div className="w-7 h-7 rounded-full flex-shrink-0 skeleton-shimmer bg-dark-200" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2"><div className="h-3 w-20 rounded skeleton-shimmer bg-dark-200" /><div className="h-3 w-16 rounded skeleton-shimmer bg-dark-300" /></div>
      <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-full" />
      <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-3/4" />
    </div>
  </div>
);

export default CommentsManager;