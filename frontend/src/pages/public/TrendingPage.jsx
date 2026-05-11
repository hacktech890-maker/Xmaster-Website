// src/pages/public/TrendingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet }    from 'react-helmet-async';
import { FiTrendingUp, FiClock, FiCalendar } from 'react-icons/fi';

import { publicAPI } from '../../services/api';
import VideoGrid     from '../../components/video/VideoGrid';
import Pagination    from '../../components/common/Pagination';
import TrendingTags  from '../../components/home/TrendingTags';
import { sessionShuffleTail } from '../../utils/shuffle';

const PERIODS = [
  { id: '24h', label: '24 Hours', icon: <FiClock    className="w-3.5 h-3.5" /> },
  { id: '7d',  label: '7 Days',   icon: <FiCalendar className="w-3.5 h-3.5" /> },
  { id: '30d', label: '30 Days',  icon: <FiCalendar className="w-3.5 h-3.5" /> },
];

const LIMITS = [24, 48, 96];

const TrendingPage = () => {
  const [period,     setPeriod]     = useState('7d');
  const [limit,      setLimit]      = useState(24);
  const [videos,     setVideos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    setPage(1);
    fetchTrending(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, limit]);

  const fetchTrending = async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res   = await publicAPI.getTrendingVideos(limit, period, pg);
      const data  = res?.data?.videos  || res?.data  || [];
      const pages = res?.data?.totalPages || res?.data?.pages || 1;
      const count = res?.data?.total   || res?.data?.count  || data.length;
      if (mountedRef.current) {
        // Keep top 4 trending in place, shuffle the rest for freshness
        const shuffled = pg === 1
          ? sessionShuffleTail(Array.isArray(data) ? data : [], 4, `trending_${period}_${pg}`)
          : (Array.isArray(data) ? data : []);
        setVideos(shuffled);
        setTotalPages(pages);
        setTotalCount(count);
        setPage(pg);
      }
    } catch {
      if (mountedRef.current) setError('Failed to load trending videos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handlePageChange = (pg) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchTrending(pg);
  };

  const handlePeriodChange = (p) => { setPeriod(p); setPage(1); };
  const handleLimitChange  = (l) => { setLimit(l);  setPage(1); };

  return (
    <>
      <Helmet>
        <title>Trending Videos — Xmaster</title>
        <meta name="description" content="Watch the most trending adult videos on Xmaster right now." />
      </Helmet>

      <div className="min-h-screen bg-dark-400">
        <div className="relative bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-10 sm:py-14 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary-600/6 blur-3xl pointer-events-none" />

          <div className="container-site relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/15 border border-primary-600/20 flex items-center justify-center">
                    <FiTrendingUp className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Trending Now</h1>
                    <p className="text-sm text-white/40 mt-0.5">
                      {!loading && totalCount > 0 ? `${totalCount.toLocaleString()} videos` : 'Most watched videos'}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.08]">
                  {PERIODS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePeriodChange(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        period === p.id
                          ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {p.icon}{p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs text-white/30 font-medium">Show:</span>
                {LIMITS.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLimitChange(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      limit === l
                        ? 'bg-white/10 text-white border-white/20'
                        : 'text-white/30 border-white/[0.08] hover:text-white/60'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container-site pt-6 pb-2">
          <TrendingTags title="" maxTags={15} compact />
        </div>

        <div className="container-site py-6">
          <VideoGrid
            videos={videos}
            loading={loading}
            error={error}
            onRetry={() => fetchTrending(page)}
            skeletonCount={limit}
            columns="default"
            emptyTitle="No trending videos"
            emptyMessage="Check back soon — trending videos will appear here."
          />

          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrendingPage;