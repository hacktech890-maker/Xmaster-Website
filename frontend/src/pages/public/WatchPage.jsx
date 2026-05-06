// src/pages/public/WatchPage.jsx
// COMPLETE REDESIGN — Premium video watch page
// Preserves: all existing API calls, like/dislike logic, report form,
//            view recording, share tracking, embed URL handling
// Adds: premium layout, skeleton loading, delayed ads, modern UI

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiThumbsUp, FiThumbsDown, FiShare2,
  FiFlag, FiEye, FiClock, FiTag,
  FiChevronDown, FiChevronUp, FiX,
  FiAlertCircle, FiArrowLeft,
  FiHeart, FiBookmark, FiDownload,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// API
import { publicAPI } from '../../services/api';

// Utils
import {
  getThumbnailUrl,
  formatViews,
  formatViewsShort,
  formatDuration,
  formatDate,
  formatDateAbsolute,
  getSessionId,
  getWatchUrl,
  generateSlug,
} from '../../utils/helpers';

// Components
import VideoPlayer    from '../../components/video/VideoPlayer';
import RelatedVideos  from '../../components/video/RelatedVideos';
import ShareButton    from '../../components/video/ShareButton';
import CommentForm    from '../../components/comments/CommentForm';
import CommentsList   from '../../components/comments/CommentsList';
import AdSlot, { GlobalAdsLoader } from '../../components/ads/AdSlot';
import { WatchPageSkeleton }        from '../../components/video/VideoCardSkeleton';
import SectionRow     from '../../components/home/SectionRow';
import Badge          from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Hooks
import { useIsMobile, useIsDesktop } from '../../hooks/useMediaQuery';

// ============================================================
// REPORT REASONS — preserved from original
// ============================================================

const REPORT_REASONS = [
  'Underage content',
  'Non-consensual content',
  'Spam or misleading',
  'Copyright violation',
  'Wrong category',
  'Broken video',
  'Other',
];

// ============================================================
// WATCH PAGE COMPONENT
// ============================================================

const WatchPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop= useIsDesktop();

  // ── Video data ─────────────────────────────────────────────
  const [video,         setVideo]         = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [comments,      setComments]      = useState([]);
  const [randomVideos,  setRandomVideos]  = useState([]);

  // ── Loading / error ────────────────────────────────────────
  const [loading,         setLoading]         = useState(true);
  const [loadingRelated,  setLoadingRelated]  = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error,           setError]           = useState(null);

  // ── UI state ───────────────────────────────────────────────
  const [liked,         setLiked]         = useState(false);
  const [disliked,      setDisliked]      = useState(false);
  const [likeCount,     setLikeCount]     = useState(0);
  const [dislikeCount,  setDislikeCount]  = useState(0);
  const [showReport,    setShowReport]    = useState(false);
  const [reportReason,  setReportReason]  = useState('');
  const [reportingNow,  setReportingNow]  = useState(false);
  const [showFullDesc,  setShowFullDesc]  = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [viewRecorded,  setViewRecorded]  = useState(false);

  // Mounted ref for cleanup
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Fetch video on ID change ───────────────────────────────
  useEffect(() => {
    if (!id) return;
    // Reset all state on ID change
    setVideo(null);
    setRelatedVideos([]);
    setComments([]);
    setLiked(false);
    setDisliked(false);
    setLikeCount(0);
    setDislikeCount(0);
    setShowReport(false);
    setShowFullDesc(false);
    setShowComments(false);
    setViewRecorded(false);
    setLoading(true);
    setError(null);
    setLoadingRelated(true);

    fetchVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ============================================================
  // FETCH VIDEO
  // ============================================================

  const fetchVideo = async () => {
    try {
      const res  = await publicAPI.getVideo(id);
      const data = res?.data?.video || res?.data || res;

      if (!mountedRef.current) return;

      if (!data || !data._id) {
        setError('Video not found');
        setLoading(false);
        return;
      }

      setVideo(data);
      setLikeCount(data.likes || 0);
      setDislikeCount(data.dislikes || 0);
      setLoading(false);

      // SEO slug redirect if needed
      const expectedSlug = generateSlug(data.title || '');
      const currentPath  = window.location.pathname;
      if (expectedSlug && !currentPath.includes(expectedSlug)) {
        navigate(`/watch/${id}/${expectedSlug}`, { replace: true });
      }

      // Record view (after 5s delay — user is actually watching)
      setTimeout(() => {
        if (mountedRef.current && !viewRecorded) {
          recordView();
        }
      }, 5000);

      // Fetch related videos
      fetchRelated(data._id);

    } catch (err) {
      if (mountedRef.current) {
        const status = err?.response?.status;
        if (status === 404) {
          setError('Video not found or has been removed.');
        } else {
          setError('Failed to load video. Please try again.');
        }
        setLoading(false);
      }
    }
  };

  // ============================================================
  // FETCH RELATED VIDEOS
  // ============================================================

  const fetchRelated = async (videoId) => {
    setLoadingRelated(true);
    try {
      const res  = await publicAPI.getRelatedVideos(videoId, 15);
      const data = res?.data?.videos || res?.data || [];

      if (!mountedRef.current) return;

      if (Array.isArray(data) && data.length > 0) {
        setRelatedVideos(data);
      } else {
        // Fallback to random videos
        fetchRandomVideos(videoId);
      }
    } catch {
      fetchRandomVideos(videoId);
    } finally {
      if (mountedRef.current) setLoadingRelated(false);
    }
  };

  const fetchRandomVideos = async (excludeId) => {
    try {
      const res  = await publicAPI.getRandomVideos(15, excludeId);
      const data = res?.data?.videos || res?.data || [];
      if (mountedRef.current && Array.isArray(data)) {
        setRelatedVideos(data);
      }
    } catch {
      if (mountedRef.current) setRelatedVideos([]);
    } finally {
      if (mountedRef.current) setLoadingRelated(false);
    }
  };

  // ============================================================
  // RECORD VIEW — existing logic preserved
  // ============================================================

  const recordView = useCallback(async () => {
    if (viewRecorded) return;
    try {
      await publicAPI.recordView(id, { sessionId: getSessionId() });
      if (mountedRef.current) {
        setViewRecorded(true);
        setVideo((prev) => prev
          ? { ...prev, views: (prev.views || 0) + 1 }
          : prev
        );
      }
    } catch {
      // Non-critical — don't show error to user
    }
  }, [id, viewRecorded]);

  // ============================================================
  // LIKE / DISLIKE — optimistic UI, existing API preserved
  // ============================================================

  const handleLike = async () => {
    if (liked) return;

    // Optimistic update
    setLiked(true);
    setLikeCount((p) => p + 1);
    if (disliked) {
      setDisliked(false);
      setDislikeCount((p) => Math.max(0, p - 1));
    }

    try {
      await publicAPI.likeVideo(id);
    } catch {
      // Rollback on error
      if (mountedRef.current) {
        setLiked(false);
        setLikeCount((p) => Math.max(0, p - 1));
        toast.error('Failed to like video');
      }
    }
  };

  const handleDislike = async () => {
    if (disliked) return;

    // Optimistic update
    setDisliked(true);
    setDislikeCount((p) => p + 1);
    if (liked) {
      setLiked(false);
      setLikeCount((p) => Math.max(0, p - 1));
    }

    try {
      await publicAPI.dislikeVideo(id);
    } catch {
      if (mountedRef.current) {
        setDisliked(false);
        setDislikeCount((p) => Math.max(0, p - 1));
        toast.error('Failed to dislike video');
      }
    }
  };

  // ============================================================
  // REPORT — existing logic preserved, alert() replaced with toast
  // ============================================================

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    setReportingNow(true);
    try {
      await publicAPI.reportVideo(id, { reason: reportReason });
      toast.success('Report submitted. Thank you!');
      setShowReport(false);
      setReportReason('');
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      if (mountedRef.current) setReportingNow(false);
    }
  };

  // ============================================================
  // FETCH COMMENTS (lazy — only when user opens section)
  // ============================================================

  const fetchComments = useCallback(async () => {
    if (loadingComments || comments.length > 0) return;
    setLoadingComments(true);
    try {
      const res  = await publicAPI.getPublicComments({ videoId: id });
      const data = res?.data?.comments || res?.data || [];
      if (mountedRef.current) {
        setComments(Array.isArray(data) ? data : []);
      }
    } catch {
      if (mountedRef.current) setComments([]);
    } finally {
      if (mountedRef.current) setLoadingComments(false);
    }
  }, [id, loadingComments, comments.length]);

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) fetchComments();
  };

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const embedUrl   = video?.embed_code || video?.embedUrl;
  const thumbUrl   = video ? getThumbnailUrl(video) : null;
  const watchUrl   = video ? `https://xmaster.guru${getWatchUrl(video)}` : '';
  const duration   = formatDuration(video?.duration);
  const viewCount  = formatViews(video?.views);
  const uploadDate = formatDateAbsolute(video?.uploadDate || video?.createdAt);
  const tags       = video?.tags || [];
  const hasDesc    = video?.description && video.description.length > 0;
  const descLong   = hasDesc && video.description.length > 200;

  // Like/dislike ratio bar
  const totalVotes = likeCount + dislikeCount;
  const likeRatio  = totalVotes > 0 ? (likeCount / totalVotes) * 100 : 0;

  // ============================================================
  // RENDER: LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-400">
        <GlobalAdsLoader />
        <div className="container-site py-6">
          <WatchPageSkeleton />
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center p-4">
        <div className="
          max-w-md w-full text-center
          glass-card p-8 rounded-2xl
        ">
          <div className="
            w-16 h-16 rounded-2xl mb-5 mx-auto
            bg-red-500/10 border border-red-500/20
            flex items-center justify-center
          ">
            <FiAlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Video Unavailable
          </h1>
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link to="/" className="btn-primary">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: MAIN WATCH PAGE
  // ============================================================

  return (
    <>
      {/* ── SEO ──────────────────────────────────────────────── */}
      <Helmet>
        <title>{video.title} — Xmaster</title>
        <meta
          name="description"
          content={
            video.description
              ? video.description.substring(0, 155)
              : `Watch ${video.title} on Xmaster. Free adult video streaming.`
          }
        />
        <meta property="og:title"       content={video.title} />
        <meta property="og:description" content={video.description || `Watch ${video.title} on Xmaster`} />
        <meta property="og:image"       content={thumbUrl} />
        <meta property="og:url"         content={watchUrl} />
        <meta property="og:type"        content="video.other" />
        <meta name="twitter:card"       content="summary_large_image" />
        <meta name="twitter:title"      content={video.title} />
        <meta name="twitter:image"      content={thumbUrl} />
        {video.embed_code && (
          <meta property="og:video" content={video.embed_code} />
        )}
      </Helmet>

      {/* Global ads — delayed */}
      <GlobalAdsLoader />

      <div className="min-h-screen bg-dark-400">
        <div className="container-site py-4 sm:py-6">

          {/* ── MAIN GRID ─────────────────────────────────────── */}
          <div className="
            grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]
            gap-6 lg:gap-8
          ">

            {/* ================================================
                LEFT COLUMN — Player + Info
                ================================================ */}
            <div className="min-w-0">

              {/* ── Video Player ──────────────────────────────── */}
              <div className="mb-4">
                <VideoPlayer
                  embedUrl={embedUrl}
                  title={video.title}
                  autoPlay={false}
                />
              </div>

              {/* ── Top ad (mobile only, 320x50) ─────────────── */}
              {isMobile && (
                <div className="flex justify-center mb-4">
                  <AdSlot
                    placement="watch_bottom"
                    delay={2000}
                  />
                </div>
              )}

              {/* ── Video Title ───────────────────────────────── */}
              <h1 className="
                text-lg sm:text-xl lg:text-2xl
                font-bold text-white leading-snug
                mb-3
              ">
                {video.title}
              </h1>

              {/* ── Meta row ─────────────────────────────────── */}
              <div className="
                flex flex-wrap items-center gap-x-4 gap-y-2
                text-sm text-white/40 mb-4
              ">
                {/* Views */}
                <span className="flex items-center gap-1.5">
                  <FiEye className="w-3.5 h-3.5 text-white/30" />
                  {viewCount}
                </span>

                {/* Duration */}
                {duration && (
                  <span className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-white/30" />
                    {duration}
                  </span>
                )}

                {/* Upload date */}
                {uploadDate && (
                  <span className="hidden sm:flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-white/30" />
                    {uploadDate}
                  </span>
                )}

                {/* Category */}
                {video.category && (
                  <Link
                    to={`/category/${
                      typeof video.category === 'string'
                        ? video.category
                        : video.category?.slug || ''
                    }`}
                    className="
                      text-primary-400 hover:text-primary-300
                      font-medium transition-colors duration-200
                    "
                  >
                    {typeof video.category === 'string'
                      ? video.category
                      : video.category?.name || ''}
                  </Link>
                )}
              </div>

              {/* ── Divider ───────────────────────────────────── */}
              <div className="h-px bg-white/6 mb-4" />

              {/* ── Action Bar ───────────────────────────────── */}
              <ActionBar
                liked={liked}
                disliked={disliked}
                likeCount={likeCount}
                dislikeCount={dislikeCount}
                likeRatio={likeRatio}
                totalVotes={totalVotes}
                onLike={handleLike}
                onDislike={handleDislike}
                videoId={id}
                videoTitle={video.title}
                watchUrl={watchUrl}
                onReport={() => setShowReport(true)}
              />

              {/* ── Divider ───────────────────────────────────── */}
              <div className="h-px bg-white/6 mt-4 mb-4" />

              {/* ── Tags ─────────────────────────────────────── */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-white/30 mr-1">
                    <FiTag className="w-3 h-3" />
                    Tags:
                  </span>
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tag/${encodeURIComponent(tag)}`}
                      className="
                        px-2.5 py-1 rounded-full
                        text-xs font-medium
                        bg-white/6 text-white/50
                        hover:bg-primary-600/15 hover:text-white
                        border border-white/8 hover:border-primary-600/25
                        transition-all duration-200
                      "
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Description ──────────────────────────────── */}
              {hasDesc && (
                <div className="
                  rounded-xl p-4
                  bg-white/[0.025] border border-white/6
                  mb-4
                ">
                  <p className={`
                    text-sm text-white/60 leading-relaxed
                    whitespace-pre-line
                    ${!showFullDesc && descLong ? 'line-clamp-3' : ''}
                  `}>
                    {video.description}
                  </p>
                  {descLong && (
                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="
                        mt-2 flex items-center gap-1
                        text-xs text-primary-400 hover:text-primary-300
                        transition-colors duration-200
                      "
                    >
                      {showFullDesc
                        ? <><FiChevronUp className="w-3.5 h-3.5" /> Show less</>
                        : <><FiChevronDown className="w-3.5 h-3.5" /> Show more</>
                      }
                    </button>
                  )}
                </div>
              )}

              {/* ── Desktop bottom ad (728x90) ───────────────── */}
              {!isMobile && (
                <div className="flex justify-center mb-6">
                  <AdSlot
                    placement="watch_bottom"
                    delay={2500}
                    label
                  />
                </div>
              )}

              {/* ── Report Form ──────────────────────────────── */}
              {showReport && (
                <ReportForm
                  reason={reportReason}
                  setReason={setReportReason}
                  onSubmit={handleReport}
                  onCancel={() => { setShowReport(false); setReportReason(''); }}
                  submitting={reportingNow}
                />
              )}

              {/* ── Comments Section ─────────────────────────── */}
              <CommentsSection
                videoId={id}
                comments={comments}
                loading={loadingComments}
                open={showComments}
                onToggle={handleToggleComments}
                onCommentAdded={fetchComments}
              />

              {/* ── Native ad ────────────────────────────────── */}
              <div className="mt-6">
                <AdSlot
                  placement="watch_native"
                  delay={3500}
                  label
                />
              </div>

              {/* ── Related videos (mobile — below player) ───── */}
              {isMobile && (
                <div className="mt-8">
                  <RelatedVideos
                    videos={relatedVideos}
                    loading={loadingRelated}
                    layout="sidebar"
                    title="Up Next"
                  />
                </div>
              )}

            </div>

            {/* ================================================
                RIGHT COLUMN — Sidebar (desktop only)
                ================================================ */}
            {!isMobile && (
              <aside className="hidden lg:block">

                {/* Sticky wrapper */}
                <div
                  className="sticky top-20 space-y-5"
                  style={{ maxHeight: 'calc(100vh - 84px)', overflowY: 'auto' }}
                >
                  {/* ── Sidebar ad (300x250) ──────────────────── */}
                  <div className="flex justify-center">
                    <AdSlot
                      placement="watch_sidebar"
                      delay={1500}
                      label
                    />
                  </div>

                  {/* ── Related videos ────────────────────────── */}
                  <RelatedVideos
                    videos={relatedVideos}
                    loading={loadingRelated}
                    layout="sidebar"
                    title="Up Next"
                    maxItems={15}
                  />

                </div>
              </aside>
            )}

          </div>

          {/* ── MORE LIKE THIS — horizontal row below ─────────── */}
          {relatedVideos.length > 0 && !loadingRelated && (
            <div className="mt-10 sm:mt-12">
              <SectionRow
                title="More Like This"
                videos={relatedVideos.slice(0, 12)}
                loading={false}
                icon="trending"
                accentColor="#e11d48"
                skeletonCount={6}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ============================================================
// ACTION BAR COMPONENT
// ============================================================

const ActionBar = ({
  liked, disliked,
  likeCount, dislikeCount,
  likeRatio, totalVotes,
  onLike, onDislike,
  videoId, videoTitle, watchUrl,
  onReport,
}) => (
  <div className="space-y-3">

    {/* Buttons row */}
    <div className="flex flex-wrap items-center gap-2">

      {/* Like */}
      <button
        onClick={onLike}
        aria-label="Like"
        className={`
          flex items-center gap-2
          px-4 py-2.5 rounded-xl text-sm font-semibold
          border transition-all duration-200
          ${liked
            ? 'bg-primary-600/20 text-primary-400 border-primary-600/30'
            : 'bg-white/6 text-white/60 border-white/10 hover:bg-white/12 hover:text-white'
          }
        `}
      >
        <FiThumbsUp
          className={`w-4 h-4 transition-transform duration-200 ${liked ? 'scale-110' : ''}`}
          fill={liked ? 'currentColor' : 'none'}
        />
        <span>{formatViewsShort(likeCount)}</span>
      </button>

      {/* Dislike */}
      <button
        onClick={onDislike}
        aria-label="Dislike"
        className={`
          flex items-center gap-2
          px-4 py-2.5 rounded-xl text-sm font-semibold
          border transition-all duration-200
          ${disliked
            ? 'bg-white/15 text-white border-white/25'
            : 'bg-white/6 text-white/60 border-white/10 hover:bg-white/12 hover:text-white'
          }
        `}
      >
        <FiThumbsDown
          className={`w-4 h-4 transition-transform duration-200 ${disliked ? 'scale-110' : ''}`}
          fill={disliked ? 'currentColor' : 'none'}
        />
        <span>{formatViewsShort(dislikeCount)}</span>
      </button>

      {/* Share */}
      <ShareButton
        videoId={videoId}
        title={videoTitle}
        url={watchUrl}
        variant="button"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Report */}
      <button
        onClick={onReport}
        aria-label="Report"
        className="
          flex items-center gap-1.5
          px-3 py-2.5 rounded-xl text-xs font-medium
          text-white/30 hover:text-red-400
          bg-white/4 hover:bg-red-500/10
          border border-white/8 hover:border-red-500/20
          transition-all duration-200
        "
      >
        <FiFlag className="w-3.5 h-3.5" />
        Report
      </button>
    </div>

    {/* Like/dislike ratio bar */}
    {totalVotes > 0 && (
      <div className="space-y-1">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-700"
            style={{ width: `${likeRatio}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/25">
          <span>{Math.round(likeRatio)}% liked</span>
          <span>{formatViewsShort(totalVotes)} votes</span>
        </div>
      </div>
    )}
  </div>
);

// ============================================================
// REPORT FORM COMPONENT
// ============================================================

const ReportForm = ({
  reason, setReason,
  onSubmit, onCancel,
  submitting,
}) => (
  <div className="
    rounded-xl p-4 sm:p-5 mb-4
    bg-red-500/5 border border-red-500/15
    animate-fade-in-up
  ">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400">
        <FiFlag className="w-4 h-4" />
        Report Video
      </h3>
      <button
        onClick={onCancel}
        className="text-white/30 hover:text-white/70 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>

    {/* Reason grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
      {REPORT_REASONS.map((r) => (
        <button
          key={r}
          onClick={() => setReason(r)}
          className={`
            px-3 py-2.5 rounded-xl text-sm text-left
            border transition-all duration-150
            ${reason === r
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-white/4 text-white/50 border-white/8 hover:bg-white/8 hover:text-white/70'
            }
          `}
        >
          {r}
        </button>
      ))}
    </div>

    {/* Submit */}
    <div className="flex gap-2">
      <button
        onClick={onSubmit}
        disabled={!reason || submitting}
        className="
          flex-1 py-2.5 rounded-xl
          text-sm font-semibold
          bg-red-600/80 text-white
          hover:bg-red-600
          disabled:opacity-40 disabled:pointer-events-none
          transition-all duration-200
          flex items-center justify-center gap-2
        "
      >
        {submitting ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <FiFlag className="w-3.5 h-3.5" />
            Submit Report
          </>
        )}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 transition-all duration-200"
      >
        Cancel
      </button>
    </div>
  </div>
);

// ============================================================
// COMMENTS SECTION COMPONENT
// ============================================================

const CommentsSection = ({
  videoId, comments, loading,
  open, onToggle, onCommentAdded,
}) => (
  <div className="
    rounded-xl overflow-hidden
    border border-white/8
  ">
    {/* Toggle header */}
    <button
      onClick={onToggle}
      className="
        w-full flex items-center justify-between
        px-4 py-3.5
        bg-white/[0.03] hover:bg-white/[0.05]
        transition-colors duration-200
        text-left
      "
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
        <svg
          className="w-4 h-4 text-primary-500"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Comments
        {comments.length > 0 && (
          <span className="
            px-1.5 py-0.5 rounded-full
            text-[10px] font-bold
            bg-primary-600/20 text-primary-400
          ">
            {comments.length}
          </span>
        )}
      </span>
      <span className="text-white/30">
        {open
          ? <FiChevronUp className="w-4 h-4" />
          : <FiChevronDown className="w-4 h-4" />
        }
      </span>
    </button>

    {/* Collapsible content */}
    {open && (
      <div className="p-4 space-y-4 border-t border-white/6 animate-fade-in-down">
        {/* Comment form */}
        <CommentForm
          videoId={videoId}
          onCommentAdded={onCommentAdded}
        />

        {/* Comments list */}
        {(loading || comments.length > 0) && (
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
              {loading ? 'Loading comments...' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
            </p>
            <CommentsList
              comments={comments}
              loading={loading}
            />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    )}
  </div>
);

export default WatchPage;