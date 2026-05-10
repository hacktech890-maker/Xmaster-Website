// src/hooks/useIntersection.js
// Intersection Observer hook for lazy loading
import { useState, useRef, useCallback, useEffect } from 'react';

export const useIntersection = (options = {}) => {
  const {
    threshold   = 0.1,
    rootMargin  = '200px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const observerRef = useRef(null);
  const elementRef  = useRef(null);

  const setRef = useCallback((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    elementRef.current = el;
    if (!el) return;

    if (triggerOnce && hasIntersected) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        if (intersecting) {
          setHasIntersected(true);
          if (triggerOnce && observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(el);
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [setRef, isIntersecting, hasIntersected];
};

export default useIntersection;