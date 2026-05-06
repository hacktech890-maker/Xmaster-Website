// src/components/ads/AdSlot.jsx
// CENTRALIZED ad slot component
// Replaces the duplicated inline AdSlot in WatchPage + HomePage
// Uses centralized ad codes from src/config/ads.js

import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { AD_PLACEMENTS, AD_LOAD_DELAY } from '../../config/ads';

// ============================================================
// AD SLOT COMPONENT
// ============================================================

const AdSlot = ({
  placement,      // key from AD_PLACEMENTS
  delay,          // override delay in ms
  className = '',
  label     = false,  // show "Advertisement" label above
}) => {
  const containerRef = useRef(null);
  const isMobile     = useIsMobile();
  const [loaded, setLoaded] = useState(false);
  const mountedRef  = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const adConfig = AD_PLACEMENTS[placement];
    if (!adConfig) return;

    const adCode = isMobile
      ? (adConfig.mobile || adConfig.all)
      : (adConfig.desktop || adConfig.all);

    if (!adCode) return;

    const loadDelay = delay ?? AD_LOAD_DELAY[placement] ?? 1000;

    const timer = setTimeout(() => {
      if (!mountedRef.current || !containerRef.current) return;

      try {
        const container = containerRef.current;

        // Generate unique container ID
        const uniqueId = `ad-slot-${placement}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        container.id = uniqueId;

        // Process ad code: replace generic container IDs with unique one
        let processedCode = adCode
          .replace(/container_\w+/g, uniqueId)
          .replace(/div_id\s*=\s*['"][^'"]*['"]/g, `div_id='${uniqueId}'`);

        // Extract and inject scripts properly
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedCode;

        const scripts = tempDiv.querySelectorAll('script');

        // Append non-script content first
        scripts.forEach((s) => tempDiv.removeChild(s));
        container.innerHTML = tempDiv.innerHTML;

        // Inject scripts sequentially
        const injectScripts = (scriptList, index = 0) => {
          if (index >= scriptList.length) {
            if (mountedRef.current) setLoaded(true);
            return;
          }

          const originalScript = scriptList[index];
          const newScript = document.createElement('script');

          // Copy attributes
          Array.from(originalScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (originalScript.src) {
            newScript.onload = () => injectScripts(scriptList, index + 1);
            newScript.onerror = () => injectScripts(scriptList, index + 1);
          } else {
            newScript.textContent = originalScript.textContent;
          }

          document.head.appendChild(newScript);

          if (!originalScript.src) {
            injectScripts(scriptList, index + 1);
          }
        };

        injectScripts(Array.from(scripts));
      } catch (err) {
        // Silently fail — ad errors should not break the page
        console.warn('[AdSlot] Failed to load ad:', placement, err);
      }
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [placement, isMobile, delay]);

  return (
    <div className={`ad-container ${className}`}>
      {label && (
        <p className="text-[10px] text-white/20 text-center mb-1 uppercase tracking-widest">
          Advertisement
        </p>
      )}
      <div
        ref={containerRef}
        className={`
          w-full flex items-center justify-center
          min-h-[1px] overflow-hidden
          transition-opacity duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
};

// ============================================================
// GLOBAL ADS LOADER
// Injects social bar + popunder once per page
// Called in WatchPage and HomePage
// ============================================================

export const GlobalAdsLoader = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Delay global ads significantly to prioritize content loading
    const delay = AD_LOAD_DELAY.global_ads || 2500;

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        // Social bar
        const socialScript = document.createElement('script');
        socialScript.type  = 'text/javascript';
        socialScript.async = true;
        socialScript.src   = '//effectivegatecpm.com/social-bar.js';
        document.head.appendChild(socialScript);

        // Popunder — additional delay after social bar
        setTimeout(() => {
          if (!mountedRef.current) return;
          const popScript = document.createElement('script');
          popScript.type  = 'text/javascript';
          popScript.async = true;
          popScript.src   = '//effectivegatecpm.com/popunder.js';
          document.head.appendChild(popScript);
        }, 1000);
      } catch (err) {
        console.warn('[GlobalAdsLoader] Failed:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default AdSlot;