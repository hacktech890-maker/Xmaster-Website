import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./DuplicateManager.css";

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
  const [notification, setNotification] = useState(null);

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
      showNotification("Failed to fetch duplicates", "error");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchDuplicates(1, activeFilter);
  }, [activeFilter, fetchDuplicates]);

  const handleScan = async () => {
    if (scanning) return;
    if (!window.confirm("This will scan all videos for duplicates. This may take a while for large libraries. Continue?")) {
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await adminAPI.scanDuplicates();
      if (res.data.success) {
        setScanResult(res.data);
        showNotification(res.data.message, "success");
        fetchDuplicates(1, activeFilter);
      }
    } catch (error) {
      console.error("Scan failed:", error);
      showNotification("Scan failed. Check console for details.", "error");
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete duplicate "${title}"? This cannot be undone.`)) return;
    setActionLoading((prev) => ({ ...prev, [id]: "deleting" }));
    try {
      const res = await adminAPI.deleteDuplicate(id);
      if (res.data.success) {
        showNotification("Duplicate deleted successfully");
        setDuplicates((prev) => prev.filter((v) => v._id !== id));
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      showNotification("Failed to delete", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleMakePublic = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "publishing" }));
    try {
      const res = await adminAPI.makePublicDuplicate(id);
      if (res.data.success) {
        showNotification("Video is now public");
        setDuplicates((prev) => prev.filter((v) => v._id !== id));
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      showNotification("Failed to make public", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleKeep = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "keeping" }));
    try {
      const res = await adminAPI.keepDuplicate(id);
      if (res.data.success) {
        showNotification("Video marked as unique and made public");
        setDuplicates((prev) => prev.filter((v) => v._id !== id));
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      showNotification("Failed to update", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected duplicates? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await adminAPI.bulkDeleteDuplicates(selectedIds);
      if (res.data.success) {
        showNotification(res.data.message);
        setSelectedIds([]);
        fetchDuplicates(pagination.page, activeFilter);
      }
    } catch (error) {
      showNotification("Bulk delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will remove all duplicate flags (videos won't be deleted). Continue?")) return;
    setLoading(true);
    try {
      const res = await adminAPI.clearAllDuplicates();
      if (res.data.success) {
        showNotification(res.data.message);
        fetchDuplicates(1, activeFilter);
      }
    } catch (error) {
      showNotification("Failed to clear flags", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === duplicates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(duplicates.map((d) => d._id));
    }
  };

  const getReasonBadge = (reason) => {
    const badges = {
      title: { label: "Matching Title", color: "#e74c3c" },
      duration: { label: "Matching Duration", color: "#f39c12" },
      file: { label: "Matching File", color: "#9b59b6" },
      thumbnail: { label: "Matching Thumbnail", color: "#3498db" },
    };
    const badge = badges[reason] || { label: reason, color: "#95a5a6" };
    return (
      <span
        key={reason}
        className="dup-reason-badge"
        style={{ backgroundColor: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="dup-page-wrapper">
      <AdminSidebar />
      <div className="dup-main-content">
        {/* Notification */}
        {notification && (
          <div className={`dup-notification dup-notification-${notification.type}`}>
            {notification.type === "success" ? "✅" : "❌"} {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="dup-header">
          <div className="dup-header-left">
            <h1>📌 Duplicate Videos</h1>
            <p className="dup-subtitle">
              Manage duplicate videos detected during bulk uploads
            </p>
          </div>
          <div className="dup-header-actions">
            <button
              className="dup-btn dup-btn-scan"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <span className="dup-spinner"></span> Scanning...
                </>
              ) : (
                <>🔍 Scan for Duplicates</>
              )}
            </button>
            {stats.total > 0 && (
              <button className="dup-btn dup-btn-clear" onClick={handleClearAll}>
                🧹 Clear All Flags
              </button>
            )}
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="dup-scan-result">
            <strong>Last Scan Result:</strong> Found {scanResult.duplicatesFound} duplicates
            out of {scanResult.totalScanned} videos scanned.
          </div>
        )}

        {/* Stats Cards */}
        <div className="dup-stats-grid">
          <div
            className={`dup-stat-card ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            <div className="dup-stat-number">{stats.total}</div>
            <div className="dup-stat-label">Total Duplicates</div>
          </div>
          <div
            className={`dup-stat-card dup-stat-title ${activeFilter === "title" ? "active" : ""}`}
            onClick={() => setActiveFilter("title")}
          >
            <div className="dup-stat-number">{stats.byTitle}</div>
            <div className="dup-stat-label">Matching Title</div>
          </div>
          <div
            className={`dup-stat-card dup-stat-duration ${activeFilter === "duration" ? "active" : ""}`}
            onClick={() => setActiveFilter("duration")}
          >
            <div className="dup-stat-number">{stats.byDuration}</div>
            <div className="dup-stat-label">Matching Duration</div>
          </div>
          <div
            className={`dup-stat-card dup-stat-file ${activeFilter === "file" ? "active" : ""}`}
            onClick={() => setActiveFilter("file")}
          >
            <div className="dup-stat-number">{stats.byFile}</div>
            <div className="dup-stat-label">Matching File</div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="dup-bulk-bar">
            <span>{selectedIds.length} selected</span>
            <button className="dup-btn dup-btn-danger" onClick={handleBulkDelete}>
              🗑️ Delete Selected ({selectedIds.length})
            </button>
            <button
              className="dup-btn dup-btn-secondary"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Duplicate List */}
        <div className="dup-list-container">
          {loading ? (
            <div className="dup-loading">
              <div className="dup-spinner-large"></div>
              <p>Loading duplicates...</p>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="dup-empty">
              <div className="dup-empty-icon">✨</div>
              <h3>No Duplicates Found</h3>
              <p>
                {activeFilter !== "all"
                  ? `No duplicates matching by ${activeFilter}. Try "All" filter or run a scan.`
                  : 'Your library is clean! Click "Scan for Duplicates" to check.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="dup-list-header">
                <label className="dup-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === duplicates.length && duplicates.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Select All ({duplicates.length})
                </label>
              </div>

              {/* Video Cards */}
              {duplicates.map((video) => (
                <div
                  key={video._id}
                  className={`dup-video-card ${selectedIds.includes(video._id) ? "selected" : ""}`}
                >
                  <div className="dup-video-select">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(video._id)}
                      onChange={() => toggleSelect(video._id)}
                    />
                  </div>

                  <div className="dup-video-thumb">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} />
                    ) : (
                      <div className="dup-thumb-placeholder">🎬</div>
                    )}
                    <span className="dup-duration-badge">
                      {video.duration || formatDuration(video.duration_seconds)}
                    </span>
                  </div>

                  <div className="dup-video-info">
                    <h3 className="dup-video-title">{video.title}</h3>

                    <div className="dup-video-meta">
                      <span>📁 {video.file_code}</span>
                      <span>👁️ {video.views || 0} views</span>
                      <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
                      <span className="dup-status-badge dup-status-private">
                        🔒 Private
                      </span>
                    </div>

                    <div className="dup-reasons">
                      <strong>Duplicate because:</strong>
                      {video.duplicateReasons &&
                        video.duplicateReasons.map((reason) => getReasonBadge(reason))}
                    </div>

                    {/* Original Video Reference */}
                    {video.duplicateOf && (
                      <div className="dup-original-ref">
                        <span className="dup-original-label">↳ Original:</span>
                        <span className="dup-original-title">
                          {typeof video.duplicateOf === "object"
                            ? video.duplicateOf.title || "Unknown"
                            : "Loading..."}
                        </span>
                        {typeof video.duplicateOf === "object" && video.duplicateOf.status && (
                          <span
                            className={`dup-status-badge dup-status-${video.duplicateOf.status}`}
                          >
                            {video.duplicateOf.status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dup-video-actions">
                    <button
                      className="dup-action-btn dup-action-keep"
                      onClick={() => handleKeep(video._id)}
                      disabled={!!actionLoading[video._id]}
                      title="Mark as unique & make public"
                    >
                      {actionLoading[video._id] === "keeping" ? "..." : "✅ Keep"}
                    </button>
                    <button
                      className="dup-action-btn dup-action-public"
                      onClick={() => handleMakePublic(video._id)}
                      disabled={!!actionLoading[video._id]}
                      title="Make this video public"
                    >
                      {actionLoading[video._id] === "publishing" ? "..." : "🌐 Public"}
                    </button>
                    <button
                      className="dup-action-btn dup-action-delete"
                      onClick={() => handleDelete(video._id, video.title)}
                      disabled={!!actionLoading[video._id]}
                      title="Delete this duplicate"
                    >
                      {actionLoading[video._id] === "deleting" ? "..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="dup-pagination">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchDuplicates(pagination.page - 1)}
                  >
                    ← Prev
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchDuplicates(pagination.page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuplicateManager;