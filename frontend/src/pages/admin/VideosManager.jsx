// src/pages/admin/VideosManager.jsx
// Premium video management table
// Preserves: ALL existing adminAPI calls for video CRUD
// Adds: modern table, inline status badges, bulk actions toolbar

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiTrash2, FiEdit2,
  FiEye, FiEyeOff, FiStar, FiDownload,
  FiRefreshCw, FiCheck, FiX, FiChevronDown,
  FiAlertTriangle, FiVideo, FiMoreVertical,
  FiExternalLink, FiCheckSquare, FiSquare,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI }    from '../../services/api';
import AdminLayout     from '../../components/admin/AdminLayout';
import Pagination      from '../../components/common/Pagination';
import LoadingSpinner  from '../../components/common/LoadingSpinner';
import {
  formatViewsShort,
  formatDate,
  formatDuration,
  getThumbnailUrl,
  truncateText,
  getWatchUrl,
} from '../../utils/helpers';

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE      = 20;
const STATUS_OPTIONS = ['all', 'public', 'private', 'draft'];

// ============================================================
// VIDEOS MANAGER
// ============================================================

const VideosManager = () => {
  // ── Data ───────────────────────────────────────────────────
  const [videos,      setVideos]      = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Pagination ─────────────────────────────────────────────
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  // ── Filters ────────────────────────────────────────────────
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [catFilter,   setCatFilter]   = useState('all');

  // ── Selection ──────────────────────────────────────────────
  const [selected,    setSelected]    = useState(new Set());
  const [selectAll,   setSelectAll]   = useState(false);

  // ── Inline edit ────────────────────────────────────────────
  const [editingId,   setEditingId]   = useState(null);
  const [editTitle,   setEditTitle]   = useState('');

  // ── Row actions ────────────────────────────────────────────
  const [actionMenu,  setActionMenu]  = useState(null); // video._id
  const [deleting,    setDeleting]    = useState(null);
  const [processing,  setProcessing]  = useState(null);

  const mountedRef  = useRef(true);
  const searchTimer = useRef(null);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Fetch categories once ──────────────────────────────────
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res  = await adminAPI.getCategories?.() || { data: [] };
        const data = res?.data?.categories || res?.data || [];
        if (mountedRef.current) setCategories(Array.isArray(data) ? data : []);
      } catch { /* non-critical */ }
    };
    fetchCats();
  }, []);

  // ── Fetch videos ───────────────────────────────────────────
  useEffect(() => {
    fetchVideos(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, catFilter]);

  // ── Debounced search ───────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchVideos(1);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchVideos = async (pg = 1) => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    setSelectAll(false);

    try {
      const params = {
        page:     pg,
        limit:    PAGE_SIZE,
        search:   search || undefined,
        status:   statusFilter !== 'all' ? statusFilter : undefined,
        category: catFilter    !== 'all' ? catFilter    : undefined,
      };

      // Existing API call preserved
      const res  = await adminAPI.getVideos(params);
      const data = res?.data?.videos || res?.data || [];
      const pages= res?.data?.totalPages || res?.data?.pages || 1;
      const count= res?.data?.total || data.length;

      if (!mountedRef.current) return;

      setVideos(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setTotalCount(count);
      setPage(pg);
    } catch (err) {
      if (mountedRef.current) setError('Failed to load videos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ============================================================
  // SELECTION HANDLERS
  // ============================================================

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(videos.map((v) => v._id)));
      setSelectAll(true);
    }
  }, [selectAll, videos]);

  // ============================================================
  // ACTION HANDLERS — all existing API calls preserved
  // ============================================================

  const handleDelete = async (videoId) => {
    if (!window.confirm('Delete this video? This cannot be undone.')) return;
    setDeleting(videoId);
    try {
      await adminAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      setTotalCount((p) => p - 1);
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete video');
    } finally {
      if (mountedRef.current) setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} video(s)? This cannot be undone.`)) return;
    setProcessing('bulk-delete');
    try {
      await adminAPI.bulkDeleteVideos([...selected]);
      setVideos((prev) => prev.filter((v) => !selected.has(v._id)));
      setTotalCount((p) => p - selected.size);
      setSelected(new Set());
      setSelectAll(false);
      toast.success(`${selected.size} video(s) deleted`);
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handleStatusToggle = async (video) => {
    const newStatus = video.status === 'public' ? 'private' : 'public';
    setProcessing(video._id);
    try {
      await adminAPI.updateVideoStatus(video._id, newStatus);
      setVideos((prev) =>
        prev.map((v) => v._id === video._id ? { ...v, status: newStatus } : v)
      );
      toast.success(`Video set to ${newStatus}`);
    } catch {
      toast.error('Status update failed');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handleToggleFeatured = async (video) => {
    setProcessing(video._id);
    try {
      await adminAPI.toggleFeatured(video._id);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === video._id ? { ...v, featured: !v.featured } : v
        )
      );
      toast.success(video.featured ? 'Removed from featured' : 'Added to featured');
    } catch {
      toast.error('Failed to update featured status');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handleInlineSave = async (video) => {
    if (!editTitle.trim() || editTitle === video.title) {
      setEditingId(null);
      return;
    }
    try {
      await adminAPI.updateVideo(video._id, { title: editTitle.trim() });
      setVideos((prev) =>
        prev.map((v) => v._id === video._id ? { ...v, title: editTitle.trim() } : v)
      );
      toast.success('Title updated');
    } catch {
      toast.error('Failed to update title');
    } finally {
      setEditingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminAPI.exportVideosCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `xmaster-videos-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch {
      toast.error('Export failed');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AdminLayout
      title={`Videos ${totalCount > 0 ? `(${totalCount.toLocaleString()})` : ''}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="
              flex items-center gap-1.5
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-white/8 text-white/60 border border-white/10
              hover:bg-white/15 hover:text-white
              transition-all duration-200
            "
          >
            <FiDownload className="w-3.5 h-3.5" />
            Export
          </button>
          <Link
            to="/admin/upload"
            className="btn-primary text-xs px-3 py-1.5"
          >
            + Upload
          </Link>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Filters toolbar ──────────────────────────────── */}
        <div className="
          glass-panel rounded-2xl p-4
          flex flex-wrap items-center gap-3
        ">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="
              absolute left-3 top-1/2 -translate-y-1/2
              w-4 h-4 text-white/30 pointer-events-none
            " />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="input-base pl-9 h-9 text-sm"
            />
          </div>

          {/* Status filter */}
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />

          {/* Category filter */}
          {categories.length > 0 && (
            <FilterSelect
              value={catFilter}
              onChange={setCatFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.slug || c._id, label: c.name })),
              ]}
            />
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchVideos(page)}
            disabled={loading}
            className="
              p-2.5 rounded-lg text-white/40 hover:text-white
              hover:bg-white/10 border border-white/8
              disabled:opacity-50
              transition-all duration-200
            "
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Bulk actions bar ─────────────────────────────── */}
        {selected.size > 0 && (
          <div className="
            glass-panel rounded-xl px-4 py-3
            flex items-center gap-3
            border-primary-600/20
            animate-fade-in-down
          ">
            <span className="text-sm font-semibold text-primary-400">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleBulkDelete}
                disabled={processing === 'bulk-delete'}
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-red-500/15 text-red-400 border border-red-500/20
                  hover:bg-red-500/25
                  disabled:opacity-50
                  transition-all duration-200
                "
              >
                {processing === 'bulk-delete'
                  ? <><span className="w-3 h-3 rounded-full border border-red-400/30 border-t-red-400 animate-spin" />Deleting...</>
                  : <><FiTrash2 className="w-3.5 h-3.5" />Delete</>
                }
              </button>
              <button
                onClick={() => { setSelected(new Set()); setSelectAll(false); }}
                className="
                  px-3 py-1.5 rounded-lg text-xs
                  text-white/40 hover:text-white
                  hover:bg-white/10
                  transition-all duration-200
                "
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl overflow-hidden">

          {/* Error */}
          {error && (
            <div className="p-6 text-center">
              <FiAlertTriangle className="w-8 h-8 text-red-400/50 mx-auto mb-2" />
              <p className="text-sm text-white/50 mb-3">{error}</p>
              <button
                onClick={() => fetchVideos(page)}
                className="btn-secondary text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <TableHead
                  allSelected={false}
                  onSelectAll={() => {}}
                />
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Data */}
          {!loading && !error && videos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <TableHead
                  allSelected={selectAll}
                  onSelectAll={toggleSelectAll}
                />
                <tbody>
                  {videos.map((video) => (
                    <VideoRow
                      key={video._id}
                      video={video}
                      selected={selected.has(video._id)}
                      onSelect={() => toggleSelect(video._id)}
                      editing={editingId === video._id}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onStartEdit={() => { setEditingId(video._id); setEditTitle(video.title); }}
                      onSaveEdit={() => handleInlineSave(video)}
                      onCancelEdit={() => setEditingId(null)}
                      onDelete={() => handleDelete(video._id)}
                      onStatusToggle={() => handleStatusToggle(video)}
                      onToggleFeatured={() => handleToggleFeatured(video)}
                      deleting={deleting === video._id}
                      processing={processing === video._id}
                      actionMenuOpen={actionMenu === video._id}
                      onActionMenu={() => setActionMenu(
                        actionMenu === video._id ? null : video._id
                      )}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && videos.length === 0 && (
            <div className="py-16 text-center">
              <FiVideo className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30 mb-1">No videos found</p>
              <p className="text-xs text-white/20">
                Try adjusting your filters or upload new content
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(pg) => fetchVideos(pg)}
            />
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

// ============================================================
// TABLE HEAD
// ============================================================

const TableHead = ({ allSelected, onSelectAll }) => (
  <thead>
    <tr>
      <th className="w-10 pl-4">
        <button
          onClick={onSelectAll}
          className="text-white/30 hover:text-white transition-colors"
        >
          {allSelected
            ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
            : <FiSquare      className="w-4 h-4" />
          }
        </button>
      </th>
      <th className="min-w-[280px]">Video</th>
      <th className="w-24">Status</th>
      <th className="w-20">Views</th>
      <th className="w-20">Duration</th>
      <th className="w-28">Uploaded</th>
      <th className="w-24 text-right pr-4">Actions</th>
    </tr>
  </thead>
);

// ============================================================
// VIDEO ROW
// ============================================================

const VideoRow = ({
  video, selected, onSelect,
  editing, editTitle, setEditTitle,
  onStartEdit, onSaveEdit, onCancelEdit,
  onDelete, onStatusToggle, onToggleFeatured,
  deleting, processing, actionMenuOpen, onActionMenu,
}) => {
  const thumb    = getThumbnailUrl(video);
  const watchUrl = getWatchUrl(video);
  const rowRef   = useRef(null);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenuOpen) return;
    const handler = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target)) {
        onActionMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [actionMenuOpen, onActionMenu]);

  return (
    <tr
      ref={rowRef}
      className={`
        transition-colors duration-150
        ${selected ? 'bg-primary-600/8' : ''}
        ${deleting || processing ? 'opacity-60' : ''}
      `}
    >
      {/* Checkbox */}
      <td className="pl-4">
        <button
          onClick={onSelect}
          className="text-white/30 hover:text-white transition-colors"
        >
          {selected
            ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
            : <FiSquare      className="w-4 h-4" />
          }
        </button>
      </td>

      {/* Video cell */}
      <td>
        <div className="flex items-center gap-3 py-1">
          {/* Thumbnail */}
          <div className="
            relative w-20 h-12 rounded-lg overflow-hidden
            flex-shrink-0 bg-dark-300
          ">
            <img
              src={thumb}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {video.duration && (
              <span className="
                absolute bottom-0.5 right-0.5
                text-[9px] font-bold text-white
                bg-black/80 px-1 py-px rounded
              ">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>

          {/* Title (inline edit) */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  autoFocus
                  className="
                    flex-1 bg-white/8 border border-primary-600/40
                    rounded-lg px-2 py-1 text-xs text-white
                    focus:outline-none focus:border-primary-600
                  "
                />
                <button onClick={onSaveEdit}   className="text-emerald-400 hover:text-emerald-300"><FiCheck className="w-3.5 h-3.5" /></button>
                <button onClick={onCancelEdit}  className="text-red-400    hover:text-red-300"   ><FiX     className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <p
                className="
                  text-xs font-semibold text-white/80
                  line-clamp-2 leading-snug
                  cursor-pointer hover:text-white
                  transition-colors duration-150
                "
                onClick={onStartEdit}
                title="Click to edit title"
              >
                {video.title}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 mt-1">
              {video.featured && (
                <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                  <FiStar className="w-2.5 h-2.5 fill-amber-400" />
                  Featured
                </span>
              )}
              {video.category && (
                <span className="text-[9px] text-white/30">
                  {typeof video.category === 'string'
                    ? video.category
                    : video.category?.name || ''
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td>
        <button
          onClick={onStatusToggle}
          disabled={processing}
          className={`
            px-2 py-0.5 rounded-full text-[10px] font-bold
            border transition-all duration-200
            ${video.status === 'public'
              ? 'status-public  hover:bg-emerald-500/25'
              : video.status === 'private'
                ? 'status-private hover:bg-gray-500/25'
                : 'status-draft   hover:bg-amber-500/25'
            }
            ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {video.status || 'draft'}
        </button>
      </td>

      {/* Views */}
      <td>
        <span className="text-xs text-white/50">
          {formatViewsShort(video.views)}
        </span>
      </td>

      {/* Duration */}
      <td>
        <span className="text-xs text-white/50">
          {formatDuration(video.duration) || '—'}
        </span>
      </td>

      {/* Date */}
      <td>
        <span className="text-xs text-white/40">
          {formatDate(video.createdAt || video.uploadDate)}
        </span>
      </td>

      {/* Actions */}
      <td className="pr-4">
        <div className="flex items-center justify-end gap-1 relative">

          {/* Featured toggle */}
          <button
            onClick={onToggleFeatured}
            disabled={processing}
            title={video.featured ? 'Remove from featured' : 'Add to featured'}
            className={`
              p-1.5 rounded-lg transition-all duration-150
              ${video.featured
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-white/20 hover:text-amber-400 hover:bg-amber-500/10'
              }
              disabled:opacity-50
            `}
          >
            <FiStar className={`w-3.5 h-3.5 ${video.featured ? 'fill-amber-400' : ''}`} />
          </button>

          {/* View on site */}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
            title="View on site"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={deleting || processing}
            title="Delete video"
            className="
              p-1.5 rounded-lg
              text-white/20 hover:text-red-400 hover:bg-red-500/10
              disabled:opacity-50
              transition-all duration-150
            "
          >
            {deleting
              ? <span className="w-3.5 h-3.5 rounded-full border border-red-400/30 border-t-red-400 animate-spin block" />
              : <FiTrash2 className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </td>
    </tr>
  );
};

// ============================================================
// TABLE ROW SKELETON
// ============================================================

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="pl-4">
      <div className="w-4 h-4 rounded skeleton-shimmer bg-dark-200" />
    </td>
    <td>
      <div className="flex items-center gap-3 py-1">
        <div className="w-20 h-12 rounded-lg skeleton-shimmer bg-dark-300 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-full" />
          <div className="h-3 rounded skeleton-shimmer bg-dark-300 w-2/3" />
        </div>
      </div>
    </td>
    <td><div className="h-4 w-14 rounded-full skeleton-shimmer bg-dark-300" /></td>
    <td><div className="h-3.5 w-10 rounded skeleton-shimmer bg-dark-300" /></td>
    <td><div className="h-3.5 w-12 rounded skeleton-shimmer bg-dark-300" /></td>
    <td><div className="h-3.5 w-20 rounded skeleton-shimmer bg-dark-300" /></td>
    <td className="pr-4">
      <div className="flex justify-end gap-2">
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
      </div>
    </td>
  </tr>
);

// ============================================================
// FILTER SELECT
// ============================================================

const FilterSelect = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        appearance-none
        pl-3 pr-8 py-2 rounded-xl text-sm
        bg-white/6 border border-white/10 text-white/70
        hover:border-white/20 focus:border-primary-600/40
        focus:outline-none
        transition-all duration-200
        cursor-pointer
      "
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-dark-300 text-white">
          {opt.label}
        </option>
      ))}
    </select>
    <FiChevronDown className="
      absolute right-2.5 top-1/2 -translate-y-1/2
      w-3.5 h-3.5 text-white/30
      pointer-events-none
    " />
  </div>
);

export default VideosManager;