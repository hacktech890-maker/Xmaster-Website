// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiVideo, FiUpload,
  FiMessageSquare, FiBarChart2, FiAlertTriangle,
  FiCopy, FiChevronLeft, FiChevronRight,
  FiX, FiDollarSign, FiLayers,
} from 'react-icons/fi';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',  path: '/admin/dashboard', icon: <FiHome className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Videos',     path: '/admin/videos',     icon: <FiVideo   className="w-4 h-4" /> },
      { label: 'Upload',     path: '/admin/upload',     icon: <FiUpload  className="w-4 h-4" />, badge: 'NEW' },
      { label: 'Categories', path: '/admin/categories', icon: <FiLayers  className="w-4 h-4" /> },
      { label: 'Duplicates', path: '/admin/duplicates', icon: <FiCopy    className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { label: 'Comments', path: '/admin/comments', icon: <FiMessageSquare className="w-4 h-4" /> },
      { label: 'Reports',  path: '/admin/reports',  icon: <FiAlertTriangle className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { label: 'Analytics', path: '/admin/dashboard', icon: <FiBarChart2  className="w-4 h-4" /> },
      { label: 'Ads',       path: '/admin/ads',       icon: <FiDollarSign className="w-4 h-4" /> },
    ],
  },
];

const AdminSidebar = ({ collapsed, onToggleCollapse, onClose }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-full flex flex-col glass-sidebar overflow-hidden">
      <div className="
        flex items-center gap-3
        px-4 h-14 sm:h-16
        border-b border-white/[0.06]
        flex-shrink-0
      ">
        <div className="
          w-8 h-8 rounded-xl flex-shrink-0
          bg-gradient-to-br from-primary-600 to-primary-800
          flex items-center justify-center shadow-glow-sm
        ">
          <span className="text-white font-black text-sm">X</span>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-sm font-bold text-white truncate">Xmaster</p>
            <p className="text-[10px] text-white/30">Admin Panel</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="
            lg:hidden ml-auto w-7 h-7 rounded-lg
            flex items-center justify-center
            text-white/40 hover:text-white hover:bg-white/10
            transition-all duration-200
          "
        >
          <FiX className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex ml-auto w-7 h-7 rounded-lg
            items-center justify-center
            text-white/30 hover:text-white hover:bg-white/10
            transition-all duration-200
          "
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <FiChevronRight className="w-3.5 h-3.5" />
            : <FiChevronLeft  className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-bold text-white/25 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-150 group relative
                    ${active
                      ? 'bg-primary-600/15 text-white border border-primary-600/20'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <span className={`
                    flex-shrink-0 transition-colors duration-150
                    ${active ? 'text-primary-400' : 'text-white/40 group-hover:text-white/70'}
                  `}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="
                      px-1.5 py-px rounded-full text-[9px] font-bold
                      bg-primary-600/20 text-primary-400 border border-primary-600/25
                    ">
                      {item.badge}
                    </span>
                  )}

                  {active && (
                    <span className="
                      absolute left-0 top-1/2 -translate-y-1/2
                      w-0.5 h-5 rounded-full bg-primary-600
                    " />
                  )}

                  {collapsed && (
                    <div className="
                      absolute left-full ml-3 z-50
                      px-2.5 py-1.5 rounded-lg
                      bg-dark-100 border border-white/10
                      text-xs font-medium text-white whitespace-nowrap
                      shadow-[0_8px_25px_rgba(0,0,0,0.5)]
                      opacity-0 pointer-events-none
                      group-hover:opacity-100 transition-opacity duration-200
                    ">
                      {item.label}
                      {item.badge && (
                        <span className="ml-1.5 text-primary-400">{item.badge}</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-white/[0.06] p-3">
        {!collapsed ? (
          <div className="
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-white/[0.04] border border-white/[0.06]
          ">
            <div className="
              w-7 h-7 rounded-full flex-shrink-0
              bg-gradient-to-br from-primary-600/30 to-primary-800/30
              border border-primary-600/20
              flex items-center justify-center
            ">
              <span className="text-xs font-bold text-primary-400">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">Administrator</p>
              <p className="text-[10px] text-white/30 truncate">xmaster.guru</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="
              w-8 h-8 rounded-full
              bg-gradient-to-br from-primary-600/30 to-primary-800/30
              border border-primary-600/20
              flex items-center justify-center
            ">
              <span className="text-xs font-bold text-primary-400">A</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;