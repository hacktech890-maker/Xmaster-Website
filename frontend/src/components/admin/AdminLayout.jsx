// src/components/admin/AdminLayout.jsx
// Premium admin layout with collapsible sidebar + header
// Wraps all admin pages

import React, { useState, useEffect } from 'react';
import { useLocation }  from 'react-router-dom';
import AdminSidebar     from './AdminSidebar';
import AdminHeader      from './AdminHeader';

// ============================================================
// ADMIN LAYOUT
// ============================================================

const AdminLayout = ({
  children,
  title    = '',
  actions  = null,    // optional header action buttons
}) => {
  const location = useLocation();
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [sidebarCollapsed,setSidebarCollapsed] = useState(false);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xmaster_sidebar_collapsed');
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('xmaster_sidebar_collapsed', String(next));
  };

  const sidebarW = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="
      min-h-screen bg-dark-400
      flex overflow-hidden
    ">
      {/* ── Mobile backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="
            fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm
            lg:hidden
          "
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-[210]
          transition-all duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: sidebarW }}
      >
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        className="
          flex-1 flex flex-col
          min-h-screen overflow-hidden
          transition-all duration-300
        "
        style={{ marginLeft: `clamp(0px, ${sidebarW}, ${sidebarW})` }}
      >
        {/* Header */}
        <AdminHeader
          title={title}
          actions={actions}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page content */}
        <main className="
          flex-1 overflow-y-auto
          p-4 sm:p-6
          bg-dark-400
        ">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;