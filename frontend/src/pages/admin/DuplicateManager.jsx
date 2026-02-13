import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const DuplicateManager = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState({ total: 0, byTitle: 0, byDuration: 0, byFile: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [scanResult, setScanResult] = useState(null);

  const fetchDuplicates = useCallback(async (page = 1, filter = activeFilter) => {
    setLoading(true);
    try {
      const res = await adminAPI.getDuplicates({ filter, page, limit: 50 });
      if (res.data.success) {
        setDuplicates(res.data.duplicates);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch duplicates:", error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchDuplicates(1, activeFilter);
  }, [activeFilter, fetchDuplicates]);

  const handleScan = async () => {
    if (scanning) return;
    if (!window.confirm("Scan all videos for duplicates? This may take a while.")) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await adminAPI.scanDuplicates();
      if (res.data.success) {
        setScanResult(res.data);
        fetchDuplicates(1, activeFilter);
      }
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleAction = async (action, id, title) => {
    if (action === 'delete' && !window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(prev => ({ ...prev, [id]: action }));
    try {
      let res;
      if (action === 'delete') res = await adminAPI.deleteDuplicate(id);
      else if (action === 'keep') res = await adminAPI.keepDuplicate(id);
      else if (action === 'public') res = await adminAPI.makePublicDuplicate(id);
      
      if (res?.data?.success) {
        setDuplicates(prev => prev.filter(v => v._id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} duplicates?`)) return;
    setLoading(true);
    try {
      await adminAPI.bulkDeleteDuplicates(selectedIds);
      setSelectedIds([]);
      fetchDuplicates(pagination.page, activeFilter);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all duplicate flags? (Videos won't be deleted)")) return;
    setLoading(true);
    try {
      await adminAPI.clearAllDuplicates();
      fetchDuplicates(1, activeFilter);
    } catch (error) {
      console.error("Clear failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === duplicates.length) setSelectedIds([]);
    else setSelectedIds(duplicates.map(d => d._id));
  };

  const getThumbnail = (video) => {
    if (!video) return '';
    if (video.thumbnail && video.thumbnail.startsWith('http')) return video.thumbnail;
    if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
    return '';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const reasonColors = {
    title: 'bg-red-500/20 text-red-400 border-red-500/30',
    duration: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    file: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    thumbnail: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const reasonLabels = {
    title: 'Title Match',
    duration: 'Duration Match',
    file: 'File Match',
    thumbnail: 'Thumbnail Match',
  };

  return (
    <AdminLayout title="Duplicate Manager">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p className="text-gray-400 text-sm">Manage duplicate videos detected during uploads</p>
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
            ) : (
              <>🔍 Scan for Duplicates</>
            )}
          </button>
          {stats.total > 0 && (
            <button onClick={handleClearAll} className="px-4 py-2.5 bg-dark-100 hover:bg-dark-300 text-gray-300 rounded-lg font-medium transition-colors">
              🧹 Clear All Flags
            </button>
          )}
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm">
          Found {scanResult.duplicatesFound} duplicates out of {scanResult.totalScanned} videos scanned.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all', label: 'Total', value: stats.total, color: 'border-gray-500' },
          { key: 'title', label: 'Title Match', value: stats.byTitle, color: 'border-red-500' },
          { key: 'duration', label: 'Duration Match', value: stats.byDuration, color: 'border-yellow-500' },
          { key: 'file', label: 'File Match', value: stats.byFile, color: 'border-purple-500' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setActiveFilter(stat.key)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeFilter === stat.key
                ? `${stat.color} bg-dark-100`
                : 'border-dark-100 bg-dark-200 hover:bg-dark-100'
            }`}
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4 p-4 bg-dark-100 rounded-xl">
          <span className="text-gray-400">{selectedIds.length} selected</span>
          <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors text-sm">
            🗑️ Delete Selected
          </button>
          <button onClick={() => setSelectedIds([])} className="px-4 py-2 bg-dark-200 text-gray-400 hover:text-white rounded-lg transition-colors text-sm">
            Cancel
          </button>
        </div>
      )}

      {/* Duplicate List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading duplicates...</p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-16 bg-dark-200 rounded-xl">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-white text-lg font-semibold mb-2">No Duplicates Found</h3>
            <p className="text-gray-400 text-sm">
              {activeFilter !== 'all' ? `No ${activeFilter} match duplicates. Try "Total" filter.` : 'Your library is clean!'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                checked={selectedIds.length === duplicates.length && duplicates.length > 0}
                onChange={toggleSelectAll}
                className="rounded"
              />
              <span className="text-gray-400 text-sm">Select All ({duplicates.length})</span>
            </div>

            {/* Side-by-Side Comparison Cards */}
            {duplicates.map((video) => {
              const original = video.duplicateOf;
              const hasOriginal = original && typeof original === 'object';

              return (
                <div
                  key={video._id}
                  className={`bg-dark-200 rounded-xl border overflow-hidden transition-colors ${
                    selectedIds.includes(video._id) ? 'border-primary-500' : 'border-dark-100'
                  }`}
                >
                  {/* Top Bar: Checkbox + Reasons */}
                  <div className="flex items-center justify-between p-4 bg-dark-300 border-b border-dark-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(video._id)}
                        onChange={() => toggleSelect(video._id)}
                        className="rounded"
                      />
                      <span className="text-white font-medium text-sm">Duplicate Detected</span>
                      <div className="flex gap-2">
                        {video.duplicateReasons?.map(reason => (
                          <span
                            key={reason}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${reasonColors[reason] || 'bg-gray-500/20 text-gray-400'}`}
                          >
                            {reasonLabels[reason] || reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dark-100">
                    
                    {/* LEFT: Duplicate (New Video) */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          🔴 DUPLICATE
                        </span>
                        <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                          🔒 Private
                        </span>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="w-40 h-24 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                          {getThumbnail(video) ? (
                            <img src={getThumbnail(video)} alt={video.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{video.title}</h4>
                          <div className="mt-2 space-y-1 text-xs text-gray-400">
                            <p>📁 {video.file_code}</p>
                            <p>⏱️ {video.duration || formatDuration(video.duration_seconds)}</p>
                            <p>👁️ {video.views || 0} views</p>
                            <p>📅 {new Date(video.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions for Duplicate */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAction('keep', video._id)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === 'keep' ? '...' : '✅ Keep as Unique'}
                        </button>
                        <button
                          onClick={() => handleAction('public', video._id)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === 'public' ? '...' : '🌐 Make Public'}
                        </button>
                        <button
                          onClick={() => handleAction('delete', video._id, video.title)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === 'delete' ? '...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Original Video */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          🟢 ORIGINAL
                        </span>
                        {hasOriginal && (
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            original.status === 'public' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {original.status === 'public' ? '🌐 Public' : '🔒 ' + (original.status || 'Unknown')}
                          </span>
                        )}
                      </div>

                      {hasOriginal ? (
                        <div className="flex gap-3">
                          <div className="w-40 h-24 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                            {getThumbnail(original) ? (
                              <img src={getThumbnail(original)} alt={original.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{original.title}</h4>
                            <div className="mt-2 space-y-1 text-xs text-gray-400">
                              <p>📁 {original.file_code}</p>
                              <p>⏱️ {original.duration || 'N/A'}</p>
                              <p>👁️ {original.views || 0} views</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 bg-dark-100 rounded-lg">
                          <p className="text-gray-500 text-sm">Original video data not available</p>
                        </div>
                      )}

                      {/* Actions for Original */}
                      {hasOriginal && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAction('delete', original._id, original.title)}
                            disabled={!!actionLoading[original._id]}
                            className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading[original._id] === 'delete' ? '...' : '🗑️ Delete Original'}
                          </button>
                          <a
                            href={`/watch/${original._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg text-xs font-medium transition-colors text-center"
                          >
                            👁️ View Original
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Delete Both Option */}
                  {hasOriginal && (
                    <div className="px-4 py-3 bg-dark-300 border-t border-dark-100 flex justify-center">
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete BOTH videos? This cannot be undone.')) return;
                          setActionLoading(prev => ({ ...prev, [video._id]: 'delete', [original._id]: 'delete' }));
                          try {
                            await adminAPI.bulkDeleteDuplicates([video._id, original._id]);
                            setDuplicates(prev => prev.filter(v => v._id !== video._id));
                            setStats(prev => ({ ...prev, total: prev.total - 1 }));
                          } catch (e) {
                            console.error('Delete both failed:', e);
                          } finally {
                            setActionLoading(prev => ({ ...prev, [video._id]: null, [original._id]: null }));
                          }
                        }}
                        className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        🗑️ Delete Both Videos
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchDuplicates(pagination.page - 1)}
                  className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-gray-400 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchDuplicates(pagination.page + 1)}
                  className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DuplicateManager;