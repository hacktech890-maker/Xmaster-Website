import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFilter } from 'react-icons/fi';
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

// ==================== SEARCH PAGE ====================
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
          response = await publicAPI.searchByTag(tag, { page, sort, limit: 40 });
        } else if (query) {
          response = await publicAPI.searchVideos({
            q: query,
            page,
            sort,
            category,
            limit: 40
          });
        } else {
          response = await publicAPI.getVideos({
            page,
            sort,
            category,
            limit: 40
          });
        }

        if (response.data) {
          const vData = response.data;
          setVideos(vData.videos || []);
          if (vData.pagination) {
            setPagination(vData.pagination);
          }
        }
      } catch (error) {
        console.error('Search/Browse failed:', error);
        try {
          const fallback = await publicAPI.getVideos({ page, sort, limit: 40 });
          if (fallback.data) {
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
          {loading ? (
            <VideoGridSkeleton count={12} />
          ) : (
            <VideosWithAds
              videos={videos}
              columns={4}
            />
          )}

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