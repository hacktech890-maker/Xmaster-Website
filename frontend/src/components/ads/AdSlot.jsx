// src/components/ads/AdSlot.jsx
// CENTRALIZED ad slot component
// Uses centralized ad codes from src/config/ads.js

import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { AD_PLACEMENTS, AD_LOAD_DELAY, POPUNDER_SCRIPTS } from '../../config/ads';

// ============================================================
// SCRIPT DEDUPLICATION — module-level set
// Prevents duplicate <script> injection across SPA navigations
// ============================================================
const _injectedScripts = new Set();

// ============================================================
// MIN HEIGHT MAP — gives each placement visible space
// Ad networks render content async; container must have height
// ============================================================
const PLACEMENT_MIN_HEIGHT = {
  watch_sidebar:      250,
  watch_bottom:       90,
  watch_native:       100,
  home_mid:           90,
  home_grid_insert:   60,
  sidebar_tall:       600,
  sidebar_half:       300,
  category_top:       90,
};

// ============================================================
// AD SLOT COMPONENT
// ============================================================

const AdSlot = ({
  placement,       // key from AD_PLACEMENTS
  delay,           // override delay in ms
  className = '',
  label     = false,  // show "Advertisement" label above
}) => {
  const containerRef = useRef(null);
  const isMobile     = useIsMobile();
  // Start visible — never hide ads behind opacity-0
  // The "Advertisement" label shows immediately as a placeholder
  const [loaded, setLoaded] = useState(false);
  const mountedRef   = useRef(true);

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

    const loadDelay = delay ?? AD_LOAD_DELAY[placement] ?? AD_LOAD_DELAY.default;

    const timer = setTimeout(() => {
      if (!mountedRef.current || !containerRef.current) return;

      try {
        const container = containerRef.current;

        // Generate unique container ID for this slot instance
        const uniqueId = `ad-slot-${placement}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        container.id = uniqueId;

        // Replace the native container ID placeholder with our unique ID
        let processedCode = adCode
          .replace(/container-[a-f0-9]{32}/g, uniqueId)
          .replace(/container_\w+/g, uniqueId)
          .replace(/div_id\s*=\s*['"][^'"]*['"]/g, `div_id='${uniqueId}'`);

        // Parse the ad code HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedCode;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        // Remove scripts from temp, keep non-script HTML (divs etc.)
        scripts.forEach((s) => s.parentNode.removeChild(s));
        container.innerHTML = tempDiv.innerHTML;

        // Update any remaining container IDs in the DOM
        const containerDiv = container.querySelector('[id^="container-"]');
        if (containerDiv) containerDiv.id = uniqueId;

        // Always make visible immediately after injecting HTML —
        // ad networks fill content asynchronously so we can't
        // wait for onload to show the slot
        if (mountedRef.current) setLoaded(true);

        // Inject scripts sequentially
        const injectScripts = (scriptList, index = 0) => {
          if (index >= scriptList.length) return;

          const originalScript = scriptList[index];
          const src = originalScript.getAttribute('src');

          // Deduplicate external scripts by src URL
          if (src && _injectedScripts.has(src)) {
            injectScripts(scriptList, index + 1);
            return;
          }

          const newScript = document.createElement('script');

          // Copy all attributes
          Array.from(originalScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (src) {
            _injectedScripts.add(src);
            newScript.onload  = () => injectScripts(scriptList, index + 1);
            newScript.onerror = () => injectScripts(scriptList, index + 1);
          } else {
            newScript.textContent = originalScript.textContent;
          }

          document.head.appendChild(newScript);

          if (!src) {
            injectScripts(scriptList, index + 1);
          }
        };

        injectScripts(scripts);

      } catch (err) {
        // Silently fail — ad errors must never break the page
        console.warn('[AdSlot] Failed to load ad:', placement, err);
        // Show slot anyway so layout doesn't collapse
        if (mountedRef.current) setLoaded(true);
      }
    }, loadDelay);

    return () => clearTimeout(timer);
    // isMobile intentionally excluded — don't re-trigger on resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, delay]);

  const minH = PLACEMENT_MIN_HEIGHT[placement] || 50;

  return (
    <div className={`ad-container ${className}`}>
      {label && (
        <p className="text-[10px] text-white/20 text-center mb-1 uppercase tracking-widest select-none">
          Advertisement
        </p>
      )}
      <div
        ref={containerRef}
        style={{ minHeight: loaded ? minH : 0 }}
        className={`
          w-full flex items-center justify-center
          overflow-visible
          transition-all duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
};

// ============================================================
// GLOBAL ADS LOADER
// Injects popunder scripts ONCE per browser session.
// Should be rendered in WatchPage and HomePage (top level).
// Uses a module-level flag to prevent double-injection across
// React re-mounts / SPA navigations.
// ============================================================

let _globalAdsLoaded = false;

export const GlobalAdsLoader = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Only fire once per browser session
    if (_globalAdsLoaded) return;

    const delay = AD_LOAD_DELAY.global_ads || 3000;

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      if (_globalAdsLoaded) return; // double-check after delay

      _globalAdsLoaded = true;

      try {
        // Inject each popunder script sequentially
        POPUNDER_SCRIPTS.forEach((src, i) => {
          if (_injectedScripts.has(src)) return;

          setTimeout(() => {
            if (!_injectedScripts.has(src)) {
              const script = document.createElement('script');
              script.type  = 'text/javascript';
              script.async = true;
              script.src   = src;
              document.head.appendChild(script);
              _injectedScripts.add(src);
            }
          }, i * 800); // stagger: 0ms, 800ms
        });
      } catch (err) {
        console.warn('[GlobalAdsLoader] Failed:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default AdSlot;