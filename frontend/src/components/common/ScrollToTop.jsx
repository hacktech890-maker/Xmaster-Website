import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // useLayoutEffect runs BEFORE the browser paints
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  // Also run after everything loads
  useEffect(() => {
    // Immediate scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Delayed scroll to catch lazy-loaded content
    const timer1 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    const timer2 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 150);

    const timer3 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 300);

    // Remove any focused elements that might pull scroll down
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;