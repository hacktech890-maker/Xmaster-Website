import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "./DuplicateManager.css";

const DuplicateManager = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState({ total: 0, byTitle: 0, byDuration: 0, byFile: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [scanResult, setScanResult] = useState(null);
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
      showNotification("Failed to load duplicates", "error");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchDuplicates(1, activeFilter);
  }, [activeFilter, fetchDuplicates]);

  // Scan for duplicates
  const handleScan = async () => {
    if (scanning) return;
    if (!window.confirm(
      "Run STRICT duplicate scan?\n\n" +
      "This will only flag videos with:\n" +
      "• Same file code (same video file)\n" +
      "• Same file hash (same content)\n" +
      "• Exact same title AND exact same duration\n\n" +
      "Similar titles alone will NOT be flagged."
    )) return;

    setScanning(true);
    setScanResult(null);
    try {
      const res = await adminAPI.scanDuplicates();
      if (res.data.success) {
        setScanResult(res.data);
        showNotification(`Found ${res.data.duplicatesFound} duplicates out of ${res.data.totalScanned} videos`);
        fetchDuplicates(1, activeFilter);
      }
    } catch (error) {
      console.error("Scan failed:", error);
      showNotification("Scan failed", "error");
    } finally {
      setScanning(false);
    }
  };

  // ✅ PUBLISH ALL DUPLICATES
  const handlePublishAll = async () => {
    if (publishing) return;

    const filterLabel = activeFilter === "all"
      ? "ALL"
      : activeFilter === "title"
        ? "title-match"
        : activeFilter === "duration"
          ? "duration-match"
          : "file-match";

    const count = activeFilter === "all" ? stats.total :
      activeFilter === "title" ? stats.byTitle :
      activeFilter === "duration" ? stats.byDuration :
      stats.byFile;

    if (!window.confirm(
      `Publish ${count} ${filterLabel} duplicate videos?\n\n` +
      "This will:\n" +
      "• Remove duplicate flags from all selected videos\n" +
      "• Set status to 'public'\n" +
      "• Make them visible on your website\n\n" +
      "Are you sure?"
    )) return;

    setPublishing(true);
    try {
      const filter = activeFilter === "all" ? undefined : activeFilter;
      const res = await adminAPI.publishAllDuplicates(filter);
      if (res.data.success) {
        showNotification(`✅ Published ${res.data.published} videos! Now showing ${res.data.totalShowing} total.`);
        fetchDuplicates(1, activeFilter);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Publish all failed:", error);
      showNotification("Failed to publish videos", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ✅ BULK PUBLISH SELECTED
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Publish ${selectedIds.length} selected videos?`)) return;

    setLoading(true);
    try {
      const res = await adminAPI.bulkPublishDuplicates(selectedIds);
      if (res.data.success) {
        showNotification(`✅ Published ${res.data.published} videos!`);
        setSelectedIds([]);
        fetchDuplicates(pagination.page, activeFilter);
      }
    } catch (error) {
      console.error("Bulk publish failed:", error);
      showNotification("Failed to publish selected videos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Individual actions
  const handleAction = async (action, id, title) => {
    if (action === "delete" && !window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(prev => ({ ...prev, [id]: action }));
    try {
      let res;
      if (action === "delete") res = await adminAPI.deleteDuplicate(id);
      else if (action === "keep") res = await adminAPI.keepDuplicate(id);
      else if (action === "public") res = await adminAPI.makePublicDuplicate(id);

      if (res?.data?.success) {
        setDuplicates(prev => prev.filter(v => v._id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        showNotification(res.data.message || `Action completed`);
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      showNotification(`Failed to ${action}`, "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} duplicates permanently?`)) return;
    setLoading(true);
    try {
      await adminAPI.bulkDeleteDuplicates(selectedIds);
      showNotification(`Deleted ${selectedIds.length} videos`);
      setSelectedIds([]);
      fetchDuplicates(pagination.page, activeFilter);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      showNotification("Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  // Clear all flags
  const handleClearAll = async () => {
    if (!window.confirm(
      "Clear all duplicate flags and make all videos public?\n\n" +
      "This will NOT delete any videos — it will just remove the duplicate label " +
      "and make them visible on your website."
    )) return;
    setLoading(true);
    try {
      const res = await adminAPI.clearAllDuplicates();
      if (res.data.success) {
        showNotification(`✅ Cleared flags from ${res.data.cleared} videos — all are now public!`);
        fetchDuplicates(1, activeFilter);
      }
    } catch (error) {
      console.error("Clear failed:", error);
      showNotification("Failed to clear", "error");
    } finally {
      setLoading(false);
    }
  };

  // Selection helpers
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === duplicates.length) setSelectedIds([]);
    else setSelectedIds(duplicates.map(d => d._id));
  };

  // Thumbnail helper
  const getThumbnail = (video) => {
    if (!video) return "";
    if (video.thumbnail && video.thumbnail.startsWith("http")) return video.thumbnail;
    if (video.thumbnailUrl && video.thumbnailUrl.startsWith("http")) return video.thumbnailUrl;
    if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
    return "";
  };

  // Duration format
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const reasonColors = {
    title: "bg-red-500/20 text-red-400 border-red-500/30",
    duration: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    file: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    thumbnail: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const reasonLabels = {
    title: "Exact Title",
    duration: "Exact Duration",
    file: "Same File",
    thumbnail: "Thumbnail Match",
  };

  return (
    <AdminLayout title="Duplicate Manager">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg
            ${notification.type === "error"
              ? "bg-gradient-to-r from-red-600 to-red-500"
              : "bg-gradient-to-r from-green-600 to-green-500"
            } animate-slide-in`}
          style={{
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-400 text-sm">
            Manage duplicate videos • Strict mode: only same file or exact title+duration
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* ✅ PUBLISH ALL BUTTON */}
          {stats.total > 0 && (
            <button
              onClick={handlePublishAll}
              disabled={publishing || loading}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium
                         transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {publishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>🌐 Publish All ({activeFilter === "all" ? stats.total :
                  activeFilter === "title" ? stats.byTitle :
                  activeFilter === "duration" ? stats.byDuration :
                  stats.byFile})</>
              )}
            </button>
          )}

          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium
                       transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>🔍 Scan (Strict)</>
            )}
          </button>

          {stats.total > 0 && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-4 py-2.5 bg-dark-100 hover:bg-dark-300 text-gray-300 rounded-lg font-medium
                         transition-colors disabled:opacity-50"
            >
              🧹 Clear All Flags
            </button>
          )}
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-sm">
            ✅ Scan complete: Found <strong>{scanResult.duplicatesFound}</strong> duplicates
            out of <strong>{scanResult.totalScanned}</strong> videos scanned.
          </p>
          <p className="text-blue-400/70 text-xs mt-1">
            Only exact file matches and exact title+duration matches are flagged.
          </p>
        </div>
      )}

      {/* Stats Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: "all", label: "Total Duplicates", value: stats.total, color: "border-gray-500", activeColor: "border-blue-500 bg-blue-500/10" },
          { key: "title", label: "Exact Title Match", value: stats.byTitle, color: "border-gray-700", activeColor: "border-red-500 bg-red-500/10" },
          { key: "duration", label: "Exact Duration", value: stats.byDuration, color: "border-gray-700", activeColor: "border-yellow-500 bg-yellow-500/10" },
          { key: "file", label: "Same File", value: stats.byFile, color: "border-gray-700", activeColor: "border-purple-500 bg-purple-500/10" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setActiveFilter(stat.key)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeFilter === stat.key
                ? stat.activeColor
                : `${stat.color} bg-dark-200 hover:bg-dark-100`
            }`}
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 bg-dark-100 rounded-xl border border-dark-300">
          <span className="text-white font-medium">{selectedIds.length} selected</span>

          {/* ✅ BULK PUBLISH SELECTED */}
          <button
            onClick={handleBulkPublish}
            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30
                       rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
          >
            🌐 Publish Selected
          </button>

          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20
                       rounded-lg transition-colors text-sm font-medium"
          >
            🗑️ Delete Selected
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="px-4 py-2 bg-dark-200 text-gray-400 hover:text-white
                       rounded-lg transition-colors text-sm"
          >
            ✕ Cancel
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
              {activeFilter !== "all"
                ? `No ${activeFilter} match duplicates. Try "Total" filter.`
                : "Your library is clean! Run a scan to check."}
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
                className="rounded accent-blue-500 w-4 h-4"
              />
              <span className="text-gray-400 text-sm">
                Select All ({duplicates.length} on this page)
              </span>
            </div>

            {/* Duplicate Cards */}
            {duplicates.map((video) => {
              const original = video.duplicateOf;
              const hasOriginal = original && typeof original === "object";

              return (
                <div
                  key={video._id}
                  className={`bg-dark-200 rounded-xl border overflow-hidden transition-colors ${
                    selectedIds.includes(video._id)
                      ? "border-primary-500"
                      : "border-dark-100"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between p-4 bg-dark-300 border-b border-dark-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(video._id)}
                        onChange={() => toggleSelect(video._id)}
                        className="rounded accent-blue-500 w-4 h-4"
                      />
                      <span className="text-white font-medium text-sm">Duplicate Detected</span>
                      <div className="flex gap-2">
                        {video.duplicateReasons?.map((reason) => (
                          <span
                            key={reason}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              reasonColors[reason] || "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {reasonLabels[reason] || reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick publish button on each card */}
                    <button
                      onClick={() => handleAction("public", video._id)}
                      disabled={!!actionLoading[video._id]}
                      className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30
                                 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading[video._id] === "public" ? "..." : "🌐 Publish"}
                    </button>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dark-100">
                    {/* LEFT: Duplicate */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          🔴 DUPLICATE
                        </span>
                        <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                          {video.status === "public" ? "🌐 Public" : "🔒 " + (video.status || "Private")}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-40 h-24 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                          {getThumbnail(video) ? (
                            <img
                              src={getThumbnail(video)}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{video.title}</h4>
                          <div className="mt-2 space-y-1 text-xs text-gray-400">
                            <p>📁 {video.file_code}</p>
                            <p>⏱️ {video.duration || formatDuration(video.duration_seconds)}
                              {video.duration_seconds > 0 && (
                                <span className="text-gray-600 ml-1">({video.duration_seconds}s)</span>
                              )}
                            </p>
                            <p>👁️ {video.views || 0} views</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAction("keep", video._id)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30
                                     rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === "keep" ? "..." : "✅ Keep Unique"}
                        </button>
                        <button
                          onClick={() => handleAction("public", video._id)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30
                                     rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === "public" ? "..." : "🌐 Make Public"}
                        </button>
                        <button
                          onClick={() => handleAction("delete", video._id, video.title)}
                          disabled={!!actionLoading[video._id]}
                          className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30
                                     rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading[video._id] === "delete" ? "..." : "🗑️ Delete"}
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Original */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          🟢 ORIGINAL
                        </span>
                        {hasOriginal && (
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            original.status === "public"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {original.status === "public" ? "🌐 Public" : "🔒 " + (original.status || "Unknown")}
                          </span>
                        )}
                      </div>

                      {hasOriginal ? (
                        <div className="flex gap-3">
                          <div className="w-40 h-24 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                            {getThumbnail(original) ? (
                              <img
                                src={getThumbnail(original)}
                                alt={original.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{original.title}</h4>
                            <div className="mt-2 space-y-1 text-xs text-gray-400">
                              <p>📁 {original.file_code}</p>
                              <p>⏱️ {original.duration || "N/A"}
                                {original.duration_seconds > 0 && (
                                  <span className="text-gray-600 ml-1">({original.duration_seconds}s)</span>
                                )}
                              </p>
                              <p>👁️ {original.views || 0} views</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 bg-dark-100 rounded-lg">
                          <p className="text-gray-500 text-sm">Original video data not available</p>
                        </div>
                      )}

                      {hasOriginal && (
                        <div className="flex gap-2 mt-4">
                          <a
                            href={`/watch/${original._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300
                                       rounded-lg text-xs font-medium transition-colors text-center"
                          >
                            👁️ View Original
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchDuplicates(pagination.page - 1)}
                  className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg
                             disabled:opacity-50 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-gray-400 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchDuplicates(pagination.page + 1)}
                  className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg
                             disabled:opacity-50 transition-colors"
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