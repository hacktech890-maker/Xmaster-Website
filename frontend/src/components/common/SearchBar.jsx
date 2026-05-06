// src/components/common/SearchBar.jsx
// Standalone search bar for use in pages (SearchPage, etc.)
// More feature-rich than the navbar version

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import { FiSearch, FiX, FiTrendingUp, FiTag } from 'react-icons/fi';

import { useDebounce }  from '../../hooks/useDebounce';
import { publicAPI }    from '../../services/api';

// ============================================================
// SEARCH BAR COMPONENT
// ============================================================

const SearchBar = ({
  initialQuery  = '',
  placeholder   = 'Search videos, tags, studios...',
  autoFocus     = false,
  onSearch,          // optional override — defaults to navigate
  size          = 'md',   // 'sm' | 'md' | 'lg'
  showPopular   = true,   // show popular tags below
  className     = '',
}) => {
  const navigate = useNavigate();

  const [query,           setQuery]           = useState(initialQuery);
  const [suggestions,     setSuggestions]     = useState([]);
  const [popularTags,     setPopularTags]     = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [activeSuggestion,setActiveSuggestion]= useState(-1);
  const [focused,         setFocused]         = useState(false);

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const debouncedQ   = useDebounce(query, 350);

  // ── Fetch suggestions ──────────────────────────────────────
  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      try {
        const res  = await publicAPI.getSearchSuggestions(debouncedQ);
        const data = res?.data?.suggestions || res?.data || [];
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        setSuggestionsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [debouncedQ]);

  // ── Fetch popular tags on mount ────────────────────────────
  useEffect(() => {
    if (!showPopular) return;
    const fetch = async () => {
      try {
        const res  = await publicAPI.getPopularTags(12);
        const data = res?.data?.tags || res?.data || [];
        setPopularTags(Array.isArray(data) ? data.slice(0, 12) : []);
      } catch {
        setPopularTags([]);
      }
    };
    fetch();
  }, [showPopular]);

  // ── Outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
        setFocused(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auto focus ─────────────────────────────────────────────
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [autoFocus]);

  // ── Handlers ───────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    const trimmed = (q || query).trim();
    if (!trimmed) return;
    setSuggestionsOpen(false);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
    setQuery(trimmed);
  }, [query, navigate, onSearch]);

  const handleTagClick = (tag) => {
    setSuggestionsOpen(false);
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const handleKeyDown = (e) => {
    if (!suggestionsOpen || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion((p) => (p < suggestions.length - 1 ? p + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion((p) => (p > 0 ? p - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const s = suggestions[activeSuggestion];
          handleSearch(typeof s === 'string' ? s : s.title || s.query);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
        inputRef.current?.blur();
        break;
      default: break;
    }
  };

  // ── Size variants ──────────────────────────────────────────
  const sizes = {
    sm: { wrap: 'h-10', input: 'text-sm px-3', btn: 'px-3 py-1.5 text-xs', icon: 'w-4 h-4' },
    md: { wrap: 'h-12', input: 'text-sm px-4', btn: 'px-4 py-2 text-sm',   icon: 'w-4 h-4' },
    lg: { wrap: 'h-14', input: 'text-base px-5',btn: 'px-6 py-2.5 text-sm',icon: 'w-5 h-5' },
  };
  const s = sizes[size] || sizes.md;

  // ── Show dropdown: suggestions OR empty+focused ────────────
  const showDropdown = focused && (
    suggestions.length > 0 ||
    (query.length === 0 && popularTags.length > 0)
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div ref={containerRef} className={`relative ${className}`}>

      {/* Input row */}
      <div className={`
        flex items-center ${s.wrap}
        rounded-2xl overflow-hidden
        bg-white/8 border
        transition-all duration-250
        ${focused
          ? 'border-primary-600/60 shadow-glow-sm bg-white/10'
          : 'border-white/10 hover:border-white/20'
        }
      `}>
        {/* Icon */}
        <span className="pl-4 pr-2 text-white/40 flex-shrink-0">
          {loading
            ? <div className={`${s.icon} rounded-full border border-white/20 border-t-primary-600 animate-spin`} />
            : <FiSearch className={s.icon} />
          }
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveSuggestion(-1);
          }}
          onFocus={() => {
            setFocused(true);
            if (query.length >= 2) setSuggestionsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          className={`
            flex-1 bg-transparent text-white ${s.input}
            placeholder:text-white/30
            focus:outline-none
          `}
        />

        {/* Clear */}
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); setSuggestionsOpen(false); inputRef.current?.focus(); }}
            className="px-2 text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
          >
            <FiX className={s.icon} />
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim()}
          className={`
            ${s.btn} mr-1.5 rounded-xl
            font-semibold text-white
            bg-primary-600 hover:bg-primary-500
            disabled:opacity-30 disabled:pointer-events-none
            transition-all duration-200
            flex-shrink-0
          `}
        >
          Search
        </button>
      </div>

      {/* ── Dropdown ─────────────────────────────────────────── */}
      {showDropdown && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          glass-modal rounded-2xl overflow-hidden
          border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.7)]
          animate-fade-in-down
        ">

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                Suggestions
              </p>
              {suggestions.map((s, i) => {
                const label = typeof s === 'string' ? s : s.title || s.query || '';
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onMouseLeave={() => setActiveSuggestion(-1)}
                    onClick={() => handleSearch(label)}
                    className={`
                      w-full flex items-center gap-3
                      px-3 py-2.5 rounded-xl text-sm text-left
                      transition-colors duration-100
                      ${i === activeSuggestion
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                      }
                    `}
                  >
                    <FiSearch className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Popular tags */}
          {query.length === 0 && popularTags.length > 0 && (
            <div className="p-3 border-t border-white/8">
              <p className="px-1 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                <FiTrendingUp className="w-3 h-3" />
                Trending Searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag, i) => {
                  const tagName = typeof tag === 'string' ? tag : tag.name || tag.tag || String(tag);
                  return (
                    <button
                      key={i}
                      onClick={() => handleTagClick(tagName)}
                      className="
                        flex items-center gap-1
                        px-2.5 py-1 rounded-full
                        bg-white/8 hover:bg-primary-600/20
                        border border-white/8 hover:border-primary-600/30
                        text-xs text-white/50 hover:text-white
                        transition-all duration-150
                      "
                    >
                      <FiTag className="w-2.5 h-2.5" />
                      {tagName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;