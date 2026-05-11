// src/components/ads/AdSlot.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { AD_PLACEMENTS, AD_LOAD_DELAY, POPUNDER_SCRIPTS } from '../../config/ads';

const _injectedScripts = new Set();

const PLACEMENT_MIN_HEIGHT = {
  watch_sidebar:     250,
  watch_bottom:       90,
  watch_native:      100,
  home_mid:           90,
  home_grid_insert:   60,
  sidebar_tall:      600,
  sidebar_half:      300,
  category_top:       90,
};

// ============================================================
// PLAYER INTERACTION GUARD
// When the user is interacting with the video player we set
// this flag. The popunder's document click listener checks it
// and skips firing if true. This is the key fix that stops
// fullscreen clicks from opening ads.
// ============================================================
let _playerInteracting = false;
let _playerInteractTimer = null;

export const markPlayerInteraction = () => {
  _playerInteracting = true;
  if (_playerInteractTimer) clearTimeout(_playerInteractTimer);
  // Keep the guard active for 2 seconds after last interaction
  _playerInteractTimer = setTimeout(() => {
    _playerInteracting = false;
  }, 2000);
};

// ============================================================
// AD SLOT COMPONENT
// ============================================================
const AdSlot = ({
  placement,
  delay,
  className = '',
  label = false,
}) => {
  const containerRef = useRef(null);
  const isMobile     = useIsMobile();
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

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
        const uniqueId  = `ad-slot-${placement}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        container.id    = uniqueId;

        let processedCode = adCode
          .replace(/container-[a-f0-9]{32}/g, uniqueId)
          .replace(/container_\w+/g, uniqueId)
          .replace(/div_id\s*=\s*['"][^'"]*['"]/g, `div_id='${uniqueId}'`);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedCode;
        const scripts = Array.from(tempDiv.querySelectorAll('script'));
        scripts.forEach((s) => s.parentNode.removeChild(s));
        container.innerHTML = tempDiv.innerHTML;

        const containerDiv = container.querySelector('[id^="container-"]');
        if (containerDiv) containerDiv.id = uniqueId;

        if (mountedRef.current) setLoaded(true);

        const injectScripts = (scriptList, index = 0) => {
          if (index >= scriptList.length) return;
          const orig = scriptList[index];
          const src  = orig.getAttribute('src');
          if (src && _injectedScripts.has(src)) { injectScripts(scriptList, index + 1); return; }
          const newScript = document.createElement('script');
          Array.from(orig.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
          if (src) {
            _injectedScripts.add(src);
            newScript.onload  = () => injectScripts(scriptList, index + 1);
            newScript.onerror = () => injectScripts(scriptList, index + 1);
          } else {
            newScript.textContent = orig.textContent;
          }
          document.head.appendChild(newScript);
          if (!src) injectScripts(scriptList, index + 1);
        };

        injectScripts(scripts);
      } catch (err) {
        console.warn('[AdSlot] Failed:', placement, err);
        if (mountedRef.current) setLoaded(true);
      }
    }, loadDelay);

    return () => clearTimeout(timer);
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
          w-full flex items-center justify-center overflow-visible
          transition-all duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
};

// ============================================================
// GLOBAL ADS LOADER
// Injects popunder scripts once per session, with a click guard
// wrapper that suppresses firing when user is in the player.
// ============================================================
let _globalAdsLoaded = false;

export const GlobalAdsLoader = () => {
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (_globalAdsLoaded) return;

    const delay = AD_LOAD_DELAY.global_ads || 3000;

    const timer = setTimeout(() => {
      if (!mountedRef.current || _globalAdsLoaded) return;
      _globalAdsLoaded = true;

      try {
        // ── CLICK GUARD SCRIPT ──────────────────────────────
        // Injected BEFORE the popunder scripts so it runs first.
        // Wraps document.addEventListener to intercept the
        // popunder's click handler registration and add our guard.
        if (!_injectedScripts.has('__click_guard__')) {
          _injectedScripts.add('__click_guard__');
          const guardScript = document.createElement('script');
          guardScript.textContent = `
            (function() {
              var _origAddEventListener = document.addEventListener.bind(document);
              document.addEventListener = function(type, handler, options) {
                if (type === 'click' || type === 'mousedown' || type === 'pointerdown') {
                  var wrappedHandler = function(e) {
                    // Check if click originated inside a video player container
                    var target = e.target;
                    while (target && target !== document.body) {
                      if (
                        target.tagName === 'IFRAME' ||
                        (target.dataset && target.dataset.playerContainer) ||
                        (target.className && typeof target.className === 'string' &&
                          (target.className.indexOf('video-player') !== -1 ||
                           target.className.indexOf('player-container') !== -1))
                      ) {
                        return; // suppress ad popunder for player clicks
                      }
                      target = target.parentElement;
                    }
                    // Also check the global flag set by React
                    if (window.__playerInteracting) return;
                    handler.apply(this, arguments);
                  };
                  return _origAddEventListener(type, wrappedHandler, options);
                }
                return _origAddEventListener(type, handler, options);
              };
            })();
          `;
          document.head.insertBefore(guardScript, document.head.firstChild);
        }

        // ── INJECT POPUNDER SCRIPTS ─────────────────────────
        POPUNDER_SCRIPTS.forEach((src, i) => {
          if (_injectedScripts.has(src)) return;
          setTimeout(() => {
            if (_injectedScripts.has(src)) return;
            const script   = document.createElement('script');
            script.type    = 'text/javascript';
            script.async   = true;
            script.src     = src;
            document.head.appendChild(script);
            _injectedScripts.add(src);
          }, i * 800);
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