import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiVideo, FiUpload, FiGrid, FiDollarSign,
  FiFlag, FiLogOut, FiMenu, FiX, FiSettings, FiMessageSquare,
  FiCopy
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
    { name: 'Videos', path: '/admin/videos', icon: FiVideo },
    { name: 'Upload', path: '/admin/upload', icon: FiUpload },
    { name: 'Categories', path: '/admin/categories', icon: FiGrid },
    { name: 'Comments', path: '/admin/comments', icon: FiMessageSquare },
    { name: 'Duplicates', path: '/admin/duplicates', icon: FiCopy },
    { name: 'Ads', path: '/admin/ads', icon: FiDollarSign },
    { name: 'Reports', path: '/admin/reports', icon: FiFlag },
  ];

  const handleLogout = () => {
    logout();
    navigate('/xmaster-admin');
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-100">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Xmaster"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xmaster</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive(item.path)
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-100 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-all"
        >
          <FiSettings className="w-5 h-5" />
          <span>View Site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all w-full"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-100 rounded-lg shadow-lg"
      >
        {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-dark-300 border-r border-gray-200 dark:border-dark-100 z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;