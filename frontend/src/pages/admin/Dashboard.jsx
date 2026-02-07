import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiVideo, FiEye, FiTrendingUp, FiUpload, 
  FiGrid, FiDollarSign, FiFlag, FiArrowRight 
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatViews, formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await adminAPI.getDashboard();
        if (response.data.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const stats = data?.stats || {};
  const topVideos = data?.topVideos || [];
  const recentUploads = data?.recentUploads || [];
  const viewsByDay = data?.viewsByDay || [];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Videos"
          value={stats.totalVideos || 0}
          icon={FiVideo}
          color="primary"
        />
        <StatsCard
          title="Total Views"
          value={formatViews(stats.totalViews || 0)}
          icon={FiEye}
          color="blue"
        />
        <StatsCard
          title="This Week"
          value={stats.weekVideos || 0}
          icon={FiTrendingUp}
          change="videos uploaded"
          color="green"
        />
        <StatsCard
          title="Pending Reports"
          value={stats.pendingReports || 0}
          icon={FiFlag}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h3 className="text-lg font-semibold text-white mb-6">Views & Uploads (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsByDay}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="_id" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e1e', 
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/admin/upload"
              className="flex items-center justify-between p-4 bg-dark-100 hover:bg-dark-300 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <FiUpload className="w-5 h-5 text-primary-500" />
                </div>
                <span className="text-white font-medium">Upload Videos</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/admin/videos"
              className="flex items-center justify-between p-4 bg-dark-100 hover:bg-dark-300 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FiVideo className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-white font-medium">Manage Videos</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/admin/categories"
              className="flex items-center justify-between p-4 bg-dark-100 hover:bg-dark-300 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FiGrid className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-white font-medium">Categories</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/admin/ads"
              className="flex items-center justify-between p-4 bg-dark-100 hover:bg-dark-300 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-white font-medium">Manage Ads</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent & Top Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Videos */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Videos</h3>
          <div className="space-y-3">
            {topVideos.map((video, index) => (
              <div key={video._id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-16 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{video.title}</p>
                  <p className="text-gray-500 text-xs">{formatViews(video.views)} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Uploads</h3>
          <div className="space-y-3">
            {recentUploads.map((video) => (
              <div key={video._id} className="flex items-center gap-3">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-16 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{video.title}</p>
                  <p className="text-gray-500 text-xs">{formatDate(video.uploadDate)}</p>
                </div>
                <span className={`badge ${
                  video.status === 'public' ? 'badge-success' : 'badge-warning'
                }`}>
                  {video.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;