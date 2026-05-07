// src/pages/public/CategoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet }          from 'react-helmet-async';
import { FiGrid, FiList, FiArrowLeft } from 'react-icons/fi';

import { publicAPI }  from '../../services/api';
import VideoGrid      from '../../components/video/VideoGrid';
import Pagination     from '../../components/common/Pagination';

const VIDEOS_PER_PAGE = 24;

const CategoryPage = () => {
  const { slug } = useParams();

  const [category,      setCategory]      = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [videos,        setVideos]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [viewMode,      setViewMode]      = useState('grid');

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res  = await publicAPI.getCategory(slug);
        const data = res?.data?.category || res?.data;
        if (mountedRef.current && data) setCategory(data);
      } catch {
        if (mountedRef.current) setCategory({ name: slug, slug });
      }
    };
    fetchCategory();
  }, [slug]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res  = await publicAPI.getCategories();
        const data = res?.data?.categories || res?.data || [];
        if (mountedRef.current) setAllCategories(Array.isArray(data) ? data : []);
      } catch {
        if (mountedRef.current) setAllCategories([]);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchVideos(1);
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchVideos = async (pg) => {
    setLoading(true);
    setError(null);
    try {
      const res   = await publicAPI.getCategoryVideos(slug, { page: pg, limit: VIDEOS_PER_PAGE });
      const data  = res?.data?.videos || res?.data || [];
      const pages = res?.data?.totalPages || res?.data?.pages || 1;
      const count = res?.data?.total || data.length;
      if (!mountedRef.current) return;
      setVideos(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setTotalCount(count);
      setPage(pg);
    } catch {
      if (mountedRef.current) setError('Failed to load videos for this category.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handlePageChange = (pg) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchVideos(pg);
  };

  const categoryName = category?.name
    ? category.name.charAt(0).toUpperCase() + category.name.slice(1)
    : slug;

  return (
    <>
      <Helmet>
        <title>{categoryName} Videos — Xmaster</title>
        <meta name="description" content={`Watch ${categoryName} videos on Xmaster. Free adult content streaming.`} />
        <link rel="canonical" href={`https://xmaster.guru/category/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-dark-400">
        <div className="bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-8 sm:py-12 overflow-hidden relative">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary-600/[0.06] blur-3xl pointer-events-none" />
          <div className="container-site relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 text-xs text-white/40 hover:text-white/70 transition-colors duration-200">
              <FiArrowLeft className="w-3.5 h-3.5" />Home
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Category</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{categoryName}</h1>
                {!loading && <p className="text-sm text-white/40 mt-1.5">{totalCount.toLocaleString()} video{totalCount !== 1 ? 's' : ''}</p>}
              </div>
              <div className="sm:ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.08]">
                  {[{ mode: 'grid', icon: <FiGrid className="w-4 h-4" /> }, { mode: 'list', icon: <FiList className="w-4 h-4" /> }].map(({ mode, icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-lg transition-all duration-150 ${viewMode === mode ? 'bg-white/12 text-white' : 'text-white/30 hover:text-white/60'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-site py-6 sm:py-8">
          <div className="flex gap-8">
            {allCategories.length > 0 && (
              <aside className="hidden lg:block w-48 xl:w-56 flex-shrink-0">
                <div className="sticky top-20">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Categories</h3>
                  <nav className="space-y-0.5">
                    {allCategories.map((cat) => {
                      const catSlug  = cat.slug || cat._id;
                      const isActive = catSlug === slug;
                      return (
                        <Link key={cat._id || catSlug} to={`/category/${catSlug}`} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive ? 'bg-primary-600/15 text-white border border-primary-600/20' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}>
                          <span className="truncate">{cat.name}</span>
                          {cat.videoCount > 0 && <span className="text-[10px] text-white/25 ml-2 flex-shrink-0">{cat.videoCount}</span>}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            )}

            <div className="flex-1 min-w-0">
              {allCategories.length > 0 && (
                <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                  {allCategories.map((cat) => {
                    const catSlug  = cat.slug || cat._id;
                    const isActive = catSlug === slug;
                    return (
                      <Link key={cat._id || catSlug} to={`/category/${catSlug}`} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${isActive ? 'bg-primary-600/20 text-primary-400 border-primary-600/30' : 'bg-white/[0.06] text-white/50 border-white/10 hover:bg-white/10'}`}>
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}

              <VideoGrid
                videos={videos}
                loading={loading}
                error={error}
                onRetry={() => fetchVideos(page)}
                skeletonCount={VIDEOS_PER_PAGE}
                columns={viewMode === 'list' ? 'wide' : 'default'}
                showDate
                emptyTitle={`No ${categoryName} videos`}
                emptyMessage="This category has no videos yet. Check back soon."
              />

              {!loading && totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;