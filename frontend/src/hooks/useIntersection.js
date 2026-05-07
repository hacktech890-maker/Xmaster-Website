// src/hooks/useIntersection.js
// IntersectionObserver hook for lazy loading + infinite scroll
import { useState, useEffect, useRef, useCallback } from 'react';
/**
 * useIntersection — observes when an element enters the viewport
 *
 * Returns a CALLBACK REF (function) so it can be composed with other refs
 * via a setRefs pattern: ref={el => { callbackRef(el); otherRef.current = el; }}
 *
 * @param {Object} options — IntersectionObserver options
 * @returns {[callbackRef, isIntersecting, hasIntersected]}
 *
 * @example
 * const [ref, isVisible, hasIntersected] = useIntersection({ threshold: 0.1 });
 * <div ref={ref}>{hasIntersected && <Content />}</div>
 */
export const useIntersection = (options = {}) => {
  const [isIntersecting, setIsIntersecting]   = useState(false);
  const [hasIntersected, setHasIntersected]   = useState(false);
  const observerRef   = useRef(null);
  const elementRef    = useRef(null);
  const {
    threshold   = 0,
    rootMargin  = '0px',
    triggerOnce = true,
  } = options;
  // Stable callback ref — safe to use in ref={...} and in setRefs combiners
  const callbackRef = useCallback(
    (el) => {
      // Disconnect previous observer if element changes
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      elementRef.current = el;
      if (!el) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
          if (entry.isIntersecting) {
            setHasIntersected(true);
            if (triggerOnce) {
              observerRef.current?.disconnect();
            }
          }
        },
        { threshold, rootMargin }
      );
      observerRef.current.observe(el);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threshold, rootMargin, triggerOnce]
  );
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);
  return [callbackRef, isIntersecting, hasIntersected];
};
export default useIntersection;
