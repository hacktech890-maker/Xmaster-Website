import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ className = '', autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Fetch suggestions
  const fetchSuggestions = debounce(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await publicAPI.getSearchSuggestions(q);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchSuggestions(query);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search videos..."
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-dark-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all"
        />
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-dark-100 rounded-full transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-200 rounded-lg shadow-lg border border-gray-100 dark:border-dark-100 overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-dark-100 flex items-center gap-3 transition-colors"
                  >
                    <FiSearch className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;