// src/components/home/HeroSection.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlay, FiEye, FiClock, FiChevronLeft,
  FiChevronRight, FiStar, FiTrendingUp,
} from 'react-icons/fi';
import { getThumbnailUrl, formatViewsShort, formatDuration, getWatchUrl, truncateText } from '../../utils/helpers';
import { HeroSkeleton } from '../video/VideoCardSkeleton';

const SLIDE_INTERVAL = 6000;
const TRANSITION_MS  = 600;

const HeroSection = ({ videos = [], loading = false, className = '' }) => {
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [direction,     setDirection]     = useState('next');
  const [transitioning, setTransitioning] = useState(false);
  const [paused,        setPaused]        = useState(false);
  const [imgLoaded,     setImgLoaded]     = useState({});

  const intervalRef = useRef(null);
  const slides = videos.slice(0, 8);

  const goToSlide = useCallback((idx, dir = 'next') => {
    if (transitioning || idx === currentIdx) return;
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIdx(idx);
      setTransitioning(false);
    }, TRANSITION_MS);
  }, [currentIdx, transitioning]);

  const goNext = useCallback(() => {
    const next = (currentIdx + 1) % slides.length;
    goToSlide(next, 'next');
  }, [currentIdx, slides.length, goToSlide]);

  const goPrev = useCallback(() => {
    const prev = (currentIdx - 1 + slides.length) % slides.length;
    goToSlide(prev, 'prev');
  }, [currentIdx, slides.length, goToSlide]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!paused) goNext();
    }, SLIDE_INTERVAL);
  }, [paused, goNext]);

  useEffect(() => {
    if (slides.length > 1) startInterval();
    return () => clearInterval(intervalRef.current);
  }, [slides.length, startInterval]);

  useEffect(() => {
    if (!slides.length) return;
    const toLoad = [
      currentIdx,
      (currentIdx + 1) % slides.length,
      (currentIdx - 1 + slides.length) % slides.length,
    ];
    toLoad.forEach((i) => {
      const video = slides[i];
      if (!video || imgLoaded[i]) return;
      const img = new Image();
      img.src = getThumbnailUrl(video);
      img.onload = () => setImgLoaded((p) => ({ ...p, [i]: true }));
    });
  }, [currentIdx, slides, imgLoaded]);

  if (loading) return <HeroSkeleton className={`w-full ${className}`} />;
  if (!slides.length) return null;

  const current = slides[currentIdx];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: '21/9', minHeight: '280px', maxHeight: '540px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((video, i) => (
        <HeroSlide
          key={video._id || i}
          video={video}
          active={i === currentIdx}
          direction={direction}
          transitioning={transitioning && i === currentIdx}
          preloaded={imgLoaded[i]}
        />
      ))}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/20" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 lg:p-12">
        <HeroContent video={current} key={currentIdx} />
      </div>

      {slides.length > 1 && (
        <>
          <NavArrow direction="left"  onClick={goPrev} />
          <NavArrow direction="right" onClick={goNext} />
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i, i > currentIdx ? 'next' : 'prev')}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-400 ${i === currentIdx ? 'w-6 h-2 bg-primary-600 shadow-glow-sm' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}

      {!paused && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
          <div className="h-full bg-primary-600 origin-left" style={{ animation: `progressBar ${SLIDE_INTERVAL}ms linear`, animationFillMode: 'forwards' }} />
        </div>
      )}

      {slides.length > 1 && (
        <ThumbnailStrip slides={slides} currentIdx={currentIdx} onSelect={(i) => goToSlide(i, i > currentIdx ? 'next' : 'prev')} />
      )}

      <style>{`@keyframes progressBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
};

const HeroSlide = ({ video, active, direction, transitioning, preloaded }) => {
  const thumbUrl = getThumbnailUrl(video);
  return (
    <div
      className={`absolute inset-0 transition-all ${active ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.02] z-0'}`}
      style={{ transitionDuration: `${TRANSITION_MS}ms` }}
    >
      <img src={thumbUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-linear ${active ? 'scale-[1.05]' : 'scale-100'}`} style={{ backgroundImage: `url(${thumbUrl})` }} />
    </div>
  );
};

const HeroContent = ({ video }) => {
  const watchUrl = getWatchUrl(video);
  const duration = formatDuration(video.duration);
  const views    = formatViewsShort(video.views);
  const tags     = video.tags?.slice(0, 3) || [];

  return (
    <div className="relative z-20 max-w-xl animate-fade-in-up">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-600/80 text-white backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight text-shadow-lg mb-2 sm:mb-3 line-clamp-2">
        {video.title}
      </h2>
      {video.description && (
        <p className="hidden sm:block text-sm text-white/60 leading-relaxed mb-3 line-clamp-2 max-w-sm">
          {truncateText(video.description, 120)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-5">
        {views    && <span className="flex items-center gap-1.5 text-xs text-white/60"><FiEye   className="w-3.5 h-3.5" />{views} views</span>}
        {duration && <span className="flex items-center gap-1.5 text-xs text-white/60"><FiClock className="w-3.5 h-3.5" />{duration}</span>}
        {video.featured && <span className="flex items-center gap-1.5 text-xs text-amber-400/90"><FiStar className="w-3.5 h-3.5 fill-amber-400" />Featured</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link to={watchUrl} className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-primary-600 text-white hover:bg-primary-500 shadow-[0_8px_30px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_40px_rgba(225,29,72,0.55)] transition-all duration-250 group">
          <FiPlay className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
          Watch Now
        </Link>
        <Link to="/trending" className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold text-sm bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 transition-all duration-250">
          <FiTrendingUp className="w-4 h-4" />
          Trending
        </Link>
      </div>
    </div>
  );
};

const NavArrow = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    aria-label={direction === 'left' ? 'Previous' : 'Next'}
    className={`absolute top-1/2 -translate-y-1/2 ${direction === 'left' ? 'left-3 sm:left-4' : 'right-3 sm:right-4'} z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/30 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100`}
  >
    {direction === 'left' ? <FiChevronLeft className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
  </button>
);

const ThumbnailStrip = ({ slides, currentIdx, onSelect }) => {
  const visible = slides.slice(0, 4);
  return (
    <div className="hidden xl:flex flex-col gap-2 absolute right-4 top-1/2 -translate-y-1/2 z-20 w-28">
      {visible.map((video, i) => (
        <button
          key={video._id || i}
          onClick={() => onSelect(i)}
          className={`relative rounded-lg overflow-hidden transition-all duration-250 border-2 ${i === currentIdx ? 'border-primary-600 shadow-glow-sm scale-[1.03]' : 'border-transparent opacity-60 hover:opacity-90 hover:border-white/30'}`}
          style={{ aspectRatio: '16/9' }}
        >
          <img src={getThumbnailUrl(video)} alt={video.title} className="w-full h-full object-cover" />
          {i === currentIdx && <div className="absolute inset-0 bg-primary-600/20" />}
        </button>
      ))}
    </div>
  );
};

export default HeroSection;