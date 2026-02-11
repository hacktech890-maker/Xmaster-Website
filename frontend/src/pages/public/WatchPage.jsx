import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiEye,
  FiCalendar,
  FiClock,
  FiThumbsUp,
  FiThumbsDown,
  FiShare2,
  FiFlag,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { publicAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AdBanner from "../../components/ads/AdBanner";

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return views.toString();
};

const formatDate = (date) => {
  if (!date) return "Unknown";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatRelativeDate = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return "";
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return formatDate(date);
};

function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await publicAPI.getVideo(id);
        const videoData = response.data?.video || response.data?.data || response.data;
        setVideo(videoData);
        setLikes(videoData.likes || 0);
        setDislikes(videoData.dislikes || 0);

        try { await publicAPI.recordView(id); } catch (e) {}

        try {
          const relatedRes = await publicAPI.getRelatedVideos(id, 12);
          if (relatedRes.data?.success) {
            setRelatedVideos(relatedRes.data.videos || []);
          }
        } catch (e) {
          try {
            const latestRes = await publicAPI.getLatestVideos(12);
            if (latestRes.data?.success) {
              setRelatedVideos((latestRes.data.videos || []).filter((v) => v._id !== id));
            }
          } catch (e2) {}
        }
      } catch (err) {
        setError("Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    try {
      await publicAPI.likeVideo(id);
      setLikes((p) => p + 1);
      setLiked(true);
      if (disliked) { setDislikes((p) => p - 1); setDisliked(false); }
    } catch (e) {}
  };

  const handleDislike = async () => {
    if (disliked) return;
    try {
      await publicAPI.dislikeVideo(id);
      setDislikes((p) => p + 1);
      setDisliked(true);
      if (liked) { setLikes((p) => p - 1); setLiked(false); }
    } catch (e) {}
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: video?.title, url }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await publicAPI.reportVideo(id, { reason: reportReason });
      setShowReport(false);
      setReportReason("");
      alert("Report submitted!");
    } catch (e) { alert("Failed to submit report"); }
  };

  const getThumbnail = (v) => {
    if (!v) return PLACEHOLDER;
    const thumb = v.thumbnail;
    if (thumb && thumb.startsWith("http")) return thumb;
    if (thumb && thumb.length > 3) return `https://abyss.to/splash/${thumb}.jpg`;
    if (v.file_code) return `https://abyss.to/splash/${v.file_code}.jpg`;
    return PLACEHOLDER;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-400 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-400 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-white mb-2">Video Not Found</h2>
        <p className="text-gray-400 mb-6">{error || "This video may have been removed."}</p>
        <Link to="/" className="btn-primary px-6 py-3">Go Home</Link>
      </div>
    );
  }

  const embedUrl = video.embed_code || video.embedUrl || "";
  const duration = video.duration && video.duration !== "00:00" ? video.duration : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
      <div className="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-0 sm:gap-6">
          {/* LEFT: VIDEO + INFO */}
          <div className="flex-1 min-w-0">
            {/* Video Player */}
            <div className="relative w-full bg-black sm:rounded-xl overflow-hidden">
              <div className="relative pt-[56.25%]">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Video not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Below Video Player */}
            <div className="px-4 sm:px-0 mt-3">
              <AdBanner placement="watch_below" className="mb-4" />
            </div>

            {/* Video Info */}
            <div className="px-4 sm:px-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><FiEye className="w-4 h-4" />{formatViews(video.views || 0)} views</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />{formatDate(video.uploadDate || video.createdAt)}</span>
                {duration && (<><span>•</span><span className="flex items-center gap-1"><FiClock className="w-4 h-4" />{duration}</span></>)}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pb-4 border-b border-gray-200 dark:border-dark-100">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${liked ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200"}`}>
                  <FiThumbsUp className="w-4 h-4" /><span>{formatViews(likes)}</span>
                </button>
                <button onClick={handleDislike} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${disliked ? "bg-gray-600 text-white" : "bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200"}`}>
                  <FiThumbsDown className="w-4 h-4" /><span>{formatViews(dislikes)}</span>
                </button>
                <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all">
                  <FiShare2 className="w-4 h-4" /><span className="hidden sm:inline">Share</span>
                </button>
                <button onClick={() => setShowReport(!showReport)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all ml-auto">
                  <FiFlag className="w-4 h-4" /><span className="hidden sm:inline">Report</span>
                </button>
              </div>

              {/* Report Form */}
              {showReport && (
                <div className="mt-3 p-4 bg-gray-100 dark:bg-dark-200 rounded-xl animate-fade-in">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Report Video</h4>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-100 rounded-lg text-sm text-gray-900 dark:text-white mb-2">
                    <option value="">Select reason...</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="copyright">Copyright Violation</option>
                    <option value="spam">Spam / Misleading</option>
                    <option value="broken">Video Not Working</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={handleReport} disabled={!reportReason} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">Submit</button>
                    <button onClick={() => setShowReport(false)} className="px-4 py-2 bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 text-sm rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              {/* Description */}
              {video.description && (
                <div className="mt-4">
                  <div className={`bg-gray-100 dark:bg-dark-200 rounded-xl p-4 cursor-pointer transition-all ${descExpanded ? "" : "max-h-24 overflow-hidden"}`} onClick={() => setDescExpanded(!descExpanded)}>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{video.description}</p>
                  </div>
                  {video.description.length > 150 && (
                    <button onClick={() => setDescExpanded(!descExpanded)} className="flex items-center gap-1 mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                      {descExpanded ? (<>Show less <FiChevronUp className="w-4 h-4" /></>) : (<>Show more <FiChevronDown className="w-4 h-4" /></>)}
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
                {video.category && (
                  <span className="px-3 py-1 bg-primary-600/10 text-primary-600 text-xs font-medium rounded-full">
                    {typeof video.category === "string" ? video.category : video.category?.name || "General"}
                  </span>
                )}
                {video.tags?.map((tag, i) => (
                  <Link key={i} to={`/tag/${tag}`} className="px-3 py-1 bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-dark-200 transition-colors">#{tag}</Link>
                ))}
              </div>
            </div>

            {/* MOBILE: Related Videos */}
            <div className="lg:hidden px-4 sm:px-0 mt-2 mb-8">
              <AdBanner placement="watch_related" className="mb-4" />
              <RelatedVideosList videos={relatedVideos} getThumbnail={getThumbnail} currentVideoId={id} />
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <AdBanner placement="watch_sidebar" />
              <RelatedVideosList videos={relatedVideos} getThumbnail={getThumbnail} currentVideoId={id} />
              <AdBanner placement="watch_sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const RelatedVideosList = ({ videos, getThumbnail, currentVideoId }) => {
  if (!videos || videos.length === 0) {
    return <div className="text-center py-8 text-gray-500"><p className="text-sm">No recommendations</p></div>;
  }

  return (
    <div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Recommended Videos</h3>
      <div className="space-y-3">
        {videos.filter((v) => v._id !== currentVideoId).slice(0, 15).map((v) => (
          <RelatedVideoCard key={v._id} video={v} getThumbnail={getThumbnail} />
        ))}
      </div>
    </div>
  );
};

const RelatedVideoCard = ({ video, getThumbnail }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/watch/${video._id}${video.slug ? `/${video.slug}` : ""}`} className="flex gap-3 group rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 p-1.5 transition-colors">
      <div className="relative w-[168px] min-w-[168px] sm:w-[180px] sm:min-w-[180px]">
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-100">
          <img src={imgError ? PLACEHOLDER : getThumbnail(video)} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={() => setImgError(true)} />
        </div>
        {video.duration && video.duration !== "00:00" && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">{video.duration}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 line-clamp-2 leading-snug transition-colors">{video.title}</h4>
        <div className="mt-1.5 space-y-0.5">
          <p className="text-xs text-gray-500 flex items-center gap-1"><FiEye className="w-3 h-3" />{formatViews(video.views || 0)} views</p>
          <p className="text-xs text-gray-500">{formatRelativeDate(video.uploadDate || video.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
};

export default WatchPage;