import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiTrendingUp, FiClock, FiStar, FiChevronRight } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoGrid, { VideoGridSkeleton } from '../../components/video/VideoGrid';
import VideoCard from '../../components/video/VideoCard';
import AdBanner from '../../components/ads/AdBanner';

const HomePage = () => {
  const [data, setData] = useState({
    featuredVideos: [],
    latestVideos: [],
    trendingVideos: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);

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
        {/* Top Ad */}
        <AdBanner placement="home_top" className="max-w-7xl mx-auto px-4 pt-4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Featured */}
              {data.featuredVideos.length > 0 && (
                <section className="mb-10">
                  <SectionHeader icon={FiStar} title="Featured Videos" iconColor="text-yellow-500" />
                  {loading ? <VideoGridSkeleton count={6} columns={3} /> : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {data.featuredVideos.slice(0, 6).map((video) => (
                        <VideoCard key={video._id} video={video} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* In-feed Ad */}
              <AdBanner placement="home_infeed" className="mb-8" />

              {/* Latest */}
              <section className="mb-10">
                <SectionHeader icon={FiClock} title="Latest Videos" link="/search?sort=newest" linkText="View All" iconColor="text-blue-500" />
                {loading ? <VideoGridSkeleton count={8} /> : <VideoGrid videos={data.latestVideos} columns={4} />}
              </section>

              {/* Another In-feed Ad */}
              <AdBanner placement="home_infeed" className="mb-8" />

              {/* Trending */}
              <section className="mb-10">
                <SectionHeader icon={FiTrendingUp} title="Trending Now" link="/trending" linkText="View All" iconColor="text-red-500" />
                {loading ? <VideoGridSkeleton count={8} /> : <VideoGrid videos={data.trendingVideos} columns={4} />}
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

            {/* Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                <AdBanner placement="home_sidebar" />

                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link to="/trending" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <FiTrendingUp className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700 dark:text-gray-300">Trending Videos</span>
                    </Link>
                    <Link to="/search?sort=newest" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <FiClock className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Latest Uploads</span>
                    </Link>
                  </div>
                </div>

                <AdBanner placement="home_sidebar" />
              </div>
            </aside>
          </div>
        </div>

        {/* Footer Ad */}
        <AdBanner placement="home_footer" className="max-w-7xl mx-auto px-4 pb-6" />
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
        {linkText}<FiChevronRight className="w-4 h-4" />
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