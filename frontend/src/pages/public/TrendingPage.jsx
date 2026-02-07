import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiTrendingUp, FiClock } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoGrid from '../../components/video/VideoGrid';
import AdBanner from '../../components/ads/AdBanner';

const TrendingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await publicAPI.getTrendingVideos(24, period);
        if (response.data.success) {
          setVideos(response.data.videos);
        }
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [period]);

  const periods = [
    { value: '24h', label: 'Today', icon: FiClock },
    { value: '7d', label: 'This Week', icon: FiTrendingUp },
    { value: '30d', label: 'This Month', icon: FiTrendingUp },
  ];

  return (
    <>
      <Helmet>
        <title>Trending Videos - Xmaster</title>
        <meta name="description" content="Watch the most popular trending videos on Xmaster" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Trending Videos
                </h1>
                <p className="text-white/80 mt-1">
                  Discover what's popular right now
                </p>
              </div>
            </div>

            {/* Period Tabs */}
            <div className="mt-8 flex gap-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    period === p.value
                      ? 'bg-white text-primary-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <p.icon className="w-4 h-4" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ad */}
        <AdBanner placement="home_top" className="max-w-7xl mx-auto px-4 pt-6" />

        {/* Videos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <VideoGrid 
            videos={videos} 
            loading={loading}
            emptyMessage="No trending videos found"
          />
        </div>
      </div>
    </>
  );
};

export default TrendingPage;