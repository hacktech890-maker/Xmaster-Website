import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFlag, FiCheck, FiX, FiExternalLink, FiFilter, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusCounts, setStatusCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getReports({
        status: statusFilter,
        page,
        limit: 20,
      });
      if (response.data.success) {
        setReports(response.data.reports);
        setPagination(response.data.pagination);
        setStatusCounts(response.data.statusCounts || {});
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, status) => {
    try {
      const response = await adminAPI.updateReport(reportId, { status });
      if (response.data.success) {
        setReports(reports.map(r => 
          r._id === reportId ? { ...r, status } : r
        ));
        toast.success('Report updated');
        setSelectedReport(null);
      }
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  const reasonLabels = {
    broken: 'Video is broken',
    copyright: 'Copyright violation',
    inappropriate: 'Inappropriate content',
    spam: 'Spam or misleading',
    misleading: 'Misleading content',
    other: 'Other',
  };

  const statusColors = {
    pending: 'badge-warning',
    reviewing: 'badge-primary',
    resolved: 'badge-success',
    dismissed: 'badge-danger',
  };

  return (
    <AdminLayout title="Reports">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={statusCounts.pending || 0} color="yellow" />
        <StatCard label="Reviewing" value={statusCounts.reviewing || 0} color="blue" />
        <StatCard label="Resolved" value={statusCounts.resolved || 0} color="green" />
        <StatCard label="Dismissed" value={statusCounts.dismissed || 0} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-dark-200 rounded-xl p-4 mb-6 border border-dark-100">
        <div className="flex items-center gap-4">
          <FiFilter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !statusFilter
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {['pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-100 text-gray-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FiFlag className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {reports.map((report) => (
              <div key={report._id} className="p-4 hover:bg-dark-100/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Video Thumbnail */}
                  {report.videoId && (
                    <Link
                      to={`/watch/${report.videoId._id}`}
                      target="_blank"
                      className="w-24 h-14 bg-dark-100 rounded overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={report.videoId.thumbnail}
                        alt={report.videoId.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-white font-medium">
                          {report.videoId?.title || 'Video Deleted'}
                        </h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Reason: <span className="text-gray-300">{reasonLabels[report.reason] || report.reason}</span>
                        </p>
                        {report.description && (
                          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`badge ${statusColors[report.status]}`}>
                          {report.status}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report._id, 'reviewing')}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded text-sm transition-colors"
                          >
                            Start Review
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                            className="px-3 py-1.5 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded text-sm transition-colors"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status === 'reviewing' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report._id, 'resolved')}
                            className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded text-sm transition-colors"
                          >
                            <FiCheck className="w-4 h-4 inline mr-1" />
                            Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                            className="px-3 py-1.5 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded text-sm transition-colors"
                          >
                            <FiX className="w-4 h-4 inline mr-1" />
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.videoId && (
                        <Link
                          to={`/watch/${report.videoId._id}`}
                          target="_blank"
                          className="px-3 py-1.5 bg-dark-100 text-gray-400 hover:text-white rounded text-sm transition-colors"
                        >
                          <FiExternalLink className="w-4 h-4 inline mr-1" />
                          View Video
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-dark-100">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

// Stat Card
const StatCard = ({ label, value, color }) => {
  const colors = {
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
  };

  return (
    <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </div>
  );
};

export default ReportsPage;