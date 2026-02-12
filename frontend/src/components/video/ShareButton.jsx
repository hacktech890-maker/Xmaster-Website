// frontend/src/components/video/ShareButton.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FiShare2, FiX, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';

// ==========================================
// CONSTANTS
// ==========================================
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.xmaster.guru/api';

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";

// ==========================================
// ICONS
// ==========================================
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ==========================================
// HELPERS
// ==========================================

const getThumbnail = (video) => {
  if (!video) return PLACEHOLDER;
  const thumb = video.thumbnail;
  if (thumb && thumb.startsWith('http')) return thumb;
  if (thumb && thumb.length > 3) return `https://abyss.to/splash/${thumb}.jpg`;
  if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
  return PLACEHOLDER;
};

const formatViews = (views) => {
  if (!views) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return views.toString();
};

/**
 * Track share event
 */
const trackShare = async (videoId, platform) => {
  try {
    await fetch(`${API_BASE}/public/share/${videoId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
  } catch (e) {
    // Silent fail - tracking is non-critical
  }
};

// ==========================================
// SHARE MODAL COMPONENT
// ==========================================

const ShareModal = ({ video, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const modalRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  const thumbnail = getThumbnail(video);

  // THE KEY URL: Share URL points to backend SSR page (has OG tags)
  const shareUrl = `${API_BASE}/public/share/${video._id}`;

  // Video page URL (where user actually watches)
  const videoPageUrl = `${window.location.origin}/watch/${video._id}${
    video.slug ? '/' + video.slug : ''
  }`;

  const shareTitle = video.title || 'Watch this video';
  const shareText = `${shareTitle}`;

  // ==========================================
  // SHARE HANDLERS
  // ==========================================

  const handleTelegramShare = () => {
    trackShare(video._id, 'telegram');
    // Use shareUrl (backend SSR page) so Telegram fetches OG tags
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareSuccess('Telegram');
    setTimeout(() => setShareSuccess(''), 2000);
  };

  const handleWhatsAppShare = () => {
    trackShare(video._id, 'whatsapp');
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareSuccess('WhatsApp');
    setTimeout(() => setShareSuccess(''), 2000);
  };

  const handleFacebookShare = () => {
    trackShare(video._id, 'facebook');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    setShareSuccess('Facebook');
    setTimeout(() => setShareSuccess(''), 2000);
  };

  const handleTwitterShare = () => {
    trackShare(video._id, 'twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    setShareSuccess('Twitter');
    setTimeout(() => setShareSuccess(''), 2000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      trackShare(video._id, 'native');
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      setShareSuccess('Shared!');
      setTimeout(() => {
        setShareSuccess('');
        onClose();
      }, 1500);
    } catch (e) {
      // User cancelled - that's fine
      if (e.name !== 'AbortError') {
        console.error('Share failed:', e);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      // Copy the direct video page URL (nicer for users)
      await navigator.clipboard.writeText(videoPageUrl);
    } catch (e) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = videoPageUrl;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    trackShare(video._id, 'copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyShareLink = async () => {
    // Copy the share URL (with OG tags) - for power users
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (e) {
      const input = document.createElement('input');
      input.value = shareUrl;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Share platform configs
  const platforms = [
    {
      name: 'Telegram',
      icon: <TelegramIcon />,
      color: 'bg-[#0088cc] hover:bg-[#0077b5]',
      shadow: 'shadow-[0_4px_15px_rgba(0,136,204,0.3)]',
      onClick: handleTelegramShare,
      priority: true,
    },
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon />,
      color: 'bg-[#25D366] hover:bg-[#20bd5a]',
      shadow: 'shadow-[0_4px_15px_rgba(37,211,102,0.3)]',
      onClick: handleWhatsAppShare,
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      color: 'bg-[#1877F2] hover:bg-[#1565d8]',
      shadow: 'shadow-[0_4px_15px_rgba(24,119,242,0.3)]',
      onClick: handleFacebookShare,
    },
    {
      name: 'Twitter / X',
      icon: <TwitterIcon />,
      color: 'bg-black hover:bg-gray-800',
      shadow: 'shadow-[0_4px_15px_rgba(0,0,0,0.3)]',
      onClick: handleTwitterShare,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full sm:w-[440px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1a2e] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-share-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShare2 className="w-5 h-5 text-blue-500" />
            Share Video
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-white/5">
          <div className="w-28 h-[72px] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 relative">
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = PLACEHOLDER;
              }}
            />
            {video.duration && video.duration !== '00:00' && (
              <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[9px] font-medium rounded">
                {video.duration}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
              {video.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              {formatViews(video.views || 0)} views
              {video.duration && video.duration !== '00:00' && ` • ${video.duration}`}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {shareSuccess && (
          <div className="mx-4 mt-3 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 animate-fade-in">
            <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {shareSuccess === 'Shared!' ? 'Shared successfully!' : `Opening ${shareSuccess}...`}
            </span>
          </div>
        )}

        {/* Share Platforms */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3 mb-5">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={platform.onClick}
                className="flex flex-col items-center gap-2 group focus:outline-none"
                aria-label={`Share to ${platform.name}`}
              >
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-white 
                    ${platform.color} ${platform.shadow}
                    transform transition-all duration-200 
                    group-hover:scale-110 group-active:scale-95
                    ${platform.priority ? 'ring-2 ring-offset-2 ring-blue-400 dark:ring-offset-[#1a1a2e]' : ''}
                  `}
                >
                  {platform.icon}
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-tight text-center">
                  {platform.name}
                </span>
                {platform.priority && (
                  <span className="text-[9px] text-blue-500 font-semibold -mt-1">
                    ★ BEST
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Native Share Button (Mobile) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              <FiExternalLink className="w-5 h-5" />
              More Share Options
            </button>
          )}

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Video Link
            </label>
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 rounded-xl">
              <input
                type="text"
                readOnly
                value={videoPageUrl}
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate px-2 font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopyLink}
                className={`
                  flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                  ${
                    copied
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                  }
                `}
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tip for Telegram */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>💡 Tip:</strong> For the best preview with thumbnail on Telegram, use the
              Telegram share button above. The link will show a rich preview card with the video
              thumbnail.
            </p>
          </div>
        </div>

        {/* Bottom safe area for mobile */}
        <div className="h-2 sm:h-0" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes share-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-share-slide-up {
          animation: share-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// ==========================================
// SHARE BUTTON (Exported Component)
// ==========================================

const ShareButton = ({ video, className = '', variant = 'default' }) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  if (variant === 'icon-only') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${className}`}
          aria-label="Share video"
          title="Share"
        >
          <FiShare2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <ShareModal video={video} isOpen={showModal} onClose={handleClose} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all ${className}`}
        >
          <FiShare2 className="w-3.5 h-3.5" />
          Share
        </button>
        <ShareModal video={video} isOpen={showModal} onClose={handleClose} />
      </>
    );
  }

  // Default variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all ${className}`}
      >
        <FiShare2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </button>
      <ShareModal video={video} isOpen={showModal} onClose={handleClose} />
    </>
  );
};

export default ShareButton;
export { ShareModal };