import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../../services/api';
import VideoGrid from '../../components/video/VideoGrid';
import Pagination from '../../components/common/Pagination';
import AdBanner from '../../components/ads/AdBanner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;

  const [category, setCategory] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await publicAPI.getCategoryVideos(slug, { page, sort, limit: 20 });
        if (response.data.success) {
          setCategory(response.data.category);
          setVideos(response.data.videos);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error('Failed to fetch category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, page, sort]);

  const handleSortChange = (newSort) => {
    setSearchParams(prev => {
      prev.set('sort', newSort);
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !category) {
    return <LoadingSpinner fullScreen />;
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-400">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Category Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} Videos - Xmaster</title>
        <meta name="description" content={category.description || `Watch ${category.name} videos`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        {/* Category Header */}
        <div 
          className="bg-white dark:bg-dark-300 border-b border-gray-100 dark:border-dark-100"
          style={{ borderTop: `4px solid ${category.color || '#ef4444'}` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon || '📁'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {category.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {pagination.total} videos
                </p>
              </div>
            </div>

            {/* Sort */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input-field py-2 w-auto"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Ad */}
        <AdBanner placement="category_top" className="max-w-7xl mx-auto px-4 pt-6" />

        {/* Videos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <VideoGrid 
            videos={videos} 
            loading={loading}
            emptyMessage="No videos in this category yet"
          />

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
};

export default CategoryPage;