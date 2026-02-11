import React, { useState, useEffect, useRef } from 'react';
import { publicAPI } from '../../services/api';

const AdBanner = ({ placement = 'home_top', className = '' }) => {
  const [ad, setAd] = useState(null);
  const adContainerRef = useRef(null);
  const scriptsLoaded = useRef(false);

  // Fetch ad from backend
  useEffect(() => {
    const fetchAd = async () => {
      try {
        const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        const response = await publicAPI.getAdByPlacement(placement, device);
        if (response.data?.success && response.data?.ad) {
          setAd(response.data.ad);
          try {
            await publicAPI.recordAdImpression(response.data.ad._id);
          } catch (e) {
            // Silent
          }
        }
      } catch (error) {
        // No ad available
      }
    };

    fetchAd();
  }, [placement]);

  // Inject and execute ad scripts
  useEffect(() => {
    if (!ad || !adContainerRef.current || scriptsLoaded.current) return;

    const container = adContainerRef.current;
    const adCode = ad.code || ad.content || '';

    if (!adCode.trim()) return;

    // Clear container
    container.innerHTML = '';
    scriptsLoaded.current = true;

    // Parse the ad code HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = adCode;

    // Separate script tags from other HTML
    const scripts = tempDiv.querySelectorAll('script');
    const nonScriptContent = adCode.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Add non-script HTML first
    if (nonScriptContent.trim()) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = nonScriptContent;
      container.appendChild(contentDiv);
    }

    // Execute scripts in order
    scripts.forEach((originalScript) => {
      const newScript = document.createElement('script');

      // Copy all attributes
      Array.from(originalScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // If script has inline content (like atOptions)
      if (originalScript.textContent) {
        newScript.textContent = originalScript.textContent;
      }

      // If script has src attribute
      if (originalScript.src) {
        newScript.src = originalScript.src;
        newScript.async = true;
      }

      container.appendChild(newScript);
    });

    // Cleanup on unmount
    return () => {
      if (container) {
        container.innerHTML = '';
      }
      scriptsLoaded.current = false;
    };
  }, [ad]);

  // Reset when placement changes
  useEffect(() => {
    scriptsLoaded.current = false;
  }, [placement]);

  if (!ad) return null;

  // For image type ads
  if (ad.type === 'image' || ad.type === 'banner') {
    const imageUrl = ad.imageUrl || ad.image || '';
    const targetUrl = ad.targetUrl || ad.url || ad.link || '#';

    if (!imageUrl) return null;

    return (
      <div className={`ad-banner flex justify-center ${className}`}>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={async () => {
            try {
              await publicAPI.recordAdClick(ad._id);
            } catch (e) {}
          }}
        >
          <img
            src={imageUrl}
            alt={ad.name || 'Advertisement'}
            className="rounded-lg max-w-full"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  // For script/html type ads
  return (
    <div className={`ad-banner flex justify-center ${className}`}>
      <div ref={adContainerRef} className="ad-content" />
    </div>
  );
};

export default AdBanner;