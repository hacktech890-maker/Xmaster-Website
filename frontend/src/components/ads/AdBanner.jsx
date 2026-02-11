import React, { useState, useEffect, useRef } from 'react';
import { publicAPI } from '../../services/api';

const AdBanner = ({ placement = 'home_top', className = '' }) => {
  const [ad, setAd] = useState(null);
  const adContainerRef = useRef(null);
  const scriptsLoaded = useRef(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        const response = await publicAPI.getAdByPlacement(placement, device);
        if (response.data?.success && response.data?.ad) {
          setAd(response.data.ad);
          try {
            await publicAPI.recordAdImpression(response.data.ad._id);
          } catch (e) {}
        }
      } catch (error) {}
    };

    fetchAd();
  }, [placement]);

  // Inject and execute ad scripts
  useEffect(() => {
    if (!ad || scriptsLoaded.current) return;

    const adCode = ad.code || ad.content || '';
    if (!adCode.trim()) return;

    // For popunder/interstitial - inject into body, no container needed
    if (ad.placement === 'popunder' || ad.placement === 'interstitial') {
      scriptsLoaded.current = true;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = adCode;
      const scripts = tempDiv.querySelectorAll('script');

      scripts.forEach((originalScript) => {
        const newScript = document.createElement('script');
        Array.from(originalScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (originalScript.textContent) {
          newScript.textContent = originalScript.textContent;
        }
        if (originalScript.src) {
          newScript.src = originalScript.src;
          newScript.async = true;
        }
        document.body.appendChild(newScript);
      });

      return () => {
        scriptsLoaded.current = false;
      };
    }

    // For banner ads - inject into container
    if (!adContainerRef.current) return;

    const container = adContainerRef.current;
    container.innerHTML = '';
    scriptsLoaded.current = true;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = adCode;

    const scripts = tempDiv.querySelectorAll('script');
    const nonScriptContent = adCode.replace(/<script[\s\S]*?<\/script>/gi, '');

    if (nonScriptContent.trim()) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = nonScriptContent;
      container.appendChild(contentDiv);
    }

    scripts.forEach((originalScript) => {
      const newScript = document.createElement('script');
      Array.from(originalScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (originalScript.textContent) {
        newScript.textContent = originalScript.textContent;
      }
      if (originalScript.src) {
        newScript.src = originalScript.src;
        newScript.async = true;
      }
      container.appendChild(newScript);
    });

    return () => {
      if (container) container.innerHTML = '';
      scriptsLoaded.current = false;
    };
  }, [ad]);

  useEffect(() => {
    scriptsLoaded.current = false;
  }, [placement]);

  if (!ad) return null;

  // Popunder/interstitial ads don't render visible elements
  if (ad.placement === 'popunder' || ad.placement === 'interstitial') {
    return null;
  }

  // Image type ads
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
            try { await publicAPI.recordAdClick(ad._id); } catch (e) {}
          }}
        >
          <img src={imageUrl} alt={ad.name || 'Advertisement'} className="rounded-lg max-w-full" loading="lazy" />
        </a>
      </div>
    );
  }

  // Script/HTML type ads
  return (
    <div className={`ad-banner flex justify-center ${className}`}>
      <div ref={adContainerRef} className="ad-content" />
    </div>
  );
};

export default AdBanner;