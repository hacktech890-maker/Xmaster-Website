import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';

const LOGO_URL = "https://i.pinimg.com/736x/02/69/f5/0269f5864fb318eb5e17bac1c4c9bcff.jpg";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-300 border-t border-gray-100 dark:border-dark-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={LOGO_URL}
                alt="Xmaster"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Xmaster</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">
              Watch and enjoy high-quality videos. Your ultimate destination for entertainment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">Home</Link></li>
              <li><Link to="/trending" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">Trending</Link></li>
              <li><Link to="/search" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">Search</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm transition-colors">DMCA</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-dark-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">© {currentYear} Xmaster. All rights reserved.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            Made with <FiHeart className="w-4 h-4 text-primary-500" /> for entertainment
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;