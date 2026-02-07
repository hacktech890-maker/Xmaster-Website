import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiStar, 
  FiEye, FiMoreVertical, FiCheck, FiX, FiPlus 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatViews, formatDate, debounce } from '../../utils/helpers';

const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [featured, setFeatured] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getVideos({
        page,
        limit: 20,
        search,
        status,
        featured,
        sort,
      });
      if (response.data.success) {
        setVideos(response.data.videos);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, featured, sort]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearch(value);
    setPage(1);
  }, 500);

  const handleToggleFeatured = async (video) => {
    try {
      const response = await adminAPI.toggleFeatured(video._id);
      if (response.data.success) {
        setVideos(videos.map(v => 
          v._id === video._id ? { ...v, featured: response.data.featured } : v
        ));
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;

    try {
      await adminAPI.deleteVideo(video._id);
      setVideos(videos.filter(v => v._id !== video._id));
      toast.success('Video deleted successfully');
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    if (!window.confirm(`Delete ${selectedVideos.length} videos? This cannot be undone.`)) return;

    try {
      await adminAPI.bulkDeleteVideos(selectedVideos);
      setVideos(videos.filter(v => !selectedVideos.includes(v._id)));
      setSelectedVideos([]);
      toast.success(`${selectedVideos.length} videos deleted`);
    } catch (error) {
      toast.error('Failed to delete videos');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVideos(videos.map(v => v._id));
    } else {
      setSelectedVideos([]);
    }
  };

  const handleSelectVideo = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  return (
    <AdminLayout title="Videos Manager">
      {/* Actions Bar */}
      <div className="bg-dark-200 rounded-xl p-4 mb-6 border border-dark-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search videos..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>

            <select
              value={featured}
              onChange={(e) => { setFeatured(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Videos</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Most Viewed</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {/* Add Button */}
          <Link to="/admin/upload" className="btn-primary">
            <FiPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Video</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedVideos.length > 0 && (
          <div className="mt-4 flex items-center gap-4 pt-4 border-t border-dark-100">
            <span className="text-gray-400">
              {selectedVideos.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <FiTrash2 className="w-4 h-4 inline mr-2" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Videos Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No videos found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-300">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedVideos.length === videos.length}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Video</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Featured</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id} className="border-t border-dark-100 hover:bg-dark-100/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(video._id)}
                        onChange={() => handleSelectVideo(video._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-24 h-14 object-cover rounded"
                        />
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-xs">{video.title}</p>
                          <p className="text-gray-500 text-sm">{video.file_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-300">
                        <FiEye className="w-4 h-4" />
                        {formatViews(video.views)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        video.status === 'public' ? 'badge-success' :
                        video.status === 'private' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleFeatured(video)}
                        className={`p-2 rounded-lg transition-colors ${
                          video.featured
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-dark-100 text-gray-500 hover:text-yellow-500'
                        }`}
                      >
                        <FiStar className="w-5 h-5" fill={video.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(video.uploadDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingVideo(video)}
                          className="p-2 hover:bg-dark-100 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Edit Modal */}
      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSave={(updatedVideo) => {
            setVideos(videos.map(v => v._id === updatedVideo._id ? updatedVideo : v));
            setEditingVideo(null);
            toast.success('Video updated successfully');
          }}
        />
      )}
    </AdminLayout>
  );
};

// Edit Video Modal
const EditVideoModal = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: video.title || '',
    description: video.description || '',
    tags: video.tags?.join(', ') || '',
    status: video.status || 'public',
    featured: video.featured || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.updateVideo(video._id, {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      if (response.data.success) {
        onSave(response.data.video);
      }
    } catch (error) {
      toast.error('Failed to update video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <h3 className="text-lg font-semibold text-white">Edit Video</h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thumbnail Preview */}
          <div className="flex gap-4">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-40 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">File Code</p>
              <p className="text-white font-mono">{video.file_code}</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="input-field resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Featured</label>
              <label className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-gray-300">Featured on homepage</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideosManager;