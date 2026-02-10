import React, { useState, useEffect } from 'react';
import { publicAPI } from '../../services/api';

const AdBanner = ({ placement = 'home_top', className = '' }) => {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        const response = await publicAPI.getAdByPlacement(placement, device);
        if (response.data?.success && response.data?.ad) {
          setAd(response.data.ad);
          // Record impression
          try {
            await publicAPI.recordAdImpression(response.data.ad._id);
          } catch (e) {
            // Silent fail
          }
        }
      } catch (error) {
        // No ad available - that's fine
      }
    };

    fetchAd();
  }, [placement]);

  if (!ad) return null;

  const handleClick = async () => {
    try {
      await publicAPI.recordAdClick(ad._id);
    } catch (e) {
      // Silent fail
    }
  };

  // HTML ad (like AdSense or custom script)
  if (ad.type === 'html' || ad.type === 'script') {
    return (
      <div className={`ad-container ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: ad.content || ad.code }} />
      </div>
    );
  }

  // Image/Banner ad
  return (
    <div className={`ad-container ${className}`}>
      <a
        href={ad.url || ad.link || '#'}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className="block"
      >
        {ad.image && (
          <img
            src={ad.image}
            alt={ad.title || 'Advertisement'}
            className="w-full rounded-lg"
            loading="lazy"
          />
        )}
      </a>
    </div>
  );
};

export default AdBanner;