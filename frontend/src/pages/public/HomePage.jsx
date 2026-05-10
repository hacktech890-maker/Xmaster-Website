// src/pages/public/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet }   from 'react-helmet-async';
import { Link }     from 'react-router-dom';
import { FiTrendingUp, FiClock, FiChevronDown } from 'react-icons/fi';

import { publicAPI } from '../../services/api';

import HeroSection  from '../../components/home/HeroSection';
import SectionRow   from '../../components/home/SectionRow';
import StudioRow    from '../../components/home/StudioRow';

import VideoGrid              from '../../components/video/VideoGrid';
import VideoCard              from '../../components/video/VideoCard';
import AdSlot, { GlobalAdsLoader } from '../../components/ads/AdSlot';

import { useIntersection } from '../../hooks/useIntersection';

import {
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from '../../config/features';

const LATEST_PAGE_SIZE = 16;
const HERO_VIDEO_COUNT = 8;
const TRENDING_COUNT   = 12;
const FEATURED_COUNT   = 8;
const RELATED_COUNT    = 10;

// ============================================================
// AD-INJECTED VIDEO GRID
// Inserts an ad slot after every 2 rows of videos.
// Adapts to grid column count responsively.
//
// Grid presets from VideoGrid:
//   default → xs:2 sm:2 md:3 lg:4 cols
//
// Ad frequency: after every 2 rows
//   lg (4 cols) → ad after every 8 cards
//   md (3 cols) → ad after every 6 cards
//   sm/xs (2 cols) → ad after every 4 cards
//
// Implementation: renders cards with ad slots interleaved.
// Uses CSS classes to show/hide ads at correct breakpoints.
// Each breakpoint has its own repeating-group logic via
// nth-child-like ordering — we insert ad nodes at positions
// 8, 16, 24... (desktop), 6, 12, 18... (tablet), 4, 8, 12 (mobile)
// and show only the correct one per breakpoint via Tailwind.
// ============================================================

const VideoGridWithAds = ({ videos, loading, skeletonCount }) => {
  if (loading || !videos || videos.length === 0) {
    return (
      <VideoGrid
        videos={videos || []}
        loading={loading}
        error={null}
        skeletonCount={skeletonCount}
        columns="default"
        showDate
        emptyTitle="No videos yet"
        emptyMessage="New content is being added soon. Check back later!"
      />
    );
  }

  // Build interleaved list: cards + ad nodes
  // We insert an ad every AD_INTERVAL cards (using the largest interval = 8 for desktop)
  // and rely on responsive CSS to handle smaller screens gracefully.
  // The ad spans the full row width via col-span classes.
  const AD_INTERVAL = 8; // after every 8 cards (= 2 rows @ 4-col desktop)
  const items = [];

  videos.forEach((video, i) => {
    items.push({ type: 'video', video, index: i });
    // Insert ad after every AD_INTERVAL-th card (1-indexed)
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
// HOME PAGE
// ============================================================

const HomePage = () => {
  const [heroVideos,     setHeroVideos]     = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [latestVideos,   setLatestVideos]   = useState([]);
  const [desiVideos,     setDesiVideos]     = useState([]);
  const [popularVideos,  setPopularVideos]  = useState([]);

  const [loadingHero,     setLoadingHero]     = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingLatest,   setLoadingLatest]   = useState(true);
  const [loadingDesi,     setLoadingDesi]     = useState(true);
  const [loadingPopular,  setLoadingPopular]  = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);

  const [latestPage,    setLatestPage]    = useState(1);
  const [hasMoreLatest, setHasMoreLatest] = useState(true);

  const [desiRef,    , desiVisible]    = useIntersection({ rootMargin: '300px', triggerOnce: true });
  const [popularRef, , popularVisible] = useIntersection({ rootMargin: '300px', triggerOnce: true });
  const [infiniteRef,  isNearBottom]   = useIntersection({ rootMargin: '400px', triggerOnce: false });

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const homeRes = await publicAPI.getHomeData().catch(() => null);
        if (homeRes?.data) {
          const d = homeRes.data;
          if (!mountedRef.current) return;
          const heroPool = [...(d.featured || []), ...(d.trending || [])].slice(0, HERO_VIDEO_COUNT);
          setHeroVideos(heroPool);
          setLoadingHero(false);
          if (d.featured?.length) { setFeaturedVideos(d.featured.slice(0, FEATURED_COUNT)); setLoadingFeatured(false); }
          if (d.trending?.length) { setTrendingVideos(d.trending.slice(0, TRENDING_COUNT)); setLoadingTrending(false); }
          if (d.latest?.length)   { setLatestVideos(d.latest);   setLoadingLatest(false); }
          if (!d.featured?.length) fetchFeatured();
          if (!d.trending?.length) fetchTrending();
          if (!d.latest?.length)   fetchLatest(1);
        } else {
          await Promise.allSettled([fetchHero(), fetchFeatured(), fetchTrending(), fetchLatest(1)]);
        }
      } catch {
        fetchHero(); fetchFeatured(); fetchTrending(); fetchLatest(1);
      }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHero = async () => {
    setLoadingHero(true);
    try {
      const [featuredRes, trendingRes] = await Promise.allSettled([
        publicAPI.getFeaturedVideos(4),
        publicAPI.getTrendingVideos(4, '7d'),
      ]);
      if (!mountedRef.current) return;
      const featured = featuredRes.status === 'fulfilled' ? featuredRes.value?.data?.videos || featuredRes.value?.data || [] : [];
      const trending = trendingRes.status === 'fulfilled' ? trendingRes.value?.data?.videos || trendingRes.value?.data || [] : [];
      setHeroVideos([...featured, ...trending].slice(0, HERO_VIDEO_COUNT));
    } catch { setHeroVideos([]); }
    finally  { if (mountedRef.current) setLoadingHero(false); }
  };

  const fetchFeatured = async () => {
    setLoadingFeatured(true);
    try {
      const res  = await publicAPI.getFeaturedVideos(FEATURED_COUNT);
      const data = res?.data?.videos || res?.data || [];
      if (mountedRef.current) setFeaturedVideos(Array.isArray(data) ? data : []);
    } catch { if (mountedRef.current) setFeaturedVideos([]); }
    finally  { if (mountedRef.current) setLoadingFeatured(false); }
  };

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res  = await publicAPI.getTrendingVideos(TRENDING_COUNT, '7d');
      const data = res?.data?.videos || res?.data || [];
      if (mountedRef.current) setTrendingVideos(Array.isArray(data) ? data : []);
    } catch { if (mountedRef.current) setTrendingVideos([]); }
    finally  { if (mountedRef.current) setLoadingTrending(false); }
  };

  const fetchLatest = async (pg = 1) => {
    if (pg === 1) setLoadingLatest(true);
    try {
      const res  = publicAPI.getLatestVideos
        ? await publicAPI.getLatestVideos(LATEST_PAGE_SIZE, pg)
        : await publicAPI.getVideos({ page: pg, limit: LATEST_PAGE_SIZE, status: 'public' });
      const data  = res?.data?.videos || res?.data || [];
      const total = res?.data?.totalPages || res?.data?.pages || 1;
      if (!mountedRef.current) return;
      if (pg === 1) setLatestVideos(Array.isArray(data) ? data : []);
      else          setLatestVideos((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      setHasMoreLatest(pg < total && data.length === LATEST_PAGE_SIZE);
      setLatestPage(pg);
    } catch { if (mountedRef.current && pg === 1) setLatestVideos([]); }
    finally  { if (mountedRef.current) { setLoadingLatest(false); setLoadingMore(false); } }
  };

  useEffect(() => {
    if (!desiVisible || desiVideos.length > 0) return;
    const fetch = async () => {
      setLoadingDesi(true);
      try {
        const res  = await publicAPI.searchByTag('desi', { limit: TRENDING_COUNT });
        const data = res?.data?.videos || res?.data || [];
        if (mountedRef.current) setDesiVideos(Array.isArray(data) ? data : []);
      } catch {
        try {
          const res2  = await publicAPI.searchByTag('indian', { limit: TRENDING_COUNT });
          const data2 = res2?.data?.videos || res2?.data || [];
          if (mountedRef.current) setDesiVideos(Array.isArray(data2) ? data2 : []);
        } catch { if (mountedRef.current) setDesiVideos([]); }
      } finally { if (mountedRef.current) setLoadingDesi(false); }
    };
    fetch();
  }, [desiVisible, desiVideos.length]);

  useEffect(() => {
    if (!popularVisible || popularVideos.length > 0) return;
    const fetch = async () => {
      setLoadingPopular(true);
      try {
        const res  = await publicAPI.getVideos({ limit: RELATED_COUNT, page: 1, sort: 'views', status: 'public' });
        const data = res?.data?.videos || res?.data || [];
        if (mountedRef.current) setPopularVideos(Array.isArray(data) ? data : []);
      } catch { if (mountedRef.current) setPopularVideos([]); }
      finally  { if (mountedRef.current) setLoadingPopular(false); }
    };
    fetch();
  }, [popularVisible, popularVideos.length]);

  useEffect(() => {
    if (!isNearBottom || loadingMore || loadingLatest || !hasMoreLatest) return;
    setLoadingMore(true);
    fetchLatest(latestPage + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearBottom]);

  return (
    <>
      <Helmet>
        <title>Xmaster — Free Adult Videos, Indian MMS &amp; Desi Clips</title>
        <meta name="description" content="Watch free adult videos, Indian MMS clips, desi XXX content and premium studio videos on Xmaster." />
        <meta name="keywords"    content="free porn, indian mms, desi xxx, adult videos, bhabhi, tamil sex, telugu sex, xmaster" />
        <link rel="canonical"    href="https://xmaster.guru" />
      </Helmet>

      <GlobalAdsLoader />

      <div className="min-h-screen bg-dark-400">
        <section className="container-site pt-4 pb-6 sm:pt-6 sm:pb-8">
          <HeroSection videos={heroVideos} loading={loadingHero} />
        </section>

        <section className="container-site pb-8 sm:pb-10">
          <SectionRow title="Trending Now" videos={trendingVideos} loading={loadingTrending} icon="trending" badge="HOT" seeAllLink="/trending" seeAllLabel="View All" accentColor="#e11d48" skeletonCount={8} />
        </section>

        {/* Ad between Trending and Featured */}
        <div className="container-site pb-8">
          <div className="flex justify-center">
            <AdSlot placement="home_mid" delay={3000} label />
          </div>
        </div>

        <section className="container-site pb-8 sm:pb-10">
          <SectionRow title="Editor's Picks" videos={featuredVideos} loading={loadingFeatured} icon="featured" badge="CURATED" accentColor="#f59e0b" seeAllLink="/search?q=featured" skeletonCount={6} />
        </section>

        {PREMIUM_SECTION_ENABLED && (
          <section className="container-site pb-8 sm:pb-10">
            <StudioRow title="Premium Studios" />
          </section>
        )}

        {FREE_SECTION_ENABLED && (
          <section ref={desiRef} className="container-site pb-8 sm:pb-10">
            <SectionRow title="Desi Videos" videos={desiVideos} loading={loadingDesi} icon="new" badge="DESI" accentColor="#10b981" seeAllLink="/tag/desi" seeAllLabel="All Desi" skeletonCount={8} />
          </section>
        )}

        <div ref={popularRef}>
          <section className="container-site pb-8 sm:pb-10">
            <SectionRow title="Most Watched" videos={popularVideos} loading={loadingPopular} icon="popular" accentColor="#6366f1" seeAllLink="/search?sort=views" skeletonCount={8} />
          </section>
        </div>

        {/* Native ad before Latest Videos grid */}
        <div className="container-site pb-8">
          <AdSlot placement="watch_native" delay={4000} label />
        </div>

        {/* Latest Videos with in-grid ads */}
        <section className="container-site pb-10 sm:pb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-primary-600 to-primary-800 flex-shrink-0" />
              <FiClock className="w-5 h-5 text-white/60" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Latest Videos</h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.08] text-white/40 border border-white/10">Updated Daily</span>
            </div>
            <Link to="/search" className="text-xs font-semibold text-white/40 hover:text-primary-400 transition-colors duration-200 flex items-center gap-1">
              Browse All<FiChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
            </Link>
          </div>

          {/* Ad-injected grid — replaces plain VideoGrid for the latest section */}
          <VideoGridWithAds
            videos={latestVideos}
            loading={loadingLatest}
            skeletonCount={LATEST_PAGE_SIZE}
          />

          {!loadingLatest && hasMoreLatest && <div ref={infiniteRef} className="h-4 mt-4" />}

          {loadingMore && (
            <div className="flex justify-center mt-8 mb-4">
              <div className="flex items-center gap-3 text-sm text-white/40">
                <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-primary-600 animate-spin" />
                Loading more videos...
              </div>
            </div>
          )}

          {!hasMoreLatest && latestVideos.length > 0 && <EndOfContent />}
        </section>
      </div>
    </>
  );
};

const EndOfContent = () => (
  <div className="flex flex-col items-center py-12 mt-4">
    <div className="flex items-center gap-4 w-full max-w-sm mb-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-primary-600/60" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
    </div>
    <p className="text-sm font-medium text-white/30 mb-1">You've reached the end</p>
    <p className="text-xs text-white/20 mb-6 text-center">New content is added daily. Check back tomorrow!</p>
    <Link to="/trending" className="btn-secondary text-sm flex items-center gap-2">
      <FiTrendingUp className="w-4 h-4" />Explore Trending
    </Link>
  </div>
);

export default HomePage;
