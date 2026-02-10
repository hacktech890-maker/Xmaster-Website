import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiTrendingUp,
  FiGrid,
  FiSearch,
} from "react-icons/fi";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", path: "/", icon: FiHome },
    { name: "Trending", path: "/trending", icon: FiTrendingUp },
    { name: "Categories", path: "/#categories", icon: FiGrid },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-dark-300 border-b border-gray-100 dark:border-dark-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {/* Try to load custom logo, fallback to text logo */}
            <img
              src="/logo.png"
              alt="Xmaster"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain"
              onError={(e) => {
                // If logo.png doesn't exist, show text fallback
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            {/* Fallback logo (hidden by default if image loads) */}
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg items-center justify-center hidden"
              style={{ display: "none" }}
            >
              <span className="text-white font-bold text-lg sm:text-xl">X</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Xmaster
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-all text-sm font-medium"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            ))}
            <ThemeToggle className="ml-2" />
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileMenuOpen(false);
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setSearchOpen(false);
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 dark:border-dark-100 animate-fade-in">
            <SearchBar
              autoFocus
              onSearch={() => setSearchOpen(false)}
            />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-100 dark:border-dark-100 animate-fade-in">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-all"
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;