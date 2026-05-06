// src/pages/admin/ReportsPage.jsx
// Modern reports management interface
// Preserves: all existing adminAPI report calls

import React, { useState, useEffect, useRef } from 'react';
import {
  FiFlag, FiCheck, FiX, FiEye,
  FiRefreshCw, FiAlertTriangle,
  FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { adminAPI }    from '../../services/api';
import AdminLayout     from '../../components/admin/AdminLayout';
import Pagination      from '../../components/common/Pagination';
import LoadingSpinner  from '../../components/common/LoadingSpinner';
import { formatDate, getWatchUrl } from '../../utils/helpers';

const STATUS_OPTS = ['all', 'pending', 'reviewed', 'dismissed'];

const ReportsPage = () => {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter,     setFilter]     = useState('all');
  const [processing, setProcessing] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { fetchReports(1); }, [filter]);

  const fetchReports = async (pg = 1) => {
    setLoading(true);
    try {
      const res  = await adminAPI.getReports({
        page: pg, limit: 20,
        status: filter !== 'all' ? filter : undefined,
      });
      const data  = res?.data?.reports || res?.data || [];
      const pages = res?.data?.totalPages || 1;
      if (!mountedRef.current) return;
      setReports(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setPage(pg);
    } catch {
      if (mountedRef.current) toast.error('Failed to load reports');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setProcessing(id);
    try {
      await adminAPI.updateReportStatus(id, { status });
      setReports((p) =>
        p.map((r) => r._id === id ? { ...r, status } : r)
      );
      toast.success(`Report marked as ${status}`);
    } catch {
      toast.error('Failed to update report');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const REASON_COLORS = {
    'Underage content':    'text-red-400    bg-red-500/10    border-red-500/20',
    'Non-consensual':      'text-red-400    bg-red-500/10    border-red-500/20',
    'Copyright violation': 'text-amber-400  bg-amber-500/10  border-amber-500/20',
    'Spam or misleading':  'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Broken video':        'text-blue-400   bg-blue-500/10   border-blue-500/20',
    'default':             'text-white/40   bg-white/5       border-white/10',
  };

  return (
    <AdminLayout title="Reports">
      <div className="space-y-4">

        {/* Filter tabs */}
        <div className="glass-panel rounded-xl p-1 flex gap-1 max-w-md">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize
                transition-all duration-150
                ${filter === s
                  ? 'bg-white/12 text-white'
                  : 'text-white/30 hover:text-white/60'
                }
              `}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Reports list */}
        <div className="glass-panel rounded-2xl overflow-hidden">

          {loading && (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <ReportSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="p-12 text-center">
              <FiFlag className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30">
                No {filter !== 'all' ? filter : ''} reports
              </p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="divide-y divide-white/5">
              {reports.map((report) => {
                const colorClass = REASON_COLORS[report.reason] || REASON_COLORS.default;
                const isPending  = report.status === 'pending';

                return (
                  <div
                    key={report._id}
                    className={`
                      flex items-start gap-4 px-4 py-4
                      hover:bg-white/3 transition-colors
                      ${processing === report._id ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
                      border ${colorClass}
                    `}>
                      <FiFlag className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Reason */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`
                          px-2 py-px rounded-full text-[10px] font-bold border
                          ${colorClass}
                        `}>
                          {report.reason}
                        </span>
                        <span className={`
                          px-2 py-px rounded-full text-[10px] font-bold border
                          ${report.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                            : report.status === 'reviewed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                              : 'bg-gray-500/15 text-gray-400 border-gray-500/25'
                          }
                        `}>
                          {report.status}
                        </span>
                      </div>

                      {/* Video info */}
                      {report.videoId && (
                        <p className="text-xs text-white/40 truncate mb-0.5">
                          Video: {report.videoTitle || report.videoId}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-[10px] text-white/25">
                        Reported {formatDate(report.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* View video */}
                      {report.videoId && (
                        <a
                          href={`/watch/${report.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View video"
                          className="p-1.5 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Mark reviewed */}
                      {isPending && (
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'reviewed')}
                          disabled={processing === report._id}
                          title="Mark as reviewed"
                          className="p-1.5 rounded-lg text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-all duration-150"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dismiss */}
                      {isPending && (
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                          disabled={processing === report._id}
                          title="Dismiss report"
                          className="p-1.5 rounded-lg text-white/25 hover:text-gray-400 hover:bg-white/10 disabled:opacity-50 transition-all duration-150"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(pg) => fetchReports(pg)}
            />
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

const ReportSkeleton = () => (
  <div className="flex items-start gap-4 px-4 py-4 animate-pulse">
    <div className="w-8 h-8 rounded-lg flex-shrink-0 skeleton-shimmer bg-dark-200" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <div className="h-4 w-24 rounded-full skeleton-shimmer bg-dark-200" />
        <div className="h-4 w-16 rounded-full skeleton-shimmer bg-dark-300" />
      </div>
      <div className="h-3 w-48 rounded skeleton-shimmer bg-dark-200" />
      <div className="h-3 w-24 rounded skeleton-shimmer bg-dark-300" />
    </div>
    <div className="flex gap-1.5">
      <div className="w-7 h-7 rounded-lg skeleton-shimmer bg-dark-200" />
      <div className="w-7 h-7 rounded-lg skeleton-shimmer bg-dark-200" />
    </div>
  </div>
);

export default ReportsPage;