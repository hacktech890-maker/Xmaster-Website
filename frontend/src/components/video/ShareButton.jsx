// src/components/video/ShareButton.jsx
// Modern share button with platform options + copy link
// Tracks shares via existing publicAPI.trackShare()

import React, { useState, useRef, useEffect } from 'react';
import {
  FiShare2, FiX, FiLink, FiCheck,
  FiTwitter, FiMessageCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { publicAPI }      from '../../services/api';
import { copyToClipboard } from '../../utils/helpers';

// ============================================================
// SHARE PLATFORMS CONFIG
// ============================================================

const buildSharePlatforms = (url, title) => [
  {
    id:    'whatsapp',
    label: 'WhatsApp',
    color: '#25d366',
    bg:    'bg-[#25d366]/15 hover:bg-[#25d366]/25 border-[#25d366]/25',
    icon:  (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: () => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id:    'telegram',
    label: 'Telegram',
    color: '#26a5e4',
    bg:    'bg-[#26a5e4]/15 hover:bg-[#26a5e4]/25 border-[#26a5e4]/25',
    icon:  (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    getUrl: () => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id:    'twitter',
    label: 'Twitter/X',
    color: '#000000',
    bg:    'bg-white/10 hover:bg-white/20 border-white/15',
    icon:  (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
];

// ============================================================
// SHARE BUTTON COMPONENT
// ============================================================

const ShareButton = ({
  videoId,
  title     = '',
  url       = '',
  className = '',
  variant   = 'button',   // 'button' | 'icon'
}) => {
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState(false);
  const dropdownRef = useRef(null);

  const shareUrl = url || window.location.href;
  const platforms = buildSharePlatforms(shareUrl, title);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleShare = async (platform) => {
    const p = platforms.find((pl) => pl.id === platform);
    if (!p) return;

    // Track share
    if (videoId) {
      try {
        await publicAPI.trackShare(videoId, platform);
      } catch {
        // non-critical
      }
    }

    // Open platform URL
    window.open(p.getUrl(), '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);

      // Track copy share
      if (videoId) {
        try {
          await publicAPI.trackShare(videoId, 'copy');
        } catch {
          // non-critical
        }
      }
    }
    setOpen(false);
  };

  // Native Web Share API (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        if (videoId) {
          await publicAPI.trackShare(videoId, 'native');
        }
      } catch (e) {
        if (e.name !== 'AbortError') setOpen(true);
      }
    } else {
      setOpen(!open);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>

      {/* ── Trigger button ───────────────────────────────── */}
      <button
        onClick={handleNativeShare}
        className={`
          flex items-center gap-2
          transition-all duration-200
          ${variant === 'icon'
            ? `w-9 h-9 rounded-xl
               bg-white/8 hover:bg-white/15
               border border-white/10
               text-white/60 hover:text-white
               flex justify-center`
            : `px-4 py-2.5 rounded-xl text-sm font-medium
               bg-white/8 hover:bg-white/15
               border border-white/10
               text-white/70 hover:text-white`
          }
        `}
        aria-label="Share"
        aria-expanded={open}
      >
        <FiShare2 className="w-4 h-4 flex-shrink-0" />
        {variant === 'button' && <span>Share</span>}
      </button>

      {/* ── Dropdown panel ───────────────────────────────── */}
      {open && (
        <div className="
          absolute bottom-full left-0 mb-2 z-50
          w-56
          glass-modal rounded-2xl overflow-hidden
          border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.7)]
          animate-fade-in-up
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Share
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 hover:text-white transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Platform buttons */}
          <div className="p-3 space-y-1.5">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform.id)}
                className={`
                  w-full flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  border text-sm font-medium
                  transition-all duration-150
                  ${platform.bg}
                  text-white/80 hover:text-white
                `}
                style={{ color: platform.color !== '#000000' ? platform.color : undefined }}
              >
                <span className="flex-shrink-0" style={{ color: platform.color !== '#000000' ? platform.color : 'white' }}>
                  {platform.icon}
                </span>
                <span className="text-white/80">{platform.label}</span>
              </button>
            ))}

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="
                w-full flex items-center gap-3
                px-3 py-2.5 rounded-xl
                border border-white/10
                bg-white/5 hover:bg-white/12
                text-sm font-medium text-white/70 hover:text-white
                transition-all duration-150
              "
            >
              <span className="flex-shrink-0">
                {copied
                  ? <FiCheck className="w-4 h-4 text-emerald-400" />
                  : <FiLink  className="w-4 h-4" />
                }
              </span>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;