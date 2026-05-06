// src/pages/public/FreePage.jsx
// Free & Desi content hub page

import React, { useState, useEffect, useRef } from 'react';
import { Helmet }       from 'react-helmet-async';
import { Link }         from 'react-router-dom';
import { FiZap, FiHash, FiTrendingUp } from 'react-icons/fi';

import { publicAPI }    from '../../services/api';
import { FREE_CONTENT_TAGS } from '../../config/studios';
import VideoGrid        from '../../components/video/VideoGrid';
import TrendingTags     from '../../components/home/TrendingTags';
import { useIntersection } from '../../hooks/useIntersection';

const FREE_TABS = [
  { id: 'latest',  label: 'Latest',   icon: <FiZap className="w-3.5 h-3.5" /> },
  { id: 'desi',    label: 'Desi',     icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'indian',  label: 'Indian',   icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'mms',     label: 'MMS',      icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'college', label: 'College',  icon: <FiHash className="w-3.5 h-3.5" /> },
  { id: 'amateur', label: 'Amateur',  icon: <FiHash className="w-3.5 h-3.5" /> },
];

const FreePage = () => {
  const [activeTab, setActiveTab]   = useState('latest');
  const [videos,    setVideos]      = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);
  const [page,      setPage]        = useState(1);
  const [hasMore,   setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const [infiniteRef, isNearBottom] = useIntersection({
    rootMargin: '400px',
    triggerOnce: false,
  });

  // ── Fetch on tab change ────────────────────────────────────
  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasMore(true);
    fetchVideos(activeTab, 1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Infinite scroll ────────────────────────────────────────
  useEffect(() => {
    if (!isNearBottom || loadingMore || loading || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    fetchVideos(activeTab, next, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearBottom]);

  const fetchVideos = async (tab, pg, reset) => {
    if (reset) setLoading(true);
    setError(null);
    try {
      let res;
      if (tab === 'latest') {
        res = await publicAPI.getLatestVideos?.(16, pg)
          || await publicAPI.getVideos({ page: pg, limit: 16, status: 'public' });
      } else {
        res = await publicAPI.searchByTag(tab, { page: pg, limit: 16 });
      }

      const data  = res?.data?.videos || res?.data || [];
      const total = res?.data?.totalPages || 1;

      if (!mountedRef.current) return;

      if (reset) {
        setVideos(Array.isArray(data) ? data : []);
      } else {
        setVideos((p) => [...p, ...(Array.isArray(data) ? data : [])]);
      }
      setPage(pg);
      setHasMore(pg < total && data.length === 16);
    } catch (err) {
      if (mountedRef.current) setError('Failed to load videos');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Free Videos — Desi, Indian MMS & Amateur | Xmaster</title>
        <meta name="description" content="Watch free desi and Indian videos on Xmaster." />
      </Helmet>

      <div className="min-h-screen bg-dark-400">

        {/* ── Page header ────────────────────────────────────── */}
        <div className="
          relative bg-gradient-to-b from-dark-500 to-dark-400
          border-b border-white/5 py-10 sm:py-12
        ">
          <div className="
            absolute top-0 left-1/2 -translate-x-1/2
            w-80 h-80 rounded-full
            bg-emerald-500/5 blur-3xl pointer-events-none
          " />

          <div className="container-site relative z-10 text-center">
            <div className="
              inline-flex items-center justify-center
              w-14 h-14 rounded-2xl mb-4
              bg-emerald-500/15 border border-emerald-500/20
            ">
              <FiZap className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Free Videos
            </h1>
            <p className="text-white/50 mb-6 max-w-sm mx-auto">
              Desi, Indian MMS, amateur and more — all free
            </p>

            {/* Tab row */}
            <div className="
              flex items-center justify-center
              flex-wrap gap-2
            ">
              {FREE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5
                    px-4 py-2 rounded-xl text-sm font-semibold
                    border transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-white/50 border-white/8 hover:bg-white/10 hover:text-white'
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

          {/* Tags cloud */}
          <div className="mb-8">
            <TrendingTags
              title="Popular Tags"
              maxTags={16}
              compact
            />
          </div>

          {/* Video grid */}
          <VideoGrid
            videos={videos}
            loading={loading}
            error={error}
            onRetry={() => fetchVideos(activeTab, 1, true)}
            skeletonCount={16}
            showDate
            emptyTitle="No videos found"
            emptyMessage="Try a different category or check back later."
          />

          {/* Infinite scroll sentinel */}
          {!loading && hasMore && (
            <div ref={infiniteRef} className="h-4 mt-4" />
          )}

          {/* Loading more */}
          {loadingMore && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-3 text-sm text-white/40">
                <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
                Loading more...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FreePage;