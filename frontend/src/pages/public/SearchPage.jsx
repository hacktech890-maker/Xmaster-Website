import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import VideoGrid from '../../components/video/VideoGrid';
import Pagination from '../../components/common/Pagination';
import AdBanner from '../../components/ads/AdBanner';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tag } = useParams();
  
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories
  useEffect(() => {
    publicAPI.getCategories()
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let response;
        
        if (tag) {
          response = await publicAPI.searchByTag(tag, { page, sort, limit: 20 });
        } else if (query) {
          // Has search query — use search endpoint
          response = await publicAPI.searchVideos({ 
            q: query, 
            page, 
            sort, 
            category,
            limit: 20 
          });
        } else {
          // No query — "Browse All" / "View All"
          // Use getVideos endpoint which returns all public videos
          response = await publicAPI.getVideos({ 
            page, 
            sort, 
            category,
            limit: 20 
          });
        }

        if (response.data.success) {
          setVideos(response.data.videos || []);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (error) {
        console.error('Search/Browse failed:', error);
        // Fallback: try getVideos
        try {
          const fallback = await publicAPI.getVideos({ page, sort, limit: 20 });
          if (fallback.data.success) {
            setVideos(fallback.data.videos || []);
            if (fallback.data.pagination) {
              setPagination(fallback.data.pagination);
            }
          }
        } catch (e2) {
          console.error('Fallback also failed:', e2);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, sort, category, page, tag]);

  const handleSortChange = (newSort) => {
    setSearchParams(prev => {
      prev.set('sort', newSort);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleCategoryChange = (newCategory) => {
    setSearchParams(prev => {
      if (newCategory) {
        prev.set('category', newCategory);
      } else {
        prev.delete('category');
      }
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

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'likes', label: 'Most Liked' },
  ];

  // Only show relevance option when there's a search query
  if (query) {
    sortOptions.unshift({ value: 'relevance', label: 'Relevance' });
  }

  const pageTitle = tag 
    ? `#${tag} - Tag Results` 
    : query 
      ? `Search: ${query}` 
      : 'Browse All Videos';

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Xmaster</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        {/* Header */}
        <div className="bg-white dark:bg-dark-300 border-b border-gray-100 dark:border-dark-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tag ? (
                    <><span className="text-primary-500">#</span>{tag}</>
                  ) : query ? (
                    <>Results for "<span className="text-primary-500">{query}</span>"</>
                  ) : (
                    'Browse All Videos'
                  )}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {pagination.total} videos found
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input-field py-2 pr-8"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden p-2 bg-gray-100 dark:bg-dark-200 rounded-lg"
                >
                  <FiFilter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filters */}
            {categories.length > 0 && (
              <div className={`mt-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      !category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-100'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryChange(cat._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        category === cat._id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <AdBanner placement="search_top" className="max-w-7xl mx-auto px-4 pt-6" />

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <VideoGrid 
            videos={videos} 
            loading={loading}
            emptyMessage={
              query 
                ? `No videos found for "${query}"`
                : 'No videos found'
            }
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

export default SearchPage;