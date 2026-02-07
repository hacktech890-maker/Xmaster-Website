import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Watch.css';


function Watch() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/videos/${id}`);
        setVideo(response.data);
        
        // Increment view count
        await axios.post(`${process.env.REACT_APP_API_URL}/videos/${id}/view`);
      } catch (err) {
        setError('Failed to load video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    // Load ads script
    const script = document.createElement('script');
    script.src = 'https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="watch-loading">
        <div className="spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="watch-error">
        <h2>Oops! Video not found</h2>
        <p>{error || 'This video may have been removed or is unavailable.'}</p>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="watch-container">
        {/* Video Player */}
        <div className="video-player-section">
          <div className="video-player">
            {/* CRITICAL FIX: Use embed_code directly from database */}
            <iframe
              src={video.embed_code}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>

          {/* Video Info */}
          <div className="video-info">
            <h1 className="video-title">{video.title}</h1>
            <div className="video-meta">
              <span className="views">{video.views?.toLocaleString() || 0} views</span>
              <span className="upload-date">
                {new Date(video.uploadDate).toLocaleDateString()}
              </span>
              <span className="duration">
                {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
              </span>
            </div>
            {video.description && (
              <div className="video-description">
                <p>{video.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with Ads */}
        <aside className="watch-sidebar">
          <div className="ad-unit" id="watch-ad-1">
            {/* Ad will be loaded by script */}
          </div>
          
          <div className="ad-unit" id="watch-ad-2" style={{ marginTop: '20px' }}>
            {/* Second ad unit */}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Watch;
