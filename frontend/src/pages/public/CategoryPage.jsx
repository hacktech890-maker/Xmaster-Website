import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../../services/api';
import VideoCard from '../../components/video/VideoCard';
import { VideoGridSkeleton } from '../../components/video/VideoGrid';
import Pagination from '../../components/common/Pagination';
import AdBanner from '../../components/ads/AdBanner';

// ==================== NATIVE BANNER AD ====================
const NativeBannerAd = ({ className = "" }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);
  const uniqueId = useRef(`native-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!containerRef.current || loaded.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    loaded.current = true;

    const containerId = `container-3ebdaa444c50232518b3752efc451cab-${uniqueId.current}`;

    const div = document.createElement("div");
    div.id = containerId;
    container.appendChild(div);

    const invokeScript = document.createElement("script");
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");
    invokeScript.src = "https://pl28704186.effectivegatecpm.com/3ebdaa444c50232518b3752efc451cab/invoke.js";
    container.appendChild(invokeScript);

    return () => {
      if (container) container.innerHTML = "";
      loaded.current = false;
    };
  }, []);

  return (
    <div className={`col-span-full py-3 ${className}`}>
      <div className="bg-gray-100/50 dark:bg-dark-200/50 rounded-xl p-3">
        <span className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1 block text-center">
          Sponsored
        </span>
        <div ref={containerRef} className="ad-content flex justify-center items-center" />
      </div>
    </div>
  );
};

// ==================== RENDER VIDEOS WITH ADS ====================
const VideosWithAds = ({ videos, columns = 4 }) => {
  const isMobile = window.innerWidth < 1024;

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎬</div>
        <p className="text-gray-600 dark:text-gray-400">No videos found</p>
      </div>
    );
  }

  // Calculate videos per row based on screen
  // Mobile: 2 per row, Tablet: 3, Desktop: 4
  const videosPerRow = isMobile ? 2 : 4;
  const adInterval = videosPerRow * 3; // Every 3 rows

  const items = [];
  let adCount = 0;

  for (let i = 0; i < videos.length; i++) {
    items.push(
      <VideoCard key={videos[i]._id} video={videos[i]} />
    );

    // Insert native banner ad after every 3 rows
    if ((i + 1) % adInterval === 0 && i < videos.length - 1) {
      items.push(
        <NativeBannerAd key={`native-ad-${adCount}`} />
      );
      adCount++;
    }
  }

  const gridCols = {
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-3 sm:gap-4 md:gap-6`}>
      {items}
    </div>
  );
};

// ==================== CATEGORY PAGE ====================
const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      try {
        const catResponse = await publicAPI.getCategory(slug);
        if (catResponse.data?.success) {
          setCategory(catResponse.data.category);
        }

        const vidResponse = await publicAPI.getCategoryVideos(slug, { page, limit: 40 });
        if (vidResponse.data?.success) {
          setVideos(vidResponse.data.videos || []);
          if (vidResponse.data.pagination) {
            setPagination(vidResponse.data.pagination);
          }
        }
      } catch (error) {
        console.error('Failed to fetch category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
    window.scrollTo({ top: 0 });
  }, [slug, page]);

  const categoryName = category?.name || slug?.replace(/-/g, ' ') || 'Category';
  const categoryIcon = category?.icon || '📁';
  const categoryColor = category?.color || '#ef4444';

  return (
    <>
      <Helmet>
        <title>{categoryName} - Xmaster</title>
        <meta name="description" content={`Watch ${categoryName} videos on Xmaster.`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${categoryColor}20` }}
              >
                {categoryIcon}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {categoryName}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {pagination.total || videos.length} videos
                </p>
              </div>
            </div>
          </div>

          <AdBanner placement="category_top" className="mb-6" />

          {loading ? (
            <VideoGridSkeleton count={12} />
          ) : (
            <VideosWithAds videos={videos} columns={4} />
          )}

          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;