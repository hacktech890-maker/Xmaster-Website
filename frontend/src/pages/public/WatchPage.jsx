// frontend/src/pages/public/WatchPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiEye, FiCalendar, FiClock, FiThumbsUp, FiThumbsDown,
  FiFlag, FiChevronDown, FiChevronUp,
} from "react-icons/fi";
import { publicAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ShareButton from '../../components/video/ShareButton';


// ==================== CONSTANTS ====================
const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";

// ==================== AD CODES ====================
const ADS = {
  sidebar300x250: `<script>
    atOptions = {
      'key' : '14ec0d1a96c62198d09309e2e93cdbe1',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/14ec0d1a96c62198d09309e2e93cdbe1/invoke.js"></script>`,

  bottom728x90: `<script>
    atOptions = {
      'key' : '63bdafcb22010cae5f0bf88ebb77480d',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/63bdafcb22010cae5f0bf88ebb77480d/invoke.js"></script>`,

  mobile320x50: `<script>
    atOptions = {
      'key' : '6234f16279422f68f13fae0f6cd38e19',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/6234f16279422f68f13fae0f6cd38e19/invoke.js"></script>`,

  nativeBanner: `<script async="async" data-cfasync="false" src="https://pl28697514.effectivegatecpm.com/ff1ceb8407fd04d767e71ec9b3d366ef/invoke.js"></script>
  <div id="container-ff1ceb8407fd04d767e71ec9b3d366ef"></div>`,

  socialBar: `<script src="https://pl28697422.effectivegatecpm.com/7e/56/ba/7e56ba1b0754a8958ee3f0800dac7a0d.js"></script>`,
};

// ==================== HELPERS ====================
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

const getThumbnail = (v) => {
  if (!v) return PLACEHOLDER;
  const thumb = v.thumbnail;
  if (thumb && thumb.startsWith("http")) return thumb;
  if (thumb && thumb.length > 3) return `https://abyss.to/splash/${thumb}.jpg`;
  if (v.file_code) return `https://abyss.to/splash/${v.file_code}.jpg`;
  return PLACEHOLDER;
};

// ==================== AD INJECTOR COMPONENT ====================
const AdSlot = ({ adCode, label = "Sponsored", className = "" }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!adCode || !containerRef.current || loaded.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    loaded.current = true;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = adCode;

    const scripts = tempDiv.querySelectorAll("script");
    const nonScript = adCode.replace(/<script[\s\S]*?<\/script>/gi, "");

    if (nonScript.trim()) {
      const div = document.createElement("div");
      div.innerHTML = nonScript;
      container.appendChild(div);
    }

    scripts.forEach((orig) => {
      const s = document.createElement("script");
      Array.from(orig.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (orig.textContent) s.textContent = orig.textContent;
      if (orig.src) {
        s.src = orig.src;
        s.async = true;
      }
      container.appendChild(s);
    });

    return () => {
      if (container) container.innerHTML = "";
      loaded.current = false;
    };
  }, [adCode]);

  if (!adCode) return null;

  return (
    <div className={`ad-slot ${className}`}>
      {label && (
        <span className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1 block">
          {label}
        </span>
      )}
      <div
        ref={containerRef}
        className="ad-content flex justify-center items-center bg-gray-50 dark:bg-dark-200 rounded-xl overflow-hidden"
      />
    </div>
  );
};

// ==================== SOCIAL BAR LOADER ====================
const SocialBarLoader = () => {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.src =
      "https://pl28697422.effectivegatecpm.com/7e/56/ba/7e56ba1b0754a8958ee3f0800dac7a0d.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      loaded.current = false;
    };
  }, []);

  return null;
};


// ==================== MAIN WATCH PAGE ====================
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update document head with OG tags for this video
  useEffect(() => {
    if (!video) return;

    const thumbnail = getThumbnail(video);

    // Update page title
    document.title = `${video.title} - Xmaster`;

    // Update or create meta tags
    const updateMeta = (property, content, isName = false) => {
      const attr = isName ? "name" : "property";
      let tag = document.querySelector(`meta[${attr}="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMeta("og:title", video.title);
    updateMeta("og:description", video.description || `Watch ${video.title} on Xmaster`);
    updateMeta("og:image", thumbnail);
    updateMeta("og:url", window.location.href);
    updateMeta("og:type", "video.other");
    updateMeta("og:site_name", "Xmaster");
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:title", video.title, true);
    updateMeta("twitter:description", video.description || `Watch ${video.title} on Xmaster`, true);
    updateMeta("twitter:image", thumbnail, true);

    return () => {
      document.title = "Xmaster - Watch Videos Online";
    };
  }, [video]);

  // Fetch data
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
          const relRes = await publicAPI.getRelatedVideos(id, 15);
          if (relRes.data?.success) setRelatedVideos(relRes.data.videos || []);
        } catch (e) {
          try {
            const latRes = await publicAPI.getLatestVideos(15);
            if (latRes.data?.success)
              setRelatedVideos((latRes.data.videos || []).filter((v) => v._id !== id));
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

  // Actions
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

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await publicAPI.reportVideo(id, { reason: reportReason });
      setShowReport(false);
      setReportReason("");
      alert("Report submitted!");
    } catch (e) {
      alert("Failed to submit report");
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-400 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ERROR
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
  const filtered = relatedVideos.filter((v) => v._id !== id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
      <SocialBarLoader />

      <div className="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-0 sm:gap-6">
          {/* ==================== LEFT COLUMN ==================== */}
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

            {/* Video Info */}
            <div className="px-4 sm:px-0 mt-3">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiEye className="w-4 h-4" />
                  {formatViews(video.views || 0)} views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {formatDate(video.uploadDate || video.createdAt)}
                </span>
                {duration && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {duration}
                    </span>
                  </>
                )}
              </div>

              {/* ==================== SOCIAL BAR (UPDATED) ==================== */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pb-4 border-b border-gray-200 dark:border-dark-100">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    liked
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200"
                  }`}
                >
                  <FiThumbsUp className="w-4 h-4" />
                  <span>{formatViews(likes)}</span>
                </button>

                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    disliked
                      ? "bg-gray-600 text-white"
                      : "bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200"
                  }`}
                >
                  <FiThumbsDown className="w-4 h-4" />
                  <span>{formatViews(dislikes)}</span>
                </button>

                {/* ✅ NEW: ShareButton component replaces old share button + modal */}
                <ShareButton video={video} />

                <button
                  onClick={() => setShowReport(!showReport)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all ml-auto"
                >
                  <FiFlag className="w-4 h-4" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>

              {/* Report Form */}
              {showReport && (
                <div className="mt-3 p-4 bg-gray-100 dark:bg-dark-200 rounded-xl animate-fade-in">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Report Video
                  </h4>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-100 rounded-lg text-sm text-gray-900 dark:text-white mb-2"
                  >
                    <option value="">Select reason...</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="copyright">Copyright Violation</option>
                    <option value="spam">Spam / Misleading</option>
                    <option value="broken">Video Not Working</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReport}
                      disabled={!reportReason}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowReport(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              {video.description && (
                <div className="mt-4">
                  <div
                    className={`bg-gray-100 dark:bg-dark-200 rounded-xl p-4 cursor-pointer transition-all ${
                      descExpanded ? "" : "max-h-24 overflow-hidden"
                    }`}
                    onClick={() => setDescExpanded(!descExpanded)}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                  {video.description.length > 150 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="flex items-center gap-1 mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {descExpanded ? (
                        <>Show less <FiChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Show more <FiChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {video.category && (
                  <span className="px-3 py-1 bg-primary-600/10 text-primary-600 text-xs font-medium rounded-full">
                    {typeof video.category === "string"
                      ? video.category
                      : video.category?.name || "General"}
                  </span>
                )}
                {video.tags?.map((tag, i) => (
                  <Link
                    key={i}
                    to={`/tag/${tag}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-dark-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {!isMobile && (
                <div className="mt-6">
                  <AdSlot adCode={ADS.nativeBanner} label="Suggested for you" className="rounded-xl overflow-hidden" />
                </div>
              )}

              {!isMobile && (
                <div className="mt-6 mb-6">
                  <AdSlot adCode={ADS.bottom728x90} label="Sponsored" className="flex justify-center" />
                </div>
              )}

              {isMobile && (
                <div className="mt-6">
                  <AdSlot adCode={ADS.mobile320x50} label="Sponsored" className="flex justify-center" />
                </div>
              )}
            </div>

            {/* MOBILE: Related Videos */}
            <div className="lg:hidden px-4 sm:px-0 mt-6 mb-8">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Recommended Videos
              </h3>
              <div className="space-y-3">
                {filtered.slice(0, 10).map((v) => (
                  <RelatedVideoCard key={v._id} video={v} />
                ))}
              </div>
            </div>
          </div>

          {/* ==================== RIGHT SIDEBAR ==================== */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-20">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Recommended Videos
              </h3>
              <div className="space-y-3">
                {filtered.slice(0, 3).map((v) => (
                  <RelatedVideoCard key={v._id} video={v} />
                ))}

                <div className="py-2">
                  <AdSlot
                    adCode={ADS.sidebar300x250}
                    label="Sponsored"
                    className="rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-200 p-3"
                  />
                </div>

                {filtered.slice(3, 12).map((v) => (
                  <RelatedVideoCard key={v._id} video={v} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== RELATED VIDEO CARD ====================
const RelatedVideoCard = ({ video }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/watch/${video._id}${video.slug ? `/${video.slug}` : ""}`}
      className="flex gap-3 group rounded-xl hover:bg-gray-100 dark:hover:bg-dark-200 p-2 transition-colors"
    >
      <div className="relative w-[168px] min-w-[168px] sm:w-[180px] sm:min-w-[180px]">
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-100">
          <img
            src={imgError ? PLACEHOLDER : getThumbnail(video)}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
        {video.duration && video.duration !== "00:00" && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
            {video.duration}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-500 line-clamp-2 leading-snug transition-colors">
          {video.title}
        </h4>
        <div className="mt-2 space-y-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <FiEye className="w-3 h-3" />
            {formatViews(video.views || 0)} views
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeDate(video.uploadDate || video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default WatchPage;