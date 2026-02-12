import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiTrendingUp } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoGrid, { VideoGridSkeleton } from '../../components/video/VideoGrid';
import Pagination from '../../components/common/Pagination';
import AdBanner from '../../components/ads/AdBanner';
import CommentForm from '../../components/comments/CommentForm';
import CommentsList from '../../components/comments/CommentsList';

const TrendingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await publicAPI.getTrendingVideos(24);
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

          {/* Top Ad */}
          <AdBanner placement="search_top" className="mb-6" />

          {/* Videos Grid */}
          {loading ? (
            <VideoGridSkeleton count={12} />
          ) : (
            <VideoGrid videos={videos} columns={4} emptyMessage="No trending videos found" />
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
            />
          )}

          {/* Comments Section */}
          <div className="mt-16 border-t border-gray-200 dark:border-dark-100 pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Comment Form */}
              <div>
                <CommentForm />
              </div>

              {/* Comments List */}
              <div>
                <CommentsList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrendingPage;