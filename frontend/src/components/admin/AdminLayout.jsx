import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import ThemeToggle from '../common/ThemeToggle';

const AdminLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-400 flex">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-dark-300 border-b border-dark-100 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-dark-200 rounded-lg text-gray-400"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-white">{title}</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;