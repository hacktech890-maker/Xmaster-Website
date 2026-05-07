// src/hooks/useVideoPreview.js
// Singleton hover-preview state manager
// Ensures only ONE card is in "preview" state at any time
// Handles: debounce, mobile detection, cleanup, global registry
import { useState, useEffect, useRef, useCallback } from 'react';
// ─────────────────────────────────────────────────────────────
// GLOBAL SINGLETON REGISTRY
// Only one card can be active at a time across the entire page.
// Uses a simple pub/sub so cards can notify each other.
// ─────────────────────────────────────────────────────────────
let activeCardId     = null;
const subscribers    = new Set();
const setGlobalActive = (id) => {
  activeCardId = id;
  subscribers.forEach((cb) => cb(id));
};
const subscribeGlobal = (cb) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};
// ─────────────────────────────────────────────────────────────
// MOBILE DETECTION (hover: none = touch device)
// Uses matchMedia — never changes after initial detection
// ─────────────────────────────────────────────────────────────
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
};
// Cached at module level — doesn't change
const IS_TOUCH = isTouchDevice();
// ─────────────────────────────────────────────────────────────
// useVideoPreview HOOK
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} cardId  — unique id for this card (video._id)
 * @param {Object} options
 *   delay     {number} ms before preview activates  (default 500)
 *   leaveDelay{number} ms before preview deactivates (default 150)
 *
 * @returns {Object}
 *   isPreviewActive  {boolean} — true when this card should show preview
 *   isTouch          {boolean} — true on touch/mobile devices
 *   handleMouseEnter {fn}
 *   handleMouseLeave {fn}
 *   cancelPreview    {fn}      — force-cancel (e.g. on scroll)
 */
export const useVideoPreview = (cardId, options = {}) => {
  const {
    delay      = 500,
    leaveDelay = 150,
  } = options;
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);
  // Listen to global registry — if another card activates, deactivate self
  useEffect(() => {
    if (IS_TOUCH) return;
    const unsub = subscribeGlobal((newActiveId) => {
      if (newActiveId !== cardId) {
        setIsPreviewActive(false);
      }
    });
    return unsub;
  }, [cardId]);
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(enterTimer.current);
      clearTimeout(leaveTimer.current);
    };
  }, []);
  const handleMouseEnter = useCallback(() => {
    if (IS_TOUCH) return;
    // Cancel any pending leave
    clearTimeout(leaveTimer.current);
    // Debounce activation
    enterTimer.current = setTimeout(() => {
      setGlobalActive(cardId);
      setIsPreviewActive(true);
    }, delay);
  }, [cardId, delay]);
  const handleMouseLeave = useCallback(() => {
    if (IS_TOUCH) return;
    // Cancel any pending enter
    clearTimeout(enterTimer.current);
    // Small delay before deactivating — prevents flicker on border crossing
    leaveTimer.current = setTimeout(() => {
      if (activeCardId === cardId) {
        setGlobalActive(null);
      }
      setIsPreviewActive(false);
    }, leaveDelay);
  }, [cardId, leaveDelay]);
  const cancelPreview = useCallback(() => {
    clearTimeout(enterTimer.current);
    clearTimeout(leaveTimer.current);
    setIsPreviewActive(false);
    if (activeCardId === cardId) {
      setGlobalActive(null);
    }
  }, [cardId]);
  return {
    isPreviewActive,
    isTouch: IS_TOUCH,
    handleMouseEnter,
    handleMouseLeave,
    cancelPreview,
  };
};
export default useVideoPreview;
