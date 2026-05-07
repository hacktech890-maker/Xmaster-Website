// src/pages/public/StudioPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet }          from 'react-helmet-async';
import { FiArrowLeft, FiGrid, FiList } from 'react-icons/fi';

import { publicAPI }       from '../../services/api';
import { getStudioBySlug } from '../../config/studios';
import VideoGrid           from '../../components/video/VideoGrid';
import Pagination          from '../../components/common/Pagination';

const VIDEOS_PER_PAGE = 24;

const StudioPage = () => {
  const { slug } = useParams();
  const studio   = getStudioBySlug(slug);

  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(1);
  const [view,    setView]    = useState('grid');

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    fetchVideos(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchVideos = async (pg) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await publicAPI.getCategoryVideos(slug, { page: pg, limit: VIDEOS_PER_PAGE });
      } catch {
        res = await publicAPI.searchVideos({ q: studio?.name || slug, page: pg, limit: VIDEOS_PER_PAGE });
      }
      const data  = res?.data?.videos || res?.data || [];
      const pages = res?.data?.totalPages || res?.data?.pages || 1;
      if (!mountedRef.current) return;
      setVideos(Array.isArray(data) ? data : []);
      setTotal(pages);
      setPage(pg);
    } catch {
      if (mountedRef.current) setError('Failed to load videos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handlePageChange = (pg) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchVideos(pg);
  };

  const studioName     = studio?.name     || slug;
  const studioGradient = studio?.gradient || 'linear-gradient(135deg, #e11d48, #be123c)';
  const studioBadge    = studio?.badge    || 'STUDIO';

  return (
    <>
      <Helmet>
        <title>{studioName} Videos — Xmaster</title>
        <meta name="description" content={`Watch ${studioName} videos on Xmaster. Premium studio content.`} />
      </Helmet>

      <div className="min-h-screen bg-dark-400">
        <div className="relative py-14 sm:py-20 overflow-hidden" style={{ background: studioGradient }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,0,0,0.3) 0%, transparent 50%)` }} />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-dark-400 to-transparent" />
          <div className="container-site relative z-10">
            <Link to="/premium" className="inline-flex items-center gap-2 mb-6 text-white/60 hover:text-white text-sm transition-colors duration-200">
              <FiArrowLeft className="w-4 h-4" />All Studios
            </Link>
            <div className="flex items-end gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/30 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <span className="font-black text-white text-xl sm:text-2xl text-shadow">{studioName.charAt(0)}</span>
              </div>
              <div>
                <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/30 text-white/80 border border-white/20 backdrop-blur-sm">
                  {studioBadge}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-shadow-lg">{studioName}</h1>
                {!loading && <p className="text-sm text-white/60 mt-1">{total} page{total !== 1 ? 's' : ''} of videos</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/5 bg-dark-500/50">
          <div className="container-site py-3 flex items-center justify-between">
            <p className="text-sm text-white/40">Page {page} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all duration-150 ${view === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                <FiGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all duration-150 ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="container-site py-8">
          <VideoGrid
            videos={videos}
            loading={loading}
            error={error}
            onRetry={() => fetchVideos(page)}
            skeletonCount={VIDEOS_PER_PAGE}
            columns={view === 'list' ? 'wide' : 'default'}
            showDate
            emptyTitle="No videos found"
            emptyMessage={`No ${studioName} videos available yet.`}
          />
          {!loading && total > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination currentPage={page} totalPages={total} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudioPage;