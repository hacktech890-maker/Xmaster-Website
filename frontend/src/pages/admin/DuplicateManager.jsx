// src/pages/admin/DuplicateManager.jsx
// Modern duplicate video detection and cleanup
// Preserves: all existing adminAPI duplicate calls

import React, { useState, useEffect, useRef } from 'react';
import {
  FiCopy, FiTrash2, FiEye, FiRefreshCw,
  FiCheckSquare, FiSquare, FiAlertTriangle,
  FiCheck, FiZap,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI }    from '../../services/api';
import AdminLayout     from '../../components/admin/AdminLayout';
import LoadingSpinner  from '../../components/common/LoadingSpinner';
import { getThumbnailUrl, formatViewsShort, truncateText } from '../../utils/helpers';

// ============================================================
// DUPLICATE MANAGER
// ============================================================

const DuplicateManager = () => {
  const [duplicates,  setDuplicates]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [scanning,    setScanning]    = useState(false);
  const [processing,  setProcessing]  = useState(null);
  const [selected,    setSelected]    = useState(new Set());
  const [bulkAction,  setBulkAction]  = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { fetchDuplicates(); }, []);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res  = await adminAPI.getDuplicates();
      const data = res?.data?.duplicates || res?.data || [];
      if (mountedRef.current) setDuplicates(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load duplicates');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res  = await adminAPI.scanDuplicates();
      const data = res?.data?.duplicates || res?.data || [];
      if (mountedRef.current) {
        setDuplicates(Array.isArray(data) ? data : []);
        toast.success(`Scan complete: ${data.length} duplicate group(s) found`);
      }
    } catch {
      toast.error('Scan failed');
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  };

  const handleDelete = async (id) => {
    setProcessing(id);
    try {
      await adminAPI.deleteDuplicate(id);
      setDuplicates((p) => p.filter((d) => d._id !== id));
      toast.success('Duplicate deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handlePublish = async (id) => {
    setProcessing(id);
    try {
      await adminAPI.publishDuplicate(id);
      setDuplicates((p) => p.map((d) =>
        d._id === id ? { ...d, status: 'public' } : d
      ));
      toast.success('Video published');
    } catch {
      toast.error('Failed to publish');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    setBulkAction('deleting');
    try {
      await adminAPI.bulkDeleteDuplicates([...selected]);
      setDuplicates((p) => p.filter((d) => !selected.has(d._id)));
      setSelected(new Set());
      toast.success(`${selected.size} duplicate(s) deleted`);
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      if (mountedRef.current) setBulkAction(null);
    }
  };

  const handlePublishAll = async () => {
    setBulkAction('publishing');
    try {
      await adminAPI.publishAllDuplicates();
      await fetchDuplicates();
      toast.success('All duplicates published');
    } catch {
      toast.error('Failed to publish all');
    } finally {
      if (mountedRef.current) setBulkAction(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected((p) => {
      const next = new Set(p);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === duplicates.length) setSelected(new Set());
    else setSelected(new Set(duplicates.map((d) => d._id)));
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AdminLayout
      title={`Duplicates ${duplicates.length > 0 ? `(${duplicates.length})` : ''}`}
      actions={
        <button
          onClick={handleScan}
          disabled={scanning}
          className="
            flex items-center gap-2
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-primary-600/15 text-primary-400
            border border-primary-600/25
            hover:bg-primary-600/25
            disabled:opacity-50
            transition-all duration-200
          "
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      }
    >
      <div className="space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Groups', value: duplicates.length, color: 'text-primary-400' },
            { label: 'Total Videos', value: duplicates.reduce((a, d) => a + (d.count || 1), 0), color: 'text-amber-400' },
            { label: 'Selected',     value: selected.size,     color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-white/35 mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bulk actions */}
        {duplicates.length > 0 && (
          <div className="glass-panel rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <button onClick={toggleSelectAll} className="text-white/40 hover:text-white text-xs flex items-center gap-2 transition-colors">
              {selected.size === duplicates.length
                ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
                : <FiSquare      className="w-4 h-4" />
              }
              {selected.size === duplicates.length ? 'Deselect All' : 'Select All'}
            </button>

            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkAction === 'deleting'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 disabled:opacity-50 transition-all duration-200"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Delete {selected.size} Selected
              </button>
            )}

            <button
              onClick={handlePublishAll}
              disabled={bulkAction === 'publishing'}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 disabled:opacity-50 transition-all duration-200"
            >
              <FiZap className="w-3.5 h-3.5" />
              Publish All
            </button>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="glass-panel rounded-2xl p-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading duplicates..." />
          </div>
        )}

        {!loading && duplicates.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FiCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-bold text-white/60 mb-1">No Duplicates Found</p>
            <p className="text-sm text-white/30">
              Run a scan to check for duplicate videos in your library.
            </p>
          </div>
        )}

        {!loading && duplicates.length > 0 && (
          <div className="space-y-3">
            {duplicates.map((dup) => (
              <div
                key={dup._id}
                className={`
                  glass-panel rounded-xl overflow-hidden
                  transition-all duration-200
                  ${selected.has(dup._id) ? 'border-primary-600/30' : ''}
                  ${processing === dup._id ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  {/* Select */}
                  <button
                    onClick={() => toggleSelect(dup._id)}
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    {selected.has(dup._id)
                      ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
                      : <FiSquare      className="w-4 h-4" />
                    }
                  </button>

                  {/* Thumb */}
                  <div className="w-16 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-dark-300">
                    <img
                      src={getThumbnailUrl(dup)}
                      alt={dup.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">
                      {dup.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-mono text-white/30">
                        {dup.file_code || dup.fileCode}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        {dup.count || dup.duplicateCount || '?'} copies
                      </span>
                      <span className="text-[10px] text-white/30">
                        {formatViewsShort(dup.views)} views
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`
                    px-2 py-px rounded-full text-[10px] font-bold border flex-shrink-0
                    ${dup.status === 'public'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                      : 'bg-gray-500/15 text-gray-400 border-gray-500/25'
                    }
                  `}>
                    {dup.status || 'private'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {dup.status !== 'public' && (
                      <button
                        onClick={() => handlePublish(dup._id)}
                        disabled={processing === dup._id}
                        title="Publish"
                        className="p-1.5 rounded-lg text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-all duration-150"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(dup._id)}
                      disabled={processing === dup._id}
                      title="Delete"
                      className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all duration-150"
                    >
                      {processing === dup._id
                        ? <span className="w-3.5 h-3.5 rounded-full border border-red-400/30 border-t-red-400 animate-spin block" />
                        : <FiTrash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default DuplicateManager;