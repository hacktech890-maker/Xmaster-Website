import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ embedUrl, title, onReady }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Call onReady when iframe loads
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        onReady && onReady();
      };
    }
  }, [onReady]);

  if (!embedUrl) {
    return (
      <div className="video-container flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Video not available</p>
      </div>
    );
  }

  return (
    <div className="video-container rounded-xl overflow-hidden shadow-2xl">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || 'Video Player'}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoPlayer;