import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../../services/api';
import VideoGrid, { VideoGridSkeleton } from '../../components/video/VideoGrid';
import Pagination from '../../components/common/Pagination';
import AdBanner from '../../components/ads/AdBanner';

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

        const vidResponse = await publicAPI.getCategoryVideos(slug, { page, limit: 20 });
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
            <VideoGrid
              videos={videos}
              columns={4}
              emptyMessage={`No videos found in ${categoryName}`}
            />
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