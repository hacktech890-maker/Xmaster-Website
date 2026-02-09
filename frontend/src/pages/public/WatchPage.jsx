import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../styles/Watch.css";
import { publicAPI } from "../../services/api";

function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await publicAPI.getVideo(id);

        // backend returns { success: true, video: {...} }
        const videoData = response.data?.video || response.data?.data || response.data;

        setVideo(videoData);

        // Increment view count
        await publicAPI.recordView(id);
      } catch (err) {
        setError("Failed to load video");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js";
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
        <p>{error || "This video may have been removed or is unavailable."}</p>
      </div>
    );
  }

  // ✅ Duration fix (backend stores "mm:ss")
  const durationText =
    typeof video.duration === "string" && video.duration.includes(":")
      ? video.duration
      : "00:00";

  // ✅ Date fix
  const uploadDateText = video.uploadDate
    ? new Date(video.uploadDate).toLocaleDateString()
    : video.createdAt
    ? new Date(video.createdAt).toLocaleDateString()
    : "Unknown Date";

  // ✅ Embed url fix
  const embedUrl = video.embed_code || video.embedUrl || "";

  return (
    <div className="watch-page">
      <div className="watch-container">
        <div className="video-player-section">
          <div className="video-player">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>

          <div className="video-info">
            <h1 className="video-title">{video.title}</h1>

            <div className="video-meta">
              <span className="views">
                {(video.views || 0).toLocaleString()} views
              </span>

              <span className="upload-date">{uploadDateText}</span>

              <span className="duration">{durationText}</span>
            </div>

            {video.description && (
              <div className="video-description">
                <p>{video.description}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="watch-sidebar">
          <div className="ad-unit" id="watch-ad-1"></div>

          <div
            className="ad-unit"
            id="watch-ad-2"
            style={{ marginTop: "20px" }}
          ></div>
        </aside>
      </div>
    </div>
  );
}

export default WatchPage;
