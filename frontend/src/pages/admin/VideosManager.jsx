import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiStar, 
  FiEye, FiMoreVertical, FiCheck, FiX, FiPlus,
  FiSend, FiCopy, FiExternalLink, FiCheckCircle,
  FiAlertCircle, FiRefreshCw, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatViews, formatDate, debounce } from '../../utils/helpers';

// ==========================================
// TELEGRAM ICON
// ==========================================
const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// ==========================================
// BULK SHARE TO TELEGRAM PANEL
// ==========================================
const BulkShareTelegram = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [count, setCount] = useState(50);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [currentShareIndex, setCurrentShareIndex] = useState(0);
  const [shareResults, setShareResults] = useState({ sent: 0, failed: 0 });
  const [sharePhase, setSharePhase] = useState('setup'); // setup, preview, sharing, done
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [allCopied, setAllCopied] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getTGShareStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load share stats');
    }
  };

  const handleFetchVideos = async () => {
    if (count < 1) {
      toast.error('Enter a number greater than 0');
      return;
    }
    setFetching(true);
    try {
      const res = await adminAPI.fetchTGShareVideos(count);
      if (res.data.success) {
        setVideos(res.data.videos);
        setSharePhase('preview');
        if (res.data.videos.length === 0) {
          toast('No eligible videos found', { icon: '📭' });
        } else {
          toast.success(`Found ${res.data.videos.length} eligible videos`);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch videos');
    } finally {
      setFetching(false);
    }
  };

  const copyShareUrl = async (url, index) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 1500);
    } catch (e) {
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 1500);
    }
  };

  const copyAllUrls = async () => {
    const allUrls = videos.map(v => v.shareUrl).join('\n');
    try {
      await navigator.clipboard.writeText(allUrls);
      setAllCopied(true);
      toast.success(`Copied ${videos.length} URLs to clipboard`);
      setTimeout(() => setAllCopied(false), 3000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = allUrls;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setAllCopied(true);
      toast.success(`Copied ${videos.length} URLs to clipboard`);
      setTimeout(() => setAllCopied(false), 3000);
    }
  };

  const openInWebpageBot = (url) => {
    // Open Telegram with @WebpageBot and the URL
    window.open(`https://t.me/WebpageBot?start=${encodeURIComponent(url)}`, '_blank');
  };

  const startBulkShare = async () => {
    setSharePhase('sharing');
    setSharing(true);
    setCurrentShareIndex(0);
    setShareResults({ sent: 0, failed: 0 });

    const batchSize = 5;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, Math.min(i + batchSize, videos.length));

      for (let j = 0; j < batch.length; j++) {
        setCurrentShareIndex(i + j);

        try {
          // Open each URL in @WebpageBot to generate preview
          // We use a small delay between each to avoid rate limiting
          window.open(
            `https://t.me/WebpageBot?start=${encodeURIComponent(batch[j].shareUrl)}`,
            '_blank',
            'noopener,noreferrer,width=1,height=1'
          );
          sent++;
        } catch (e) {
          failed++;
        }

        // Small delay between shares
        if (j < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setShareResults({ sent, failed });

      // Delay between batches
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Mark all as shared
    try {
      const ids = videos.map(v => v._id);
      await adminAPI.markTGShared(ids);
    } catch (e) {
      console.error('Failed to mark as shared:', e);
    }

    setSharing(false);
    setSharePhase('done');
    setShareResults({ sent, failed });
    fetchStats();
    toast.success(`Shared ${sent} videos to Telegram!`);
  };

  const markAllAsShared = async () => {
    try {
      const ids = videos.map(v => v._id);
      await adminAPI.markTGShared(ids);
      toast.success(`Marked ${ids.length} videos as shared on Telegram`);
      fetchStats();
      setSharePhase('done');
    } catch (error) {
      toast.error('Failed to mark as shared');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-dark-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0088cc] rounded-xl flex items-center justify-center">
              <TelegramIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Share to Telegram</h3>
              <p className="text-sm text-gray-400">Send video links to @WebpageBot for preview generation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 p-5 bg-dark-300 border-b border-dark-100 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.eligible}</p>
              <p className="text-xs text-gray-400">Eligible to Share</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.alreadyShared}</p>
              <p className="text-xs text-gray-400">Already Shared</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.totalPublic}</p>
              <p className="text-xs text-gray-400">Total Public</p>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* SETUP PHASE */}
          {sharePhase === 'setup' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How many videos to share?
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                    className="flex-1 px-4 py-3 bg-dark-100 border border-dark-100 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#0088cc]"
                    placeholder="Enter number of videos..."
                  />
                  <button
                    onClick={handleFetchVideos}
                    disabled={fetching || count < 1}
                    className="px-6 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {fetching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FiSearch className="w-5 h-5" />
                        Fetch Videos
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Only public, non-duplicate videos that haven't been shared yet will be selected.
                  Videos are selected oldest first.
                </p>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 200, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      count === n
                        ? 'bg-[#0088cc] text-white'
                        : 'bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-dark-100 rounded-xl p-4 space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-[#0088cc]" />
                  How it works
                </h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Enter the number of videos you want to share</li>
                  <li>Click "Fetch Videos" to load eligible videos</li>
                  <li>Review the list and click "Copy All URLs"</li>
                  <li>Paste the URLs into @WebpageBot on Telegram (one by one or use a bot)</li>
                  <li>Click "Mark All as Shared" to prevent re-sharing</li>
                </ol>
              </div>
            </div>
          )}

          {/* PREVIEW PHASE */}
          {sharePhase === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">
                  {videos.length} Videos Ready to Share
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSharePhase('setup'); setVideos([]); }}
                    className="px-3 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={copyAllUrls}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      allCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-[#0088cc] hover:bg-[#0077b5] text-white'
                    }`}
                  >
                    {allCopied ? (
                      <><FiCheck className="w-4 h-4" /> All Copied!</>
                    ) : (
                      <><FiCopy className="w-4 h-4" /> Copy All URLs</>
                    )}
                  </button>
                </div>
              </div>

              {/* Video List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {videos.map((video, index) => (
                  <div
                    key={video._id}
                    className="flex items-center gap-3 p-3 bg-dark-100 rounded-xl hover:bg-dark-300 transition-colors"
                  >
                    <span className="text-gray-500 text-sm font-mono w-8 text-right flex-shrink-0">
                      {index + 1}
                    </span>
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-16 h-10 object-cover rounded flex-shrink-0 bg-dark-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{video.title}</p>
                      <p className="text-gray-500 text-xs truncate">{video.shareUrl}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => copyShareUrl(video.shareUrl, index)}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          copiedIndex === index
                            ? 'bg-green-500/20 text-green-400'
                            : 'hover:bg-dark-200 text-gray-400 hover:text-white'
                        }`}
                        title="Copy URL"
                      >
                        {copiedIndex === index ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      </button>
                      <a
                        href={video.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Open share page"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-dark-100">
                <button
                  onClick={markAllAsShared}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  Mark All as Shared ({videos.length})
                </button>
                <button
                  onClick={startBulkShare}
                  className="flex-1 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiSend className="w-5 h-5" />
                  Open All in @WebpageBot
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                💡 Recommended: Copy all URLs, paste them into @WebpageBot one by one, then click "Mark All as Shared"
              </p>
            </div>
          )}

          {/* SHARING PHASE */}
          {sharePhase === 'sharing' && (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 mx-auto bg-[#0088cc]/20 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#0088cc]/30 border-t-[#0088cc] rounded-full animate-spin" />
              </div>
              <div>
                <h4 className="text-white text-lg font-semibold mb-2">Opening in @WebpageBot...</h4>
                <p className="text-gray-400">
                  {currentShareIndex + 1} / {videos.length} videos
                </p>
              </div>
              <div className="w-full h-3 bg-dark-100 rounded-full overflow-hidden max-w-md mx-auto">
                <div
                  className="h-full bg-[#0088cc] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentShareIndex + 1) / videos.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Sent: {shareResults.sent} | Failed: {shareResults.failed}
              </p>
            </div>
          )}

          {/* DONE PHASE */}
          {sharePhase === 'done' && (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h4 className="text-white text-lg font-semibold mb-2">Sharing Complete!</h4>
                <p className="text-gray-400">
                  {videos.length} videos have been marked as shared on Telegram
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setSharePhase('setup'); setVideos([]); fetchStats(); }}
                  className="px-6 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  Share More Videos
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-dark-100 hover:bg-dark-300 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN VIDEOS MANAGER
// ==========================================
const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showTGShare, setShowTGShare] = useState(false);
  
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
      {/* Telegram Share Modal */}
      {showTGShare && (
        <BulkShareTelegram onClose={() => { setShowTGShare(false); fetchVideos(); }} />
      )}

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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowTGShare(true)}
              className="px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <TelegramIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Bulk Share TG</span>
            </button>
            <Link to="/admin/upload" className="btn-primary">
              <FiPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Video</span>
            </Link>
          </div>
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
                      checked={selectedVideos.length === videos.length && videos.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Video</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">TG</th>
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
                          onError={(e) => { e.target.style.display = 'none'; }}
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
                      {video.sharedOnTG ? (
                        <span className="flex items-center gap-1 text-[#0088cc] text-xs font-medium">
                          <FiCheckCircle className="w-4 h-4" />
                          Shared
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
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

// ==========================================
// EDIT VIDEO MODAL (unchanged)
// ==========================================
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
          <div className="flex gap-4">
            <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">File Code</p>
              <p className="text-white font-mono">{video.file_code}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="tag1, tag2, tag3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Featured</label>
              <label className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg cursor-pointer">
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded" />
                <span className="text-gray-300">Featured on homepage</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideosManager;