// src/hooks/useIntersection.js
// IntersectionObserver hook for lazy loading + infinite scroll

import { useState, useEffect, useRef } from 'react';

/**
 * useIntersection — observes when an element enters the viewport
 *
 * @param {Object} options — IntersectionObserver options
 * @returns {[ref, boolean]} — [ref to attach, isIntersecting]
 *
 * @example
 * const [ref, isVisible] = useIntersection({ threshold: 0.1 });
 * <div ref={ref}>{isVisible && <Content />}</div>
 */
export const useIntersection = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  const {
    threshold = 0,
    rootMargin = '0px',
    triggerOnce = true,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  return [elementRef, isIntersecting, hasIntersected];
};

export default useIntersection;