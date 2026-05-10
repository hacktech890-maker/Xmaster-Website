// src/hooks/useVideoPreview.js
// Singleton hover preview system
// Only one video card can have an active preview at a time

import { useState, useRef, useCallback, useEffect } from 'react';

// Module-level singleton — tracks which video is currently previewing
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
// Usage:
//   const { isPreviewActive, isTouch, handleMouseEnter, handleMouseLeave }
//     = useVideoPreview(videoId, { delay: 480, leaveDelay: 180 });
// ============================================================

export const useVideoPreview = (videoId, options = {}) => {
  const { delay = 480, leaveDelay = 180 } = options;

  const [activeId,  setActiveId]  = useState(_activeVideoId);
  const [isTouch,   setIsTouch]   = useState(false);

  const enterTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const mountedRef    = useRef(true);

  // Detect touch/coarse-pointer devices — disable hover on these
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

    // Clear any pending leave timer
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // Activate after delay
    enterTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setActiveVideo(videoId);
    }, delay);
  }, [videoId, delay, isTouch]);

  const handleMouseLeave = useCallback(() => {
    if (isTouch) return;

    // Clear pending enter timer
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    // Deactivate after short leave delay (prevents flicker)
    leaveTimerRef.current = setTimeout(() => {
      if (mountedRef.current && _activeVideoId === videoId) {
        setActiveVideo(null);
      }
    }, leaveDelay);
  }, [videoId, leaveDelay, isTouch]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      // If this card was active, clear the singleton
      if (_activeVideoId === videoId) setActiveVideo(null);
    };
  }, [videoId]);

  return {
    isPreviewActive: activeId === videoId,
    isTouch,
    handleMouseEnter,
    handleMouseLeave,
  };
};

export default useVideoPreview;