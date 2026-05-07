// src/components/admin/AdminHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMenu, FiExternalLink, FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminHeader = ({ title, actions, onMenuToggle }) => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/xmaster-admin', { replace: true });
  };

  return (
    <header className="
      sticky top-0 z-[150]
      h-14 sm:h-16
      flex items-center
      px-4 sm:px-6
      bg-dark-300/95 backdrop-blur-md
      border-b border-white/[0.06]
      shadow-[0_2px_20px_rgba(0,0,0,0.3)]
      gap-4
    ">
      <button
        onClick={onMenuToggle}
        className="
          lg:hidden
          w-8 h-8 rounded-lg flex-shrink-0
          flex items-center justify-center
          text-white/50 hover:text-white
          hover:bg-white/10
          transition-all duration-200
        "
      >
        <FiMenu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-sm sm:text-base font-bold text-white truncate">
            {title}
          </h1>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="https://xmaster.guru"
          target="_blank"
          rel="noopener noreferrer"
          className="
            hidden sm:flex items-center gap-1.5
            px-3 py-1.5 rounded-lg text-xs font-medium
            text-white/40 hover:text-white
            bg-white/5 hover:bg-white/10
            border border-white/[0.08]
            transition-all duration-200
          "
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          View Site
        </a>

        <button
          onClick={handleLogout}
          className="
            flex items-center gap-1.5
            px-3 py-1.5 rounded-lg text-xs font-medium
            text-red-400/70 hover:text-red-400
            bg-red-500/5 hover:bg-red-500/10
            border border-red-500/10 hover:border-red-500/20
            transition-all duration-200
          "
        >
          <FiLogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;