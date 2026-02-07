import React, { useEffect, useState, useRef } from 'react';
import { publicAPI } from '../../services/api';

const AdBanner = ({ placement, className = '' }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const adRef = useRef(null);
  const impressionRecorded = useRef(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        const response = await publicAPI.getAdByPlacement(placement, device);
        
        if (response.data.success && response.data.ad) {
          setAd(response.data.ad);
        } else {
          // No ad found for this placement - this is not an error
          setAd(null);
        }
      } catch (err) {
        // Silently fail - ads are optional
        console.log(`No ad available for placement: ${placement}`);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [placement]);

  // Record impression when ad is visible
  useEffect(() => {
    if (!ad || impressionRecorded.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          publicAPI.recordAdImpression(ad._id).catch(() => {});
          impressionRecorded.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [ad]);

  const handleClick = () => {
    if (ad) {
      publicAPI.recordAdClick(ad._id).catch(() => {});
    }
  };

  // Don't render anything if loading, error, or no ad
  if (loading || error || !ad) {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={`ad-banner ${className}`}
      onClick={handleClick}
    >
      {ad.type === 'script' || ad.type === 'html' ? (
        <div dangerouslySetInnerHTML={{ __html: ad.code }} />
      ) : ad.type === 'image' && ad.imageUrl ? (
        <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer">
          <img 
            src={ad.imageUrl} 
            alt={ad.name}
            className="max-w-full h-auto"
          />
        </a>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: ad.code }} />
      )}
    </div>
  );
};

export default AdBanner;