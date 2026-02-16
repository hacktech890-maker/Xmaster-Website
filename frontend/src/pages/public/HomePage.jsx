import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiClock, FiStar, FiChevronRight, FiLoader } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import { VideoGridSkeleton } from '../../components/video/VideoGrid';
import VideoCard from '../../components/video/VideoCard';
import CommentForm from '../../components/comments/CommentForm';
import CommentsList from '../../components/comments/CommentsList';

// ==================== AD INJECTOR ====================
const AdSlot = ({ adCode, label = "Sponsored", className = "" }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);
  const uniqueId = useRef(`ad-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!adCode || !containerRef.current || loaded.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    loaded.current = true;

    let processedCode = adCode;
    const containerMatch = adCode.match(/id="(container-[a-f0-9]+)"/);
    if (containerMatch) {
      const newContainerId = containerMatch[1] + '-' + uniqueId.current;
      processedCode = processedCode.replace(new RegExp(containerMatch[1], 'g'), newContainerId);
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = processedCode;
    const scripts = tempDiv.querySelectorAll("script");
    const nonScript = processedCode.replace(/<script[\s\S]*?<\/script>/gi, "");

    if (nonScript.trim()) {
      const div = document.createElement("div");
      div.innerHTML = nonScript;
      container.appendChild(div);
    }

    scripts.forEach((orig) => {
      const s = document.createElement("script");
      Array.from(orig.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (orig.textContent) s.textContent = orig.textContent;
      if (orig.src) { s.src = orig.src; s.async = true; }
      container.appendChild(s);
    });

    return () => {
      if (container) container.innerHTML = "";
      loaded.current = false;
    };
  }, [adCode]);

  if (!adCode) return null;

  return (
    <div className={`ad-slot ${className}`}>
      {label && (
        <span className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1 block text-center">
          {label}
        </span>
      )}
      <div ref={containerRef} className="ad-content flex justify-center items-center" />
    </div>
  );
};

// ==================== AD CODES ====================
const ADS = {
  mobile320x50: `<script>
    atOptions = {
      'key' : '161b6adedd44fd65d7197bdc372ef90f',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/161b6adedd44fd65d7197bdc372ef90f/invoke.js"></script>`,

  footer728x90: `<script>
    atOptions = {
      'key' : '8615981141c313bf4581c3cf1de1fb8f',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/8615981141c313bf4581c3cf1de1fb8f/invoke.js"></script>`,

  footer300x250: `<script>
    atOptions = {
      'key' : '3becc7318ca2e6c794f587d8f3f05d0b',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/3becc7318ca2e6c794f587d8f3f05d0b/invoke.js"></script>`,

  medium468x60: `<script>
    atOptions = {
      'key' : 'e50c996a8b1f38f50988e7c6e6ebc19a',
      'format' : 'iframe',
      'height' : 60,
      'width' : 468,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/e50c996a8b1f38f50988e7c6e6ebc19a/invoke.js"></script>`,

  sidebar160x300: `<script>
    atOptions = {
      'key' : 'deffd68605ce0b0c91d11c13a0fffd06',
      'format' : 'iframe',
      'height' : 300,
      'width' : 160,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/deffd68605ce0b0c91d11c13a0fffd06/invoke.js"></script>`,

  nativeBanner: `<script async="async" data-cfasync="false" src="https://pl28704186.effectivegatecpm.com/3ebdaa444c50232518b3752efc451cab/invoke.js"></script>
  <div id="container-3ebdaa444c50232518b3752efc451cab"></div>`,
};

// ==================== GLOBAL ADS LOADER ====================
const GlobalAdsLoader = () => {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const s1 = document.createElement("script");
    s1.src = "https://pl28704151.effectivegatecpm.com/35/ee/21/35ee2192f0b1aa5ca35c1f3af9387b00.js";
    s1.async = true;
    document.body.appendChild(s1);

    const s2 = document.createElement("script");
    s2.src = "https://pl28704173.effectivegatecpm.com/52/ef/a1/52efa111bceee1130b219af1074a5f95.js";
    s2.async = true;
    document.body.appendChild(s2);

    const s3 = document.createElement("script");
    s3.src = "https://www.effectivegatecpm.com/sbfz9bs1c?key=4b48edda8bb87faa2b8f8b8708c46b0b";
    s3.async = true;
    document.body.appendChild(s3);

    return () => {
      [s1, s2, s3].forEach(s => {
        if (document.body.contains(s)) document.body.removeChild(s);
      });
      loaded.current = false;
    };
  }, []);
  return null;
};

// ==================== IN-FEED AD COMPONENT ====================
const InFeedAd = React.memo(({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="col-span-2 py-3">
        <div className="bg-gray-100/50 dark:bg-dark-200/50 rounded-xl p-3">
          <AdSlot adCode={ADS.nativeBanner} label="Sponsored" />
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full py-4">
      <div className="w-full bg-gray-100/30 dark:bg-dark-200/30 rounded-xl p-4">
        <AdSlot adCode={ADS.nativeBanner} label="Sponsored" />
      </div>
    </div>
  );
});

// ==================== SEO KEYWORDS ====================
const SEO_CATEGORIES = [
  "Amateur", "Anal", "Asian", "BBW", "Big Ass", "Big Tits", "Blonde", "Blowjob",
  "Brunette", "Cosplay", "Creampie", "Cumshot", "Desi", "Ebony", "Gangbang",
  "Hardcore", "HD Videos", "Hentai", "Homemade", "Indian", "Interracial",
  "Japanese", "Latina", "Lesbian", "MILF", "POV", "Redhead", "Solo",
  "Teen", "Threesome", "Webcam", "MMS Videos", "Couple", "College",
];

// ==================== MAIN HOMEPAGE ====================
const HomePage = () => {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { pageRef.current = page; }, [page]);

  // ==================== FETCH INITIAL DATA ====================
  // ==================== FETCH INITIAL DATA ====================
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await publicAPI.getHomeData();
        if (response.data && response.data.success) {
          const data = response.data.data;
          setFeaturedVideos(data.featuredVideos || []);
          setCategories(data.categories || []);
        }
      } catch (homeErr) {
        console.error('Home data error:', homeErr);
      }

      try {
        const videosResponse = await publicAPI.getVideos({
          page: 1,
          limit: 40,
          sort: 'newest',
        });

        // Debug: log entire response structure
        console.log('[INIT] Raw response type:', typeof videosResponse.data);
        console.log('[INIT] Raw response keys:', Object.keys(videosResponse.data || {}));
        console.log('[INIT] Full response:', JSON.stringify(videosResponse.data).substring(0, 500));

        let videos = [];
        let total = 0;
        let totalPages = 1;

        const d = videosResponse.data;

        if (d) {
          // Handle different response formats
          if (Array.isArray(d)) {
            // Response is directly an array
            videos = d;
            total = d.length;
          } else if (d.videos && Array.isArray(d.videos)) {
            // Standard format: { success, videos, pagination }
            videos = d.videos;
            total = d.pagination?.total || d.total || videos.length;
            totalPages = d.pagination?.pages || Math.ceil(total / 40) || 1;
          } else if (d.data && Array.isArray(d.data)) {
            // Alternative: { success, data, pagination }
            videos = d.data;
            total = d.pagination?.total || d.total || videos.length;
            totalPages = d.pagination?.pages || Math.ceil(total / 40) || 1;
          } else if (d.data && d.data.videos) {
            // Nested: { data: { videos, pagination } }
            videos = d.data.videos;
            total = d.data.pagination?.total || videos.length;
            totalPages = d.data.pagination?.pages || Math.ceil(total / 40) || 1;
          }
        }

        console.log('[INIT] Parsed:', { videoCount: videos.length, total, totalPages });

        if (videos.length > 0) {
          setAllVideos(videos);
          setPage(1);
          pageRef.current = 1;
          setTotalVideos(total);

          if (1 >= totalPages) {
            setHasMore(false);
            hasMoreRef.current = false;
          } else {
            setHasMore(true);
            hasMoreRef.current = true;
          }
        } else {
          setHasMore(false);
          hasMoreRef.current = false;
        }
      } catch (vidErr) {
        console.error('[INIT] Videos fetch error:', vidErr);
      }

      setLoading(false);
    };

    fetchHomeData();
  }, []);

  // ==================== LOAD MORE VIDEOS ====================
    // ==================== LOAD MORE VIDEOS ====================
  const loadMoreVideos = useCallback(async () => {
    if (loadingMoreRef.current) {
      console.log('[LoadMore] BLOCKED: already loading');
      return;
    }
    if (!hasMoreRef.current) {
      console.log('[LoadMore] BLOCKED: no more videos');
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;
    console.log(`[LoadMore] Starting fetch for page ${nextPage}...`);

    try {
      const response = await publicAPI.getVideos({
        page: nextPage,
        limit: 40,
        sort: 'newest',
      });

      console.log('[LoadMore] Raw response keys:', Object.keys(response.data || {}));

      let newVideos = [];
      let total = 0;
      let totalPages = 1;

      const d = response.data;

      if (d) {
        if (Array.isArray(d)) {
          newVideos = d;
          total = d.length;
        } else if (d.videos && Array.isArray(d.videos)) {
          newVideos = d.videos;
          total = d.pagination?.total || d.total || 0;
          totalPages = d.pagination?.pages || Math.ceil(total / 40) || 1;
        } else if (d.data && Array.isArray(d.data)) {
          newVideos = d.data;
          total = d.pagination?.total || d.total || 0;
          totalPages = d.pagination?.pages || Math.ceil(total / 40) || 1;
        } else if (d.data && d.data.videos) {
          newVideos = d.data.videos;
          total = d.data.pagination?.total || 0;
          totalPages = d.data.pagination?.pages || Math.ceil(total / 40) || 1;
        }
      }

      console.log(`[LoadMore] Parsed: ${newVideos.length} videos, page ${nextPage}/${totalPages}, total ${total}`);

      if (newVideos.length === 0) {
        console.log('[LoadMore] No new videos, stopping');
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      // Deduplicate and append
      setAllVideos(prev => {
        const existingIds = new Set(prev.map(v => v._id));
        const unique = newVideos.filter(v => !existingIds.has(v._id));
        console.log(`[LoadMore] Adding ${unique.length} unique (${newVideos.length - unique.length} dupes)`);
        return [...prev, ...unique];
      });

      // Update counters
      setPage(nextPage);
      pageRef.current = nextPage;

      if (total > 0) {
        setTotalVideos(total);
      }

      if (nextPage >= totalPages) {
        console.log(`[LoadMore] Reached last page ${nextPage}/${totalPages}`);
        setHasMore(false);
        hasMoreRef.current = false;
      }

    } catch (error) {
      console.error('[LoadMore] FETCH ERROR:', error);
      console.error('[LoadMore] Error details:', error.response?.status, error.response?.data);
      // Don't disable on error — user can retry
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      console.log('[LoadMore] Finished, unlocked');
    }
  }, []);

  // ==================== INTERSECTION OBSERVER ====================
  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMoreVideos();
        }
      },
      { threshold: 0.01, rootMargin: '600px' }
    );

    observerRef.current = observer;
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loading, loadMoreVideos]);

  // ==================== SCROLL FALLBACK ====================
  useEffect(() => {
    if (loading) return;

    let ticking = false;
    const handleScroll = () => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 800) loadMoreVideos();
    };

    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { handleScroll(); ticking = false; });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [loading, loadMoreVideos]);

  // ==================== RENDER VIDEOS WITH ADS ====================
  const renderVideosWithAds = () => {
    if (allVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-600 dark:text-gray-400">No videos found</p>
        </div>
      );
    }

    // Native banner ad every 5 rows desktop (20 videos), every 4 rows mobile (8 videos)
    const videosPerAdBreak = isMobile ? 8 : 20;
    const items = [];
    let adCounter = 0;

    for (let i = 0; i < allVideos.length; i++) {
      items.push(<VideoCard key={allVideos[i]._id} video={allVideos[i]} />);

      if ((i + 1) % videosPerAdBreak === 0 && i < allVideos.length - 1) {
        items.push(
          <InFeedAd key={`ad-${adCounter}`} isMobile={isMobile} />
        );
        adCounter++;
      }
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {items}
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <>
      <Helmet>
        <title>Xmaster - Free porn Videos | Watch HD porn Online | porn Streaming Site</title>
        <meta name="description" content="Watch free HD porn videos on Xmaster. Stream thousands of porn clips in HD & 4K. Browse leaked mms videos, viral mms videos, porn, mms, hardcore, anal categories. Best free porn tube site. Alternative to pornhub, xhamster, Xvideos. Updated daily with new porn content. MMS videos, desi mms, indian mms, amateur porn, homemade porn and more." />
        <meta name="keywords" content="porn,free porn videos,HD porn,4K porn,porn streaming,watch porn online,porn tube,porn site,pornhub alternative,xhamster alternative,xvideos alternative,desi mms,indian mms,mms videos,leaked mms,amateur porn,homemade porn,milf,teen,anal,blowjob,creampie,big ass,big tits,latina,asian,ebony,lesbian,threesome,webcam,hentai,JAV,POV,hardcore,xmaster,xmaster.guru" />
        <link rel="canonical" href="https://xmaster.guru" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Xmaster - Free porn Videos | HD porn Streaming" />
        <meta property="og:description" content="Watch free HD porn videos online. Thousands of porn clips updated daily. Best porn tube alternative." />
        <meta property="og:url" content="https://xmaster.guru" />
        <meta property="og:image" content="https://xmaster.guru/logo.jpg" />
        <meta property="og:site_name" content="Xmaster" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Xmaster - Free porn Videos | HD Streaming" />
        <meta name="twitter:description" content="Watch free HD porn videos online. Updated daily." />
        <meta name="twitter:image" content="https://xmaster.guru/logo.jpg" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        <GlobalAdsLoader />

        {/* ONE top banner ad only */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {isMobile ? (
            <AdSlot adCode={ADS.mobile320x50} label="Sponsored" className="flex justify-center" />
          ) : (
            <AdSlot adCode={ADS.footer728x90} label="Sponsored" className="flex justify-center" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ==================== MAIN CONTENT ==================== */}
            <div className="flex-1">
              <h1 className="sr-only">
                Xmaster - Free porn Videos | Watch HD porn Online | Best porn Tube Site | Alternative to pornhub xhamster Xvideos
              </h1>

              {/* Featured Videos */}
              {featuredVideos.length > 0 && (
                <section className="mb-10">
                  <SectionHeader icon={FiStar} title="Featured Videos" iconColor="text-yellow-500" />
                  {loading ? (
                    <VideoGridSkeleton count={6} columns={3} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {featuredVideos.slice(0, 6).map((video) => (
                        <VideoCard key={video._id} video={video} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* All Videos with Infinite Scroll */}
              <section className="mb-10">
                <SectionHeader
                  icon={FiClock}
                  title={`Latest Videos${totalVideos > 0 ? ` (${totalVideos})` : ''}`}
                  link="/search?sort=newest"
                  linkText="View All"
                  iconColor="text-blue-500"
                />

                {loading ? (
                  <VideoGridSkeleton count={12} columns={4} />
                ) : (
                  <>
                    {renderVideosWithAds()}

                    <div
                      ref={loadMoreRef}
                      className="py-8 flex flex-col items-center justify-center"
                      style={{ minHeight: '100px' }}
                    >
                      {loadingMore && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading more videos...</span>
                        </div>
                      )}
                      {!hasMore && allVideos.length > 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          You've reached the end • {allVideos.length} of {totalVideos} videos loaded
                        </p>
                      )}
                                           {hasMore && !loadingMore && (
                        <button
                          onClick={() => {
                            console.log('[BUTTON] === CLICKED ===');
                            console.log('[BUTTON] loadingMoreRef:', loadingMoreRef.current);
                            console.log('[BUTTON] hasMoreRef:', hasMoreRef.current);
                            console.log('[BUTTON] pageRef:', pageRef.current);
                            console.log('[BUTTON] allVideos count:', allVideos.length);
                            loadMoreVideos();
                          }}
                          className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors text-base active:scale-95 shadow-lg"
                        >
                          Load More Videos ({allVideos.length} of {totalVideos})
                        </button>
                      )}
                    </div>
                  </>
                )}
              </section>

              {/* Categories */}
              {categories.length > 0 && (
                <section id="categories" className="mb-10">
                  <SectionHeader title="Browse Categories" iconColor="text-purple-500" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {categories.map((category) => (
                      <CategoryCard key={category._id} category={category} />
                    ))}
                  </div>
                </section>
              )}

              {/* SEO Content */}
              <section className="mb-10 bg-white dark:bg-dark-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Popular Porn Categories on Xmaster
                </h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {SEO_CATEGORIES.map((cat, i) => (
                    <Link
                      key={i}
                      to={`/search?q=${encodeURIComponent(cat)}`}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-primary-600 hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-3 leading-relaxed">
                  <p>
                    <strong>Xmaster</strong> is your ultimate destination for free porn videos online.
                    We offer a massive collection of HD and 4K Porn content across hundreds of categories
                    including mms videos, porn videos, latest mms viral videos porn, latest porn, and many more.
                  </p>
                  <p>
                    Looking for an alternative to pornhub, xhamster, or xvideos? Xmaster provides
                    the same premium experience with faster streaming, better video quality, and a
                    cleaner interface.
                  </p>
                  <p>
                    Whether you enjoy anal, hardcore, sex videos, latest porn, MMS videos, desi content, or
                    any other category, Xmaster has thousands of free porn videos ready to stream.
                    No signup required.
                  </p>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Why Choose Xmaster?
                </h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 list-disc list-inside">
                  <li>Free HD & 4K porn video streaming</li>
                  <li>Thousands of porn videos updated daily</li>
                  <li>Hundreds of porn categories to explore</li>
                  <li>Fast loading and smooth playback</li>
                  <li>Works on all devices - mobile, desktop, tablet</li>
                  <li>No registration required</li>
                  <li>Best alternative to pornhub, xhamster, xvideos</li>
                </ul>
              </section>

              {/* Comments */}
              <section className="mb-10">
                <SectionHeader title="💬 Comments" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div><CommentForm /></div>
                  <div><CommentsList /></div>
                </div>
              </section>
            </div>

            {/* ==================== SIDEBAR (1 ad only) ==================== */}
            <aside className="w-full lg:w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-20 space-y-6">
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link to="/trending" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <span className="text-red-500">🔥</span>
                      <span className="text-gray-700 dark:text-gray-300">Trending Videos</span>
                    </Link>
                    <Link to="/search?sort=newest" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <FiClock className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Latest Uploads</span>
                    </Link>
                  </div>
                </div>

                {/* ONE sidebar ad only */}
                <div className="flex justify-center">
                  <AdSlot adCode={ADS.sidebar160x300} label="Sponsored" />
                </div>

                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Popular Searches</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {["HD Porn", "Amateur", "MILF", "Teen", "Desi", "MMS", "Anal", "POV", "Lesbian", "Homemade", "Indian", "Webcam"].map((tag, i) => (
                      <Link
                        key={i}
                        to={`/search?q=${encodeURIComponent(tag)}`}
                        className="px-2 py-1 bg-dark-100 text-gray-400 text-[10px] rounded hover:bg-primary-600 hover:text-white transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer Ad */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="py-6 border-t border-gray-200 dark:border-dark-100">
            {isMobile ? (
              <AdSlot adCode={ADS.footer300x250} label="Sponsored" className="flex justify-center" />
            ) : (
              <AdSlot adCode={ADS.footer728x90} label="Sponsored" className="flex justify-center" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const SectionHeader = ({ icon: Icon, title, link, linkText, iconColor = 'text-primary-500' }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
      {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />}
      {title}
    </h2>
    {link && (
      <Link to={link} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        {linkText}
        <FiChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

const CategoryCard = ({ category }) => (
  <Link
    to={`/category/${category.slug}`}
    className="group card p-4 text-center hover:shadow-lg transition-all"
    style={{ borderTop: `3px solid ${category.color || '#ef4444'}` }}
  >
    <div className="text-3xl mb-2">{category.icon || '📁'}</div>
    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors text-sm sm:text-base">
      {category.name}
    </h3>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
      {category.videoCount || 0} videos
    </p>
  </Link>
);

export default HomePage;