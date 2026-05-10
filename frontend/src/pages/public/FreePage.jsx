// src/pages/public/FreePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet }    from 'react-helmet-async';
import { FiZap, FiHash } from 'react-icons/fi';

import { publicAPI }  from '../../services/api';
import VideoGrid      from '../../components/video/VideoGrid';
import VideoCard      from '../../components/video/VideoCard';
import Pagination     from '../../components/common/Pagination';
import TrendingTags   from '../../components/home/TrendingTags';
import AdSlot         from '../../components/ads/AdSlot';

const PAGE_SIZE = 24;

// Ad after every 8 cards = 2 rows on desktop (4-col grid)
//                        = 4 rows on mobile  (2-col grid)
// Same visual frequency: 1 ad per ~2 visible rows everywhere
const AD_INTERVAL = 8;

const FREE_TABS = [
  { id: 'latest',  label: 'Latest',  icon: <FiZap  className="w-3.5 h-3.5" /> },
  { id: 'desi',    label: 'Desi',    icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'indian',  label: 'Indian',  icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'mms',     label: 'MMS',     icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'college', label: 'College', icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'amateur', label: 'Amateur', icon: <FiHash className="w-3.5 h-3.5" /> },
];

// ============================================================
// VIDEO GRID WITH ADS
// Inserts an AdSlot after every AD_INTERVAL video cards.
// Spans full grid width at every breakpoint.
// Falls back to plain VideoGrid for loading/empty/error states.
// ============================================================
const VideoGridWithAds = ({ videos, loading, error, onRetry, skeletonCount }) => {
  // Delegate loading / error / empty states to VideoGrid
  if (loading || error || !videos || videos.length === 0) {
    return (
      <VideoGrid
        videos={videos || []}
        loading={loading}
        error={error}
        onRetry={onRetry}
        skeletonCount={skeletonCount}
        columns="default"
        showDate
        emptyTitle="No videos found"
        emptyMessage="Try a different category or check back later."
      />
    );
  }

  // Build interleaved item list
  const items = [];
  videos.forEach((video, i) => {
    items.push({ type: 'video', video, index: i });
    if ((i + 1) % AD_INTERVAL === 0) {
      items.push({ type: 'ad', key: `ad-${i}` });
    }
  });

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {items.map((item) => {
        if (item.type === 'video') {
          return (
            <VideoCard
              key={item.video._id || item.index}
              video={item.video}
              size="default"
              index={item.index}
              showDate
            />
          );
        }
        // Ad row — spans all columns at every breakpoint
        return (
          <div
            key={item.key}
            className="col-span-1 xs:col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-4 flex justify-center py-2"
            style={{ minHeight: 1 }}
          >
            <AdSlot placement="home_grid_insert" delay={2000} label />
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// FREE PAGE
// ============================================================
const FreePage = () => {
  const [activeTab,  setActiveTab]  = useState('latest');
  const [videos,     setVideos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Reset page + fetch when tab changes
  useEffect(() => {
    setPage(1);
    fetchVideos(activeTab, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchVideos = async (tab, pg) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (tab === 'latest') {
        res = await publicAPI.getLatestVideos(PAGE_SIZE, pg);
      } else {
        res = await publicAPI.searchByTag(tab, { page: pg, limit: PAGE_SIZE });
      }
      const data  = res?.data?.videos    || res?.data    || [];
      const pages = res?.data?.totalPages || res?.data?.pages || 1;
      const count = res?.data?.total     || res?.data?.count  || data.length;
      if (!mountedRef.current) return;
      setVideos(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setTotalCount(count);
      setPage(pg);
    } catch {
      if (mountedRef.current) setError('Failed to load videos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // useEffect above handles reset + fetch
  };

  const handlePageChange = (pg) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchVideos(activeTab, pg);
  };

  return (
    <>
      <Helmet>
        <title>Free Videos — Desi, Indian MMS &amp; Amateur | Xmaster</title>
        <meta
          name="description"
          content="Watch free desi and Indian videos on Xmaster."
        />
      </Helmet>

      <div className="min-h-screen bg-dark-400">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-10 sm:py-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="container-site relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-emerald-500/15 border border-emerald-500/20">
              <FiZap className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Free Videos
            </h1>
            <p className="text-white/50 mb-6 max-w-sm mx-auto">
              Desi, Indian MMS, amateur and more — all free
            </p>

            {!loading && totalCount > 0 && (
              <p className="text-xs text-white/30 mb-4">
                {totalCount.toLocaleString()} videos
              </p>
            )}

            {/* Tabs */}
            <div className="flex items-center justify-center flex-wrap gap-2">
              {FREE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl
                    text-sm font-semibold border transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-white/50 border-white/[0.08] hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="container-site py-8">
          <div className="mb-8">
            <TrendingTags title="Popular Tags" maxTags={16} compact />
          </div>

          {/* Ad above the grid */}
          <div className="flex justify-center mb-8">
            <AdSlot placement="category_top" delay={2000} label />
          </div>

          {/* Video grid with interleaved ads */}
          <VideoGridWithAds
            videos={videos}
            loading={loading}
            error={error}
            onRetry={() => fetchVideos(activeTab, page)}
            skeletonCount={PAGE_SIZE}
          />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FreePage;