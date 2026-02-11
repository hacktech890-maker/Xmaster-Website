import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiTrendingUp, FiClock, FiStar, FiChevronRight } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoGrid, { VideoGridSkeleton } from '../../components/video/VideoGrid';
import VideoCard from '../../components/video/VideoCard';
import AdBanner from '../../components/ads/AdBanner';

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
  // Mobile 320x50 - Browse section
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

  // Footer 728x90 - Desktop
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

  // Footer 300x250 - Mobile
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

// ==================== MAIN HOMEPAGE ====================
const HomePage = () => {
  const [data, setData] = useState({
    featuredVideos: [],
    latestVideos: [],
    trendingVideos: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Detect mobile
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
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Xmaster - Watch Videos Online</title>
        <meta name="description" content="Watch and enjoy high-quality videos on Xmaster." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        {/* Top Ad from Admin Panel */}
        <AdBanner placement="home_top" className="max-w-7xl mx-auto px-4 pt-4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ==================== MAIN CONTENT ==================== */}
            <div className="flex-1">
              {/* Featured Videos */}
              {data.featuredVideos.length > 0 && (
                <section className="mb-10">
                  <SectionHeader icon={FiStar} title="Featured Videos" iconColor="text-yellow-500" />
                  {loading ? (
                    <VideoGridSkeleton count={6} columns={3} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {data.featuredVideos.slice(0, 6).map((video) => (
                        <VideoCard key={video._id} video={video} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ============ MOBILE AD: After Featured, before Latest ============ */}
              {isMobile && (
                <div className="mb-8">
                  <AdSlot
                    adCode={ADS.mobile320x50}
                    label="Sponsored"
                    className="flex justify-center"
                  />
                </div>
              )}

              {/* Admin Panel In-feed Ad (Desktop) */}
              {!isMobile && <AdBanner placement="home_infeed" className="mb-8" />}

              {/* Latest Videos */}
              <section className="mb-10">
                <SectionHeader
                  icon={FiClock}
                  title="Latest Videos"
                  link="/search?sort=newest"
                  linkText="View All"
                  iconColor="text-blue-500"
                />
                {loading ? (
                  <VideoGridSkeleton count={8} />
                ) : (
                  <VideoGrid videos={data.latestVideos} columns={4} />
                )}
              </section>

              {/* ============ MOBILE AD: After Latest, before Trending ============ */}
              {isMobile && (
                <div className="mb-8">
                  <AdSlot
                    adCode={ADS.mobile320x50}
                    label="Sponsored"
                    className="flex justify-center"
                  />
                </div>
              )}

              {/* Admin Panel In-feed Ad (Desktop) */}
              {!isMobile && <AdBanner placement="home_infeed" className="mb-8" />}

              {/* Trending Videos */}
              <section className="mb-10">
                <SectionHeader
                  icon={FiTrendingUp}
                  title="Trending Now"
                  link="/trending"
                  linkText="View All"
                  iconColor="text-red-500"
                />
                {loading ? (
                  <VideoGridSkeleton count={8} />
                ) : (
                  <VideoGrid videos={data.trendingVideos} columns={4} />
                )}
              </section>

              {/* Categories */}
              {data.categories.length > 0 && (
                <section id="categories" className="mb-10">
                  <SectionHeader title="Browse Categories" iconColor="text-purple-500" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {data.categories.map((category) => (
                      <CategoryCard key={category._id} category={category} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ==================== SIDEBAR (Desktop Only) ==================== */}
            <aside className="w-full lg:w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-20 space-y-6">
                {/* Admin Panel Sidebar Ad */}
                <AdBanner placement="home_sidebar" />

                {/* Quick Links */}
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link
                      to="/trending"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                    >
                      <FiTrendingUp className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700 dark:text-gray-300">Trending Videos</span>
                    </Link>
                    <Link
                      to="/search?sort=newest"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                    >
                      <FiClock className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Latest Uploads</span>
                    </Link>
                  </div>
                </div>

                {/* Second Admin Panel Sidebar Ad */}
                <AdBanner placement="home_sidebar" />
              </div>
            </aside>
          </div>
        </div>

        {/* ==================== FOOTER AD SECTION ==================== */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {/* Desktop: 728x90 banner above footer */}
          {!isMobile && (
            <div className="py-6 border-t border-gray-200 dark:border-dark-100">
              <AdSlot
                adCode={ADS.footer728x90}
                label="Sponsored"
                className="flex justify-center"
              />
            </div>
          )}

          {/* Mobile: 300x250 above footer */}
          {isMobile && (
            <div className="py-6 border-t border-gray-200 dark:border-dark-100">
              <AdSlot
                adCode={ADS.footer300x250}
                label="Sponsored"
                className="flex justify-center"
              />
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
      <Link
        to={link}
        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
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