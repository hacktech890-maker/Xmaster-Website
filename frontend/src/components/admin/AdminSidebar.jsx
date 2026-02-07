import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiVideo, FiUpload, FiGrid, FiDollarSign, 
  FiFlag, FiSettings, FiLogOut, FiBarChart2, FiX 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/videos', icon: FiVideo, label: 'Videos' },
    { path: '/admin/upload', icon: FiUpload, label: 'Upload' },
    { path: '/admin/categories', icon: FiGrid, label: 'Categories' },
    { path: '/admin/ads', icon: FiDollarSign, label: 'Ads' },
    { path: '/admin/reports', icon: FiFlag, label: 'Reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/xmaster-admin');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-300 transform transition-transform duration-300 lg:transform-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-100">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">X</span>
              </div>
              <span className="text-lg font-bold text-white">Admin</span>
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-dark-200 rounded-lg"
            >
              <FiX className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-100 space-y-2">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-200 hover:text-white transition-all"
            >
              <FiBarChart2 className="w-5 h-5" />
              <span className="font-medium">View Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;