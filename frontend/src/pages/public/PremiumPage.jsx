// src/pages/public/PremiumPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiStar, FiAward, FiGrid, FiTag, FiRefreshCw } from 'react-icons/fi';

import { publicAPI } from '../../services/api';
import VideoCard     from '../../components/video/VideoCard';
import VideoCardSkeleton from '../../components/video/VideoCardSkeleton';
import Pagination    from '../../components/common/Pagination';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest'   },
  { value: 'views',  label: 'Most Viewed' },
  { value: 'oldest', label: 'Oldest'   },
];

const PAGE_LIMIT = 40;

// ============================================================
// PREMIUM PAGE
// Loads real premium videos from /api/videos/premium
// Loads premium categories from /api/categories?premium=true
// ============================================================
const PremiumPage = () => {
  const [videos,       setVideos]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingCats,  setLoadingCats]  = useState(true);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [sort,         setSort]         = useState('newest');
  const [activeCategory, setActiveCategory] = useState('');  // '' = all premium

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Load premium categories once
  useEffect(() => {
    const load = async () => {
      setLoadingCats(true);
      try {
        const res  = await publicAPI.getPremiumCategories();
        const data = res?.data?.categories || [];
        if (mountedRef.current) setCategories(Array.isArray(data) ? data : []);
      } catch {
        // non-critical — just don't show category tabs
      } finally {
        if (mountedRef.current) setLoadingCats(false);
      }
    };
    load();
  }, []);

  // Load videos whenever page/sort/category changes
  const fetchVideos = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page:  pg,
        limit: PAGE_LIMIT,
        sort,
        ...(activeCategory ? { category: activeCategory } : {}),
      };
      const res  = await publicAPI.getPremiumVideos(params);
      const data = res?.data;
      if (!mountedRef.current) return;
      setVideos(data?.videos    || []);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.total      || 0);
      setPage(pg);
    } catch {
      if (mountedRef.current) setError('Failed to load premium videos.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [sort, activeCategory]);

  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setPage(1);
  };

  const handleSortChange = (s) => {
    setSort(s);
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>Premium Videos — Xmaster</title>
        <meta name="description" content="Browse exclusive premium videos on Xmaster." />
        {/* Prevent search engines from indexing premium content */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-dark-400">
        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-10 sm:py-14">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
          <div className="container-site relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20">
              <FiAward className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Premium Videos
            </h1>
            <p className="text-sm text-white/50 max-w-sm mx-auto mb-1">
              Exclusive content — updated regularly
            </p>
            {totalCount > 0 && (
              <p className="text-xs text-amber-400/70 font-semibold">
                {totalCount.toLocaleString()} premium video{totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="container-site py-8 space-y-6">
          {/* ── Category tabs ── */}
          {!loadingCats && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <CategoryTab
                label="All Premium"
                icon={<FiGrid className="w-3.5 h-3.5" />}
                active={activeCategory === ''}
                onClick={() => handleCategoryChange('')}
              />
              {categories.map((cat) => (
                <CategoryTab
                  key={cat._id}
                  label={cat.name}
                  icon={cat.icon ? <span className="text-sm">{cat.icon}</span> : <FiTag className="w-3.5 h-3.5" />}
                  active={activeCategory === cat._id}
                  onClick={() => handleCategoryChange(cat._id)}
                  count={cat.videoCount}
                />
              ))}
            </div>
          )}

          {/* ── Sort bar ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    sort === opt.value
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchVideos(page)}
              disabled={loading}
              className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 border border-white/[0.08] disabled:opacity-50 transition-all duration-200"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button onClick={() => fetchVideos(1)} className="btn-secondary text-xs">
                Try Again
              </button>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FiStar className="w-7 h-7 text-amber-400/50" />
              </div>
              <p className="text-sm text-white/40 mb-1">No premium videos yet</p>
              <p className="text-xs text-white/25">
                {activeCategory
                  ? 'No videos in this category — try another.'
                  : 'Check back soon for exclusive content.'}
              </p>
              {activeCategory && (
                <button
                  onClick={() => handleCategoryChange('')}
                  className="mt-4 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View all premium videos
                </button>
              )}
            </div>
          )}

          {/* ── Video grid ── */}
          {!loading && !error && videos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(pg) => fetchVideos(pg)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Category tab pill ─────────────────────────────────────────
const CategoryTab = ({ label, icon, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/20'
    }`}
  >
    {icon}
    {label}
    {count != null && count > 0 && (
      <span className={`text-[10px] px-1 rounded ${active ? 'text-amber-300/70' : 'text-white/25'}`}>
        {count}
      </span>
    )}
  </button>
);

export default PremiumPage;