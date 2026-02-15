import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiTrendingUp } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoCard from '../../components/video/VideoCard';
import { VideoGridSkeleton } from '../../components/video/VideoGrid';
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
        <p className="text-gray-600 dark:text-gray-400">No trending videos found</p>
      </div>
    );
  }

  const videosPerRow = isMobile ? 2 : 4;
  const adInterval = videosPerRow * 3; // Every 3 rows

  const items = [];
  let adCount = 0;

  for (let i = 0; i < videos.length; i++) {
    items.push(
      <VideoCard key={videos[i]._id} video={videos[i]} />
    );

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

// ==================== TRENDING PAGE ====================
const TrendingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await publicAPI.getTrendingVideos(48);
        if (response.data?.success) {
          setVideos(response.data.videos || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <>
      <Helmet>
        <title>Trending Videos - Xmaster</title>
        <meta name="description" content="Watch the most popular and trending videos on Xmaster." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-red-500" />
              </div>
              Trending Videos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Most popular videos right now
            </p>
          </div>

          <AdBanner placement="search_top" className="mb-6" />

          {loading ? (
            <VideoGridSkeleton count={12} />
          ) : (
            <VideosWithAds videos={videos} columns={4} />
          )}
        </div>
      </div>
    </>
  );
};

export default TrendingPage;