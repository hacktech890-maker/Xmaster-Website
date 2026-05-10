// src/components/common/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch, FiX, FiMenu,
  FiStar, FiZap,
} from 'react-icons/fi';
import { useDebounce }    from '../../hooks/useDebounce';
import { useIsMobile }    from '../../hooks/useMediaQuery';
import ThemeToggle        from './ThemeToggle';
import { publicAPI }      from '../../services/api';
import {
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from '../../config/features';

// Trending removed — nav only shows Free + Premium
const NAV_LINKS = [
  ...(FREE_SECTION_ENABLED    ? [{ label: 'Free',    path: '/free',    icon: <FiZap  className="w-4 h-4" /> }] : []),
  ...(PREMIUM_SECTION_ENABLED ? [{ label: 'Premium', path: '/premium', icon: <FiStar className="w-4 h-4" />, badge: 'HOT' }] : []),
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const isMobile = useIsMobile();

  const [scrolled,           setScrolled]          = useState(false);
  const [searchOpen,         setSearchOpen]         = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [suggestions,        setSuggestions]        = useState([]);
  const [suggestionsOpen,    setSuggestionsOpen]    = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mobileMenuOpen,     setMobileMenuOpen]     = useState(false);
  const [activeSuggestion,   setActiveSuggestion]   = useState(-1);

  const searchRef      = useRef(null);
  const inputRef       = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 350);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
    setSuggestionsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res  = await publicAPI.getSearchSuggestions(debouncedQuery);
        const data = res?.data?.suggestions || res?.data || [];
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        setSuggestionsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [searchOpen]);

  const handleSearch = useCallback((query) => {
    if (!query.trim()) return;
    setSuggestionsOpen(false);
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchQuery('');
  }, [navigate]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const query = typeof suggestion === 'string'
      ? suggestion
      : suggestion.title || suggestion.query || String(suggestion);
    setSuggestionsOpen(false);
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
  }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (!suggestionsOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) handleSearch(searchQuery.trim());
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0)
          handleSuggestionClick(suggestions[activeSuggestion]);
        else if (searchQuery.trim()) handleSearch(searchQuery.trim());
        break;
      case 'Escape':
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
        setSearchOpen(false);
        break;
      default:
        break;
    }
  }, [
    suggestionsOpen, suggestions, activeSuggestion,
    searchQuery, handleSearch, handleSuggestionClick,
  ]);

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setSuggestionsOpen(false);
    inputRef.current?.focus();
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-[300]
          transition-all duration-300
          ${scrolled
            ? 'glass-navbar shadow-navbar py-0'
            : 'bg-gradient-to-b from-black/80 to-transparent py-0'
          }
        `}
        style={{ height: '64px' }}
      >
        <div className="container-site h-full flex items-center gap-4">
          {/* Logo */}
          <Link
            to={FREE_SECTION_ENABLED ? '/free' : '/search'}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label="Xmaster Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-black text-base leading-none">X</span>
            </div>
            <span className="hidden sm:block text-white font-bold text-xl tracking-tight group-hover:text-primary-400 transition-colors duration-200">
              xmaster
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.path} link={link} isActive={isActive(link.path)} />
            ))}
          </nav>

          <div className="flex-1" />

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-sm" ref={searchRef}>
            <DesktopSearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              suggestions={suggestions}
              suggestionsOpen={suggestionsOpen}
              setSuggestionsOpen={setSuggestionsOpen}
              loadingSuggestions={loadingSuggestions}
              activeSuggestion={activeSuggestion}
              setActiveSuggestion={setActiveSuggestion}
              inputRef={inputRef}
              onSearch={handleSearch}
              onSuggestionClick={handleSuggestionClick}
              onClear={clearSearch}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all duration-200"
            >
              {searchOpen ? <FiX className="w-4 h-4" /> : <FiSearch className="w-4 h-4" />}
            </button>
            <ThemeToggle size="md" />
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all duration-200"
            >
              <FiMenu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-3 pt-1">
            <MobileSearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              inputRef={inputRef}
              onSearch={handleSearch}
              onClear={clearSearch}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
        isActive={isActive}
      />

      <div style={{ height: '64px' }} />
    </>
  );
};

// ── Sub-components (unchanged) ────────────────────────────────

const NavLink = ({ link, isActive }) => (
  <Link
    to={link.path}
    className={`
      relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
      transition-all duration-200
      ${isActive
        ? 'text-white bg-white/10'
        : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
      }
    `}
  >
    {link.icon}
    {link.label}
    {link.badge && (
      <span className="ml-0.5 px-1.5 py-px rounded-full text-[9px] font-bold tracking-wider bg-primary-600 text-white">
        {link.badge}
      </span>
    )}
    {isActive && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />
    )}
  </Link>
);

const DesktopSearchBar = ({
  query, setQuery, suggestions, suggestionsOpen,
  setSuggestionsOpen, loadingSuggestions, activeSuggestion,
  setActiveSuggestion, inputRef, onSearch,
  onSuggestionClick, onClear, onKeyDown,
}) => (
  <div className="relative w-full">
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.08] border border-white/10 hover:border-white/20 focus-within:border-primary-600/50 focus-within:bg-white/10 transition-all duration-200">
      <FiSearch className="w-4 h-4 text-white/40 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => query.length >= 2 && setSuggestionsOpen(true)}
        placeholder="Search videos, tags..."
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
      />
      {loadingSuggestions && (
        <div className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-primary-600 animate-spin flex-shrink-0" />
      )}
      {query && !loadingSuggestions && (
        <button
          onClick={onClear}
          className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => onSearch(query)}
        disabled={!query.trim()}
        className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-600/80 text-white hover:bg-primary-600 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
      >
        Go
      </button>
    </div>
    {suggestionsOpen && suggestions.length > 0 && (
      <SearchSuggestions
        suggestions={suggestions}
        activeSuggestion={activeSuggestion}
        setActiveSuggestion={setActiveSuggestion}
        onSuggestionClick={onSuggestionClick}
      />
    )}
  </div>
);

const MobileSearchBar = ({
  query, setQuery, inputRef, onSearch, onClear, onKeyDown,
}) => (
  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.08] border border-white/15 focus-within:border-primary-600/50 transition-all duration-200">
    <FiSearch className="w-4 h-4 text-white/40 flex-shrink-0" />
    <input
      ref={inputRef}
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Search videos..."
      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
      autoComplete="off"
    />
    {query && (
      <button onClick={onClear} className="text-white/40 hover:text-white transition-colors">
        <FiX className="w-4 h-4" />
      </button>
    )}
    <button
      onClick={() => onSearch(query)}
      disabled={!query.trim()}
      className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-600 text-white disabled:opacity-40 transition-all duration-200"
    >
      Search
    </button>
  </div>
);

const SearchSuggestions = ({
  suggestions, activeSuggestion, setActiveSuggestion, onSuggestionClick,
}) => (
  <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-modal rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10 animate-fade-in-down">
    {suggestions.map((suggestion, i) => {
      const label = typeof suggestion === 'string'
        ? suggestion
        : suggestion.title || suggestion.query || String(suggestion);
      return (
        <button
          key={i}
          onMouseEnter={() => setActiveSuggestion(i)}
          onMouseLeave={() => setActiveSuggestion(-1)}
          onClick={() => onSuggestionClick(suggestion)}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
            transition-colors duration-100
            ${i === activeSuggestion
              ? 'bg-white/10 text-white'
              : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
            }
          `}
        >
          <FiSearch className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      );
    })}
  </div>
);

const MobileMenu = ({ open, onClose, links, isActive }) => (
  <>
    <div
      onClick={onClose}
      className={`
        fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
    />
    <div className={`
      fixed top-0 right-0 bottom-0 z-[295] w-72
      glass-sidebar shadow-[0_0_60px_rgba(0,0,0,0.8)]
      transition-transform duration-300
      ${open ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <span className="text-white font-black text-sm">X</span>
          </div>
          <span className="text-white font-bold tracking-tight">xmaster</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
      <nav className="p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isActive(link.path)
                ? 'bg-primary-600/15 text-white border border-primary-600/25'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }
            `}
          >
            <span className={isActive(link.path) ? 'text-primary-400' : 'text-white/40'}>
              {link.icon}
            </span>
            {link.label}
            {link.badge && (
              <span className="ml-auto px-1.5 py-px rounded-full text-[9px] font-bold bg-primary-600 text-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.08]">
        <p className="text-center text-xs text-white/20">
          © {new Date().getFullYear()} Xmaster. 18+ Only.
        </p>
      </div>
    </div>
  </>
);

export default Navbar;