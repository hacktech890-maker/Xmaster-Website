import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children, title = '' }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-0 md:ml-64">
          {/* Header */}
          {title && (
            <div className="bg-white dark:bg-dark-300 border-b border-gray-100 dark:border-dark-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;