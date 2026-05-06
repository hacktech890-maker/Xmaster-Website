// src/pages/public/HomePage.jsx
// COMPLETE REDESIGN — Premium cinematic homepage
// Uses all components built in fractions 1-5
// Preserves: all existing publicAPI calls, infinite scroll logic
// Adds: Hero carousel, studio row, section rows, trending tags, ad integration

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Helmet }      from 'react-helmet-async';
import { Link }        from 'react-router-dom';
import {
  FiTrendingUp, FiClock, FiStar, FiZap,
  FiHeart, FiEye, FiAward, FiRefreshCw,
  FiChevronDown,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// API
import { publicAPI } from '../../services/api';

// Home components
import HeroSection   from '../../components/home/HeroSection';
import SectionRow    from '../../components/home/SectionRow';
import StudioRow     from '../../components/home/StudioRow';
import TrendingTags  from '../../components/home/TrendingTags';

// Video components
import VideoCard       from '../../components/video/VideoCard';
import VideoGrid       from '../../components/video/VideoGrid';
import { VideoGridSkeleton } from '../../components/video/VideoCardSkeleton';

// Ad components
import AdSlot, { GlobalAdsLoader } from '../../components/ads/AdSlot';

// Common
import LoadingSpinner  from '../../components/common/LoadingSpinner';

// Hooks
import { useIntersection } from '../../hooks/useIntersection';
import { useIsMobile }     from '../../hooks/useMediaQuery';

// Feature flags
import {
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from '../../config/features';

// ============================================================
// CONSTANTS
// ============================================================

const LATEST_PAGE_SIZE  = 16;
const HERO_VIDEO_COUNT  = 8;
const TRENDING_COUNT    = 12;
const FEATURED_COUNT    = 8;
const RELATED_COUNT     = 10;

// ============================================================
// HOME PAGE COMPONENT
// ============================================================

const HomePage = () => {
  const isMobile = useIsMobile();

  // ── Data state ─────────────────────────────────────────────
  const [heroVideos,     setHeroVideos]     = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [latestVideos,   setLatestVideos]   = useState([]);
  const [desiVideos,     setDesiVideos]     = useState([]);
  const [popularVideos,  setPopularVideos]  = useState([]);
  const [newVideos,      setNewVideos]      = useState([]);

  // ── Loading state ──────────────────────────────────────────
  const [loadingHero,      setLoadingHero]      = useState(true);
  const [loadingFeatured,  setLoadingFeatured]  = useState(true);
  const [loadingTrending,  setLoadingTrending]  = useState(true);
  const [loadingLatest,    setLoadingLatest]    = useState(true);
  const [loadingDesi,      setLoadingDesi]      = useState(true);
  const [loadingPopular,   setLoadingPopular]   = useState(false);
  const [loadingMore,      setLoadingMore]      = useState(false);

  // ── Pagination state ───────────────────────────────────────
  const [latestPage,   setLatestPage]   = useState(1);
  const [hasMoreLatest,setHasMoreLatest]= useState(true);

  // ── Intersection refs for lazy section loading ─────────────
  const [desiRef,    , desiVisible]    = useIntersection({ rootMargin: '300px', triggerOnce: true });
  const [popularRef, , popularVisible] = useIntersection({ rootMargin: '300px', triggerOnce: true });
  const [infiniteRef,  isNearBottom]   = useIntersection({ rootMargin: '400px', triggerOnce: false });

  // Mount ref for cleanup
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ============================================================
  // INITIAL DATA LOAD — Hero, Featured, Trending, Latest
  // ============================================================

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Attempt to use the /public/home endpoint first (single call)
        const homeRes = await publicAPI.getHomeData().catch(() => null);

        if (homeRes?.data) {
          const d = homeRes.data;

          if (!mountedRef.current) return;

          // Hero = featured + trending mixed, or dedicated hero field
          const heroPool = [
            ...(d.featured || []),
            ...(d.trending || []),
          ].slice(0, HERO_VIDEO_COUNT);
          setHeroVideos(heroPool);
          setLoadingHero(false);

          if (d.featured?.length) {
            setFeaturedVideos(d.featured.slice(0, FEATURED_COUNT));
            setLoadingFeatured(false);
          }

          if (d.trending?.length) {
            setTrendingVideos(d.trending.slice(0, TRENDING_COUNT));
            setLoadingTrending(false);
          }

          if (d.latest?.length) {
            setLatestVideos(d.latest);
            setLoadingLatest(false);
          }

          // Fetch missing sections individually
          if (!d.featured?.length)  fetchFeatured();
          if (!d.trending?.length)  fetchTrending();
          if (!d.latest?.length)    fetchLatest(1);

        } else {
          // Fallback: fetch each section independently
          await Promise.allSettled([
            fetchHero(),
            fetchFeatured(),
            fetchTrending(),
            fetchLatest(1),
          ]);
        }
      } catch (err) {
        // Last resort: fetch individually
        fetchHero();
        fetchFeatured();
        fetchTrending();
        fetchLatest(1);
      }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // INDIVIDUAL FETCHERS
  // ============================================================

  const fetchHero = async () => {
    setLoadingHero(true);
    try {
      const [featuredRes, trendingRes] = await Promise.allSettled([
        publicAPI.getFeaturedVideos(4),
        publicAPI.getTrendingVideos(4, '7d'),
      ]);

      if (!mountedRef.current) return;

      const featured = featuredRes.status === 'fulfilled'
        ? featuredRes.value?.data?.videos || featuredRes.value?.data || []
        : [];
      const trending = trendingRes.status === 'fulfilled'
        ? trendingRes.value?.data?.videos || trendingRes.value?.data || []
        : [];

      const pool = [...featured, ...trending].slice(0, HERO_VIDEO_COUNT);
      setHeroVideos(pool);
    } catch {
      setHeroVideos([]);
    } finally {
      if (mountedRef.current) setLoadingHero(false);
    }
  };

  const fetchFeatured = async () => {
    setLoadingFeatured(true);
    try {
      const res  = await publicAPI.getFeaturedVideos(FEATURED_COUNT);
      const data = res?.data?.videos || res?.data || [];
      if (mountedRef.current) {
        setFeaturedVideos(Array.isArray(data) ? data : []);
      }
    } catch {
      if (mountedRef.current) setFeaturedVideos([]);
    } finally {
      if (mountedRef.current) setLoadingFeatured(false);
    }
  };

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res  = await publicAPI.getTrendingVideos(TRENDING_COUNT, '7d');
      const data = res?.data?.videos || res?.data || [];
      if (mountedRef.current) {
        setTrendingVideos(Array.isArray(data) ? data : []);
      }
    } catch {
      if (mountedRef.current) setTrendingVideos([]);
    } finally {
      if (mountedRef.current) setLoadingTrending(false);
    }
  };

  const fetchLatest = async (page = 1) => {
    if (page === 1) setLoadingLatest(true);
    try {
      const res  = await publicAPI.getLatestVideos
        ? publicAPI.getLatestVideos(LATEST_PAGE_SIZE, page)
        : publicAPI.getVideos({ page, limit: LATEST_PAGE_SIZE, status: 'public' });

      const data = res?.data?.videos || res?.data || [];
      const total= res?.data?.totalPages || res?.data?.pages || 1;

      if (!mountedRef.current) return;

      if (page === 1) {
        setLatestVideos(Array.isArray(data) ? data : []);
      } else {
        setLatestVideos((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      }
      setHasMoreLatest(page < total && data.length === LATEST_PAGE_SIZE);
      setLatestPage(page);
    } catch {
      if (mountedRef.current && page === 1) setLatestVideos([]);
    } finally {
      if (mountedRef.current) {
        setLoadingLatest(false);
        setLoadingMore(false);
      }
    }
  };

  // ── Desi videos (lazy — loads when section scrolls into view)
  useEffect(() => {
    if (!desiVisible || desiVideos.length > 0) return;
    const fetch = async () => {
      setLoadingDesi(true);
      try {
        const res  = await publicAPI.searchByTag('desi', { limit: TRENDING_COUNT });
        const data = res?.data?.videos || res?.data || [];
        if (mountedRef.current) {
          setDesiVideos(Array.isArray(data) ? data : []);
        }
      } catch {
        // Try alternate tag
        try {
          const res2 = await publicAPI.searchByTag('indian', { limit: TRENDING_COUNT });
          const data2 = res2?.data?.videos || res2?.data || [];
          if (mountedRef.current) {
            setDesiVideos(Array.isArray(data2) ? data2 : []);
          }
        } catch {
          if (mountedRef.current) setDesiVideos([]);
        }
      } finally {
        if (mountedRef.current) setLoadingDesi(false);
      }
    };
    fetch();
  }, [desiVisible, desiVideos.length]);

  // ── Popular videos (lazy — loads when section scrolls into view)
  useEffect(() => {
    if (!popularVisible || popularVideos.length > 0) return;
    const fetch = async () => {
      setLoadingPopular(true);
      try {
        const res  = await publicAPI.getVideos({
          limit: RELATED_COUNT, page: 1, sort: 'views', status: 'public',
        });
        const data = res?.data?.videos || res?.data || [];
        if (mountedRef.current) {
          setPopularVideos(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mountedRef.current) setPopularVideos([]);
      } finally {
        if (mountedRef.current) setLoadingPopular(false);
      }
    };
    fetch();
  }, [popularVisible, popularVideos.length]);

  // ── Infinite scroll — load more latest videos
  useEffect(() => {
    if (
      !isNearBottom ||
      loadingMore ||
      loadingLatest ||
      !hasMoreLatest
    ) return;

    const loadMore = async () => {
      setLoadingMore(true);
      await fetchLatest(latestPage + 1);
    };
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearBottom]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ── SEO ──────────────────────────────────────────────── */}
      <Helmet>
        <title>Xmaster — Free Adult Videos, Indian MMS & Desi Clips</title>
        <meta
          name="description"
          content="Watch free adult videos, Indian MMS clips, desi XXX content and premium studio videos on Xmaster. Stream HD quality porn free."
        />
        <meta
          name="keywords"
          content="free porn, indian mms, desi xxx, adult videos, bhabhi, tamil sex, telugu sex, xmaster"
        />
        <link rel="canonical" href="https://xmaster.guru" />
      </Helmet>

      {/* Global ads — delayed injection */}
      <GlobalAdsLoader />

      {/* ── Page wrapper ──────────────────────────────────────── */}
      <div className="min-h-screen bg-dark-400">

        {/* ============================================================
            SECTION 1: HERO CAROUSEL
            ============================================================ */}
        <section className="container-site pt-4 pb-6 sm:pt-6 sm:pb-8">
          <HeroSection
            videos={heroVideos}
            loading={loadingHero}
          />
        </section>

        {/* ============================================================
            SECTION 2: TRENDING NOW
            ============================================================ */}
        <section className="container-site pb-8 sm:pb-10">
          <SectionRow
            title="Trending Now"
            videos={trendingVideos}
            loading={loadingTrending}
            icon="trending"
            badge="HOT"
            seeAllLink="/trending"
            seeAllLabel="View All"
            accentColor="#e11d48"
            skeletonCount={8}
          />
        </section>

        {/* ============================================================
            SECTION 3: MID-PAGE AD (desktop leaderboard / mobile banner)
            ============================================================ */}
        <div className="container-site pb-8">
          <div className="flex justify-center">
            <AdSlot
              placement="watch_bottom"
              delay={3000}
              label
            />
          </div>
        </div>

        {/* ============================================================
            SECTION 4: FEATURED VIDEOS
            ============================================================ */}
        <section className="container-site pb-8 sm:pb-10">
          <SectionRow
            title="Editor's Picks"
            videos={featuredVideos}
            loading={loadingFeatured}
            icon="featured"
            badge="CURATED"
            accentColor="#f59e0b"
            seeAllLink="/search?q=featured"
            skeletonCount={6}
          />
        </section>

        {/* ============================================================
            SECTION 5: PREMIUM STUDIOS (if enabled)
            ============================================================ */}
        {PREMIUM_SECTION_ENABLED && (
          <section className="container-site pb-8 sm:pb-10">
            <StudioRow title="Premium Studios" />
          </section>
        )}

        {/* ============================================================
            SECTION 6: DESI / FREE CONTENT (lazy loaded)
            ============================================================ */}
        {FREE_SECTION_ENABLED && (
          <section
            ref={desiRef}
            className="container-site pb-8 sm:pb-10"
          >
            <SectionRow
              title="Desi Videos"
              videos={desiVideos}
              loading={loadingDesi}
              icon="new"
              badge="DESI"
              accentColor="#10b981"
              seeAllLink="/tag/desi"
              seeAllLabel="All Desi"
              skeletonCount={8}
            />
          </section>
        )}

        {/* ============================================================
            SECTION 7: TRENDING TAGS
            ============================================================ */}
        <section className="container-site pb-8 sm:pb-10">
          <TrendingTags
            title="Trending Searches"
            maxTags={20}
          />
        </section>

        {/* ============================================================
            SECTION 8: MOST POPULAR (lazy loaded)
            ============================================================ */}
        <div ref={popularRef}>
          <section className="container-site pb-8 sm:pb-10">
            <SectionRow
              title="Most Watched"
              videos={popularVideos}
              loading={loadingPopular}
              icon="popular"
              accentColor="#6366f1"
              seeAllLink="/search?sort=views"
              skeletonCount={8}
            />
          </section>
        </div>

        {/* ============================================================
            SECTION 9: NATIVE AD BANNER
            ============================================================ */}
        <div className="container-site pb-8">
          <AdSlot
            placement="watch_native"
            delay={4000}
            label
          />
        </div>

        {/* ============================================================
            SECTION 10: LATEST VIDEOS GRID (infinite scroll)
            ============================================================ */}
        <section className="container-site pb-10 sm:pb-14">

          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-primary-600 to-primary-800 flex-shrink-0" />
              <FiClock className="w-5 h-5 text-white/60" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Latest Videos
              </h2>
              <span className="
                hidden sm:inline-flex
                px-2.5 py-0.5 rounded-full
                text-[10px] font-bold uppercase tracking-wider
                bg-white/8 text-white/40 border border-white/10
              ">
                Updated Daily
              </span>
            </div>

            <Link
              to="/search"
              className="
                text-xs font-semibold
                text-white/40 hover:text-primary-400
                transition-colors duration-200
                flex items-center gap-1
              "
            >
              Browse All
              <FiChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
            </Link>
          </div>

          {/* Video Grid */}
          <VideoGrid
            videos={latestVideos}
            loading={loadingLatest}
            error={null}
            skeletonCount={LATEST_PAGE_SIZE}
            columns="default"
            showDate
            emptyTitle="No videos yet"
            emptyMessage="New content is being added soon. Check back later!"
          />

          {/* Load more trigger (invisible sentinel) */}
          {!loadingLatest && hasMoreLatest && (
            <div ref={infiniteRef} className="h-4 mt-4" />
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center mt-8 mb-4">
              <div className="flex items-center gap-3 text-sm text-white/40">
                <div className="
                  w-5 h-5 rounded-full
                  border-2 border-white/10 border-t-primary-600
                  animate-spin
                " />
                Loading more videos...
              </div>
            </div>
          )}

          {/* End of content */}
          {!hasMoreLatest && latestVideos.length > 0 && (
            <EndOfContent />
          )}
        </section>

      </div>
    </>
  );
};

// ============================================================
// END OF CONTENT INDICATOR
// ============================================================

const EndOfContent = () => (
  <div className="flex flex-col items-center py-12 mt-4">
    {/* Decorative line */}
    <div className="flex items-center gap-4 w-full max-w-sm mb-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
      <div className="
        w-8 h-8 rounded-full
        bg-white/5 border border-white/10
        flex items-center justify-center
        flex-shrink-0
      ">
        <div className="w-2 h-2 rounded-full bg-primary-600/60" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
    </div>

    <p className="text-sm font-medium text-white/30 mb-1">
      You've reached the end
    </p>
    <p className="text-xs text-white/20 mb-6 text-center">
      New content is added daily. Check back tomorrow!
    </p>

    <Link
      to="/trending"
      className="btn-secondary text-sm flex items-center gap-2"
    >
      <FiTrendingUp className="w-4 h-4" />
      Explore Trending
    </Link>
  </div>
);

export default HomePage;