// src/pages/public/SearchPage.jsx
// Modern search page — handles both /search?q= and /tag/:tag routes
// Preserves: all existing publicAPI search calls, tag search, pagination

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet }  from 'react-helmet-async';
import {
  FiSearch, FiFilter, FiGrid, FiList,
  FiTrendingUp, FiX, FiTag, FiChevronDown,
  FiSliders,
} from 'react-icons/fi';

import { publicAPI }   from '../../services/api';
import SearchBar       from '../../components/common/SearchBar';
import VideoGrid       from '../../components/video/VideoGrid';
import VideoCardHorizontal from '../../components/video/VideoCardHorizontal';
import { VideoCardHorizontalSkeleton } from '../../components/video/VideoCardHorizontal';
import Pagination      from '../../components/common/Pagination';
import TrendingTags    from '../../components/home/TrendingTags';
import Badge           from '../../components/common/Badge';

// ============================================================
// CONSTANTS
// ============================================================

const RESULTS_PER_PAGE = 24;

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant' },
  { id: 'views',     label: 'Most Viewed'   },
  { id: 'date',      label: 'Newest First'  },
  { id: 'duration',  label: 'Duration'      },
];

// ============================================================
// SEARCH PAGE
// ============================================================

const SearchPage = () => {
  const [searchParams]    = useSearchParams();
  const { tag }           = useParams();
  const navigate          = useNavigate();

  // Determine mode: tag search vs keyword search
  const isTagMode  = Boolean(tag);
  const queryParam = searchParams.get('q') || '';

  // ── State ──────────────────────────────────────────────────
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy,     setSortBy]     = useState('relevance');
  const [viewMode,   setViewMode]   = useState('grid');   // 'grid' | 'list'
  const [showFilters,setShowFilters]= useState(false);
  const [relatedTags,setRelatedTags]= useState([]);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Re-fetch when query/tag/sort changes ──────────────────
  useEffect(() => {
    setResults([]);
    setPage(1);
    setTotalPages(1);
    setTotalCount(0);
    doSearch(1, sortBy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam, tag, sortBy]);

  // ============================================================
  // SEARCH FUNCTION
  // ============================================================

  const doSearch = async (pg = 1, sort = sortBy) => {
    setLoading(true);
    setError(null);

    try {
      let res;

      if (isTagMode) {
        // Tag search — existing API
        res = await publicAPI.searchByTag(tag, {
          page:  pg,
          limit: RESULTS_PER_PAGE,
          sort,
        });
      } else if (queryParam.trim()) {
        // Keyword search — existing API
        res = await publicAPI.searchVideos({
          q:     queryParam.trim(),
          page:  pg,
          limit: RESULTS_PER_PAGE,
          sort,
        });
      } else {
        // No query — show latest
        res = await publicAPI.getVideos({
          page:   pg,
          limit:  RESULTS_PER_PAGE,
          status: 'public',
        });
      }

      if (!mountedRef.current) return;

      const data   = res?.data?.videos  || res?.data  || [];
      const pages  = res?.data?.totalPages || res?.data?.pages || 1;
      const count  = res?.data?.total   || res?.data?.count  || data.length;
      const tags   = res?.data?.relatedTags || res?.data?.tags || [];

      setResults(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setTotalCount(count);
      setRelatedTags(Array.isArray(tags) ? tags.slice(0, 15) : []);
      setPage(pg);

    } catch (err) {
      if (mountedRef.current) {
        setError('Search failed. Please try again.');
        setResults([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ── Page change ────────────────────────────────────────────
  const handlePageChange = (pg) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    doSearch(pg, sortBy);
  };

  // ── New search from SearchBar ──────────────────────────────
  const handleSearch = (q) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // ── Computed ───────────────────────────────────────────────
  const pageTitle = isTagMode
    ? `#${tag}`
    : queryParam
      ? `"${queryParam}"`
      : 'Browse All';

  const metaTitle = isTagMode
    ? `${tag} Videos — Xmaster`
    : `Search: ${queryParam} — Xmaster`;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta
          name="description"
          content={
            isTagMode
              ? `Watch ${tag} videos on Xmaster. Free adult content.`
              : `Search results for "${queryParam}" on Xmaster.`
          }
        />
        {isTagMode && (
          <link rel="canonical" href={`https://xmaster.guru/tag/${tag}`} />
        )}
      </Helmet>

      <div className="min-h-screen bg-dark-400">

        {/* ── Search Header ──────────────────────────────────── */}
        <div className="
          bg-gradient-to-b from-dark-500 to-dark-400
          border-b border-white/5
          py-6 sm:py-8
        ">
          <div className="container-site">

            {/* Search bar */}
            <div className="max-w-2xl mx-auto mb-5">
              <SearchBar
                initialQuery={queryParam}
                onSearch={handleSearch}
                size="lg"
                showPopular={!queryParam && !isTagMode}
                autoFocus={!queryParam && !isTagMode}
              />
            </div>

            {/* Page title + result count */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isTagMode ? (
                  <div className="flex items-center gap-2">
                    <div className="
                      w-8 h-8 rounded-lg
                      bg-primary-600/15 border border-primary-600/20
                      flex items-center justify-center
                    ">
                      <FiTag className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-white">
                        #{tag}
                      </h1>
                      {!loading && (
                        <p className="text-xs text-white/30">
                          {totalCount.toLocaleString()} videos
                        </p>
                      )}
                    </div>
                  </div>
                ) : queryParam ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-white/50 mb-0.5">
                      <FiSearch className="w-3.5 h-3.5" />
                      <span>Results for</span>
                    </div>
                    <h1 className="text-lg font-bold text-white">
                      {queryParam}
                    </h1>
                    {!loading && (
                      <p className="text-xs text-white/30 mt-0.5">
                        {totalCount.toLocaleString()} videos found
                      </p>
                    )}
                  </div>
                ) : (
                  <h1 className="text-lg font-bold text-white">
                    Browse All Videos
                  </h1>
                )}
              </div>

              {/* Controls row */}
              <div className="flex items-center gap-2">
                {/* Sort */}
                <SortDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_OPTIONS}
                />

                {/* View toggle */}
                <div className="
                  flex items-center
                  bg-white/[0.06] border border-white/10 rounded-xl
                  p-1 gap-1
                ">
                  <ViewBtn
                    active={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    icon={<FiGrid className="w-4 h-4" />}
                    label="Grid view"
                  />
                  <ViewBtn
                    active={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    icon={<FiList className="w-4 h-4" />}
                    label="List view"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ───────────────────────────────────── */}
        <div className="container-site py-6 sm:py-8">

          {/* Related tags */}
          {relatedTags.length > 0 && !loading && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FiTag className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                  Related Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map((t) => {
                  const name = typeof t === 'string' ? t : t.name || t.tag || '';
                  return (
                    <Link
                      key={name}
                      to={`/tag/${encodeURIComponent(name)}`}
                      className="
                        flex items-center gap-1
                        px-2.5 py-1 rounded-full
                        text-xs font-medium
                        bg-white/[0.06] text-white/50
                        hover:bg-primary-600/15 hover:text-white
                        border border-white/[0.08] hover:border-primary-600/25
                        transition-all duration-200
                      "
                    >
                      <FiHash className="w-2.5 h-2.5 opacity-50" />
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          {viewMode === 'grid' ? (
            <VideoGrid
              videos={results}
              loading={loading}
              error={error}
              onRetry={() => doSearch(page, sortBy)}
              skeletonCount={RESULTS_PER_PAGE}
              columns="default"
              showDate
              emptyTitle={
                isTagMode
                  ? `No videos tagged "${tag}"`
                  : queryParam
                    ? `No results for "${queryParam}"`
                    : 'No videos found'
              }
              emptyMessage="Try a different search term or browse by tags."
            />
          ) : (
            <ListView
              videos={results}
              loading={loading}
              error={error}
              onRetry={() => doSearch(page, sortBy)}
            />
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Trending tags if no query */}
          {!queryParam && !isTagMode && !loading && (
            <div className="mt-12">
              <TrendingTags
                title="Popular Tags"
                maxTags={24}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ============================================================
// LIST VIEW
// ============================================================

const ListView = ({ videos, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <VideoCardHorizontalSkeleton key={i} size="md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40 mb-4 text-sm">{error}</p>
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <div className="text-center py-16">
        <FiSearch className="w-10 h-10 text-white/15 mx-auto mb-4" />
        <p className="text-white/40 text-sm">No results found</p>
      </div>
    );
  }

  return (
    <div className="
      rounded-xl overflow-hidden
      border border-white/[0.06]
      divide-y divide-white/5
    ">
      {videos.map((video, i) => (
        <VideoCardHorizontal
          key={video._id || i}
          video={video}
          size="md"
          showDate
          showDesc
          index={i}
        />
      ))}
    </div>
  );
};

// ============================================================
// SORT DROPDOWN
// ============================================================

const SortDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2
          px-3 py-2 rounded-xl text-sm font-medium
          bg-white/[0.06] text-white/60 border border-white/10
          hover:bg-white/10 hover:text-white
          transition-all duration-200
        "
      >
        <FiSliders className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current?.label || 'Sort'}</span>
        <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="
          absolute right-0 top-full mt-2 z-50
          w-44 glass-modal rounded-xl overflow-hidden
          border border-white/10
          shadow-[0_20px_50px_rgba(0,0,0,0.6)]
          animate-fade-in-down
        ">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`
                w-full px-4 py-2.5 text-sm text-left
                transition-colors duration-150
                ${opt.id === value
                  ? 'bg-primary-600/15 text-primary-400'
                  : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// VIEW MODE BUTTON
// ============================================================

const ViewBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`
      p-1.5 rounded-lg transition-all duration-150
      ${active
        ? 'bg-white/15 text-white'
        : 'text-white/30 hover:text-white/60'
      }
    `}
  >
    {icon}
  </button>
);

// Fix missing import
const FiHash = FiTag;

export default SearchPage;