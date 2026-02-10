import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ embedUrl, title, onReady }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        onReady && onReady();
      };
    }
  }, [onReady]);

  if (!embedUrl) {
    return (
      <div className="relative w-full bg-black rounded-xl overflow-hidden">
        <div className="relative pt-[56.25%]">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">Video not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black sm:rounded-xl overflow-hidden shadow-2xl">
      <div className="relative pt-[56.25%]">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || 'Video Player'}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;