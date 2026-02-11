import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const WatchPage = lazy(() => import('./pages/public/WatchPage'));
const SearchPage = lazy(() => import('./pages/public/SearchPage'));
const CategoryPage = lazy(() => import('./pages/public/CategoryPage'));
const TrendingPage = lazy(() => import('./pages/public/TrendingPage'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const VideosManager = lazy(() => import('./pages/admin/VideosManager'));
const UploadPage = lazy(() => import('./pages/admin/UploadPage'));
const CategoriesManager = lazy(() => import('./pages/admin/CategoriesManager'));
const AdsManager = lazy(() => import('./pages/admin/AdsManager'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));

const AdminLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/xmaster-admin" replace />;
  return children;
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/watch/:id" element={<PublicLayout><WatchPage /></PublicLayout>} />
        <Route path="/watch/:id/:slug" element={<PublicLayout><WatchPage /></PublicLayout>} />
        <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
        <Route path="/category/:slug" element={<PublicLayout><CategoryPage /></PublicLayout>} />
        <Route path="/trending" element={<PublicLayout><TrendingPage /></PublicLayout>} />
        <Route path="/tag/:tag" element={<PublicLayout><SearchPage /></PublicLayout>} />

        <Route path="/xmaster-admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/videos" element={<AdminLayout><VideosManager /></AdminLayout>} />
        <Route path="/admin/upload" element={<AdminLayout><UploadPage /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout><CategoriesManager /></AdminLayout>} />
        <Route path="/admin/ads" element={<AdminLayout><AdsManager /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><ReportsPage /></AdminLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;