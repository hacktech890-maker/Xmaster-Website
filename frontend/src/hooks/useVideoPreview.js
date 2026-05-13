// src/hooks/useVideoPreview.js
//
// Singleton hover preview system.
// Only one video card can have an active preview at a time.
//
// NOTE: With AbyssPlayer, mp4 hover previews are not possible.
// This hook now only manages thumbnail-based hover states.
// Direct mp4 URLs no longer exist — we intentionally disable
// any autoplay/embed preview to avoid console errors.

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Module-level singleton ───────────────────────────────────
let _activeVideoId = null;
const _listeners   = new Set();

const notifyListeners = () => {
  _listeners.forEach((fn) => fn(_activeVideoId));
};

const setActiveVideo = (id) => {
  if (_activeVideoId === id) return;
  _activeVideoId = id;
  notifyListeners();
};

// ============================================================
// useVideoPreview hook
// ============================================================
//
// Returns:
//   isPreviewActive  - whether this card is the active hovered card
//   isTouch          - whether the user is on a touch/coarse device
//   previewMode      - always 'thumbnail' (mp4 previews not supported)
//   handleMouseEnter
//   handleMouseLeave
//
// Usage:
//   const { isPreviewActive, isTouch, handleMouseEnter, handleMouseLeave }
//     = useVideoPreview(videoId);
//
export const useVideoPreview = (videoId, options = {}) => {
  const { delay = 480, leaveDelay = 180 } = options;

  const [activeId, setActiveId] = useState(_activeVideoId);
  const [isTouch,  setIsTouch]  = useState(false);

  const enterTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const mountedRef    = useRef(true);

  // Detect touch / coarse-pointer devices — disable hover on these
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);
    const handler = (e) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Subscribe to singleton state
  useEffect(() => {
    const listener = (id) => {
      if (mountedRef.current) setActiveId(id);
    };
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
      mountedRef.current = false;
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isTouch) return;

    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    enterTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setActiveVideo(videoId);
    }, delay);
  }, [videoId, delay, isTouch]);

  const handleMouseLeave = useCallback(() => {
    if (isTouch) return;

    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    leaveTimerRef.current = setTimeout(() => {
      if (mountedRef.current && _activeVideoId === videoId) {
        setActiveVideo(null);
      }
    }, leaveDelay);
  }, [videoId, leaveDelay, isTouch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (_activeVideoId === videoId) setActiveVideo(null);
    };
  }, [videoId]);

  return {
    isPreviewActive: activeId === videoId,
    isTouch,
    // Always 'thumbnail' — mp4 previews are not supported with AbyssPlayer
    previewMode: 'thumbnail',
    handleMouseEnter,
    handleMouseLeave,
  };
};

export default useVideoPreview;