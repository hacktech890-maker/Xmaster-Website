import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiClock, FiStar, FiChevronRight, FiLoader } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import { VideoGridSkeleton } from '../../components/video/VideoGrid';
import VideoCard from '../../components/video/VideoCard';
import AdBanner from '../../components/ads/AdBanner';
import CommentForm from '../../components/comments/CommentForm';
import CommentsList from '../../components/comments/CommentsList';

// ==================== AD INJECTOR ====================
const AdSlot = ({ adCode, label = "Sponsored", className = "" }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!adCode || !containerRef.current || loaded.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    loaded.current = true;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = adCode;
    const scripts = tempDiv.querySelectorAll("script");
    const nonScript = adCode.replace(/<script[\s\S]*?<\/script>/gi, "");

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
      'key' : '6234f16279422f68f13fae0f6cd38e19',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/6234f16279422f68f13fae0f6cd38e19/invoke.js"></script>`,

  footer728x90: `<script>
    atOptions = {
      'key' : '63bdafcb22010cae5f0bf88ebb77480d',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/63bdafcb22010cae5f0bf88ebb77480d/invoke.js"></script>`,

  footer300x250: `<script>
    atOptions = {
      'key' : '14ec0d1a96c62198d09309e2e93cdbe1',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/14ec0d1a96c62198d09309e2e93cdbe1/invoke.js"></script>`,
};

// ==================== SEO KEYWORDS FOR HIDDEN TEXT ====================
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await publicAPI.getHomeData();
        if (response.data.success) {
          const data = response.data.data;
          setFeaturedVideos(data.featuredVideos || []);
          setCategories(data.categories || []);
          setAllVideos(data.latestVideos || []);
          if ((data.latestVideos || []).length < 12) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const response = await publicAPI.getVideos({
        page: nextPage,
        limit: 20,
        sort: 'newest',
      });

      if (response.data.success) {
        const newVideos = response.data.videos || [];
        if (newVideos.length === 0) {
          setHasMore(false);
        } else {
          setAllVideos(prev => {
            const existingIds = new Set(prev.map(v => v._id));
            const unique = newVideos.filter(v => !existingIds.has(v._id));
            return [...prev, ...unique];
          });
          setPage(nextPage);

          const pagination = response.data.pagination;
          if (pagination && nextPage >= pagination.pages) {
            setHasMore(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load more videos:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [loading, hasMore, loadingMore, loadMoreVideos]);

  const renderVideosWithAds = () => {
    if (allVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-600 dark:text-gray-400">No videos found</p>
        </div>
      );
    }

    const chunks = [];
    const videosPerChunk = isMobile ? 8 : 12;

    for (let i = 0; i < allVideos.length; i += videosPerChunk) {
      chunks.push(allVideos.slice(i, i + videosPerChunk));
    }

    return chunks.map((chunk, chunkIndex) => (
      <React.Fragment key={chunkIndex}>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {chunk.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>

        {chunkIndex < chunks.length - 1 && (
          <div className="my-6">
            {isMobile ? (
              <AdSlot adCode={ADS.mobile320x50} label="Sponsored" className="flex justify-center" />
            ) : (
              <AdBanner placement="home_infeed" />
            )}
          </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Xmaster - Free ___ Videos | Watch HD ___ Online | ___ Streaming Site</title>
        <meta name="description" content="Watch free HD ___ videos on Xmaster. Stream thousands of ___ clips in HD & 4K. Browse ___, ___, ___, ___, ___ categories. Best free ___ tube site. Alternative to ___hub, x___ster, ___videos. Updated daily with new ___ content. MMS videos, desi ___, indian ___, amateur ___, homemade ___ and more." />
        <meta name="keywords" content="___,free ___ videos,HD ___,4K ___,___ streaming,watch ___ online,___ tube,___ site,___hub alternative,x___ster alternative,___videos alternative,desi ___,indian ___,mms videos,leaked mms,amateur ___,homemade ___,milf,teen,anal,blowjob,creampie,big ass,big tits,latina,asian,ebony,lesbian,threesome,webcam,hentai,JAV,POV,hardcore,xmaster,xmaster.guru" />
        <link rel="canonical" href="https://xmaster.guru" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Xmaster - Free ___ Videos | HD ___ Streaming" />
        <meta property="og:description" content="Watch free HD ___ videos online. Thousands of ___ clips updated daily. Best ___ tube alternative." />
        <meta property="og:url" content="https://xmaster.guru" />
        <meta property="og:image" content="https://xmaster.guru/logo.jpg" />
        <meta property="og:site_name" content="Xmaster" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Xmaster - Free ___ Videos | HD Streaming" />
        <meta name="twitter:description" content="Watch free HD ___ videos online. Updated daily." />
        <meta name="twitter:image" content="https://xmaster.guru/logo.jpg" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        <AdBanner placement="home_top" className="max-w-7xl mx-auto px-4 pt-4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ==================== MAIN CONTENT ==================== */}
            <div className="flex-1">

              {/* SEO H1 - Hidden visually but readable by search engines */}
              <h1 className="sr-only">
                Xmaster - Free ___ Videos | Watch HD ___ Online | Best ___ Tube Site | Alternative to ___hub x___ster ___videos
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

              {isMobile && (
                <div className="mb-8">
                  <AdSlot adCode={ADS.mobile320x50} label="Sponsored" className="flex justify-center" />
                </div>
              )}

              {!isMobile && <AdBanner placement="home_infeed" className="mb-8" />}

              {/* All Videos with Infinite Scroll */}
              <section className="mb-10">
                <SectionHeader
                  icon={FiClock}
                  title="Latest Videos"
                  link="/search?sort=newest"
                  linkText="View All"
                  iconColor="text-blue-500"
                />

                {loading ? (
                  <VideoGridSkeleton count={12} columns={4} />
                ) : (
                  <>
                    {renderVideosWithAds()}

                    <div ref={loadMoreRef} className="py-8 flex justify-center">
                      {loadingMore && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading more videos...</span>
                        </div>
                      )}
                      {!hasMore && allVideos.length > 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          You've reached the end • {allVideos.length} videos loaded
                        </p>
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

              {/* ==================== SEO CONTENT SECTION ==================== */}
              <section className="mb-10 bg-white dark:bg-dark-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Popular ___ Categories on Xmaster
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
                    <strong>Xmaster</strong> is your ultimate destination for free ___ videos online.
                    We offer a massive collection of HD and 4K ___ content across hundreds of categories
                    including ___, ___, ___, ___, and many more. Our platform is updated daily with
                    fresh new ___ videos from top creators and amateur performers worldwide.
                  </p>
                  <p>
                    Looking for an alternative to ___hub, x___ster, or ___videos? Xmaster provides
                    the same premium experience with faster streaming, better video quality, and a
                    cleaner interface. Browse our trending section for the most popular ___ videos,
                    or explore our categories to find exactly what you're looking for.
                  </p>
                  <p>
                    Whether you enjoy ___, ___, ___, ___, MMS videos, desi content, or
                    any other category, Xmaster has thousands of free ___ videos ready to stream.
                    No signup required. Watch ___ videos for free in HD quality on any device -
                    desktop, mobile, or tablet.
                  </p>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Why Choose Xmaster?
                </h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 list-disc list-inside">
                  <li>Free HD & 4K ___ video streaming</li>
                  <li>Thousands of ___ videos updated daily</li>
                  <li>Hundreds of ___ categories to explore</li>
                  <li>Fast loading and smooth playback</li>
                  <li>Works on all devices - mobile, desktop, tablet</li>
                  <li>No registration required</li>
                  <li>Best alternative to ___hub, x___ster, ___videos</li>
                  <li>MMS videos, desi content, and regional ___ categories</li>
                  <li>Amateur, professional, and exclusive creator content</li>
                  <li>Safe and private browsing experience</li>
                </ul>
              </section>

              {/* Comments */}
              <section className="mb-10">
                <SectionHeader title="💬 Comments" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <CommentForm />
                  </div>
                  <div>
                    <CommentsList />
                  </div>
                </div>
              </section>
            </div>

            {/* ==================== SIDEBAR ==================== */}
            <aside className="w-full lg:w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-20 space-y-6">
                <AdBanner placement="home_sidebar" />

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

                {/* Sidebar SEO Tags */}
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Popular Searches</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {["HD ___", "Amateur", "MILF", "Teen", "Desi", "MMS", "Anal", "POV", "Lesbian", "Homemade", "Indian", "Webcam"].map((tag, i) => (
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

                <AdBanner placement="home_sidebar" />
              </div>
            </aside>
          </div>
        </div>

        {/* Footer Ad */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {!isMobile && (
            <div className="py-6 border-t border-gray-200 dark:border-dark-100">
              <AdSlot adCode={ADS.footer728x90} label="Sponsored" className="flex justify-center" />
            </div>
          )}
          {isMobile && (
            <div className="py-6 border-t border-gray-200 dark:border-dark-100">
              <AdSlot adCode={ADS.footer300x250} label="Sponsored" className="flex justify-center" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ==================== SECTION HEADER ====================
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

// ==================== CATEGORY CARD ====================
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