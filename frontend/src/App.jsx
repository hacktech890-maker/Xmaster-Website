// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
// Contexts
import { useAuth }       from './context/AuthContext';
import { useDisclaimer } from './context/DisclaimerContext';
// Feature flags
import {
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from './config/features';
// Common components (NOT lazy — needed immediately)
import Navbar          from './components/common/Navbar';
import Footer          from './components/common/Footer';
import ScrollToTop     from './components/common/ScrollToTop';
import LoadingSpinner  from './components/common/LoadingSpinner';
import DisclaimerModal from './components/disclaimer/DisclaimerModal';
// ============================================================
// LAZY IMPORTS — Public Pages
// ============================================================
const WatchPage    = lazy(() => import('./pages/public/WatchPage'));
const SearchPage   = lazy(() => import('./pages/public/SearchPage'));
const TrendingPage = lazy(() => import('./pages/public/TrendingPage'));
const PremiumPage  = lazy(() => import('./pages/public/PremiumPage'));
const FreePage     = lazy(() => import('./pages/public/FreePage'));
const StudioPage   = lazy(() => import('./pages/public/StudioPage'));
// ============================================================
// LAZY IMPORTS — Admin Pages
// ============================================================
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard         = lazy(() => import('./pages/admin/Dashboard'));
const VideosManager     = lazy(() => import('./pages/admin/VideosManager'));
const UploadPage        = lazy(() => import('./pages/admin/UploadPage'));
const CategoriesManager = lazy(() => import('./pages/admin/CategoriesManager'));
const AdsManager        = lazy(() => import('./pages/admin/AdsManager'));
const CommentsManager   = lazy(() => import('./pages/admin/CommentsManager'));
const ReportsPage       = lazy(() => import('./pages/admin/ReportsPage'));
const DuplicateManager  = lazy(() => import('./pages/admin/DuplicateManager'));
// ============================================================
// LOADING FALLBACK
// ============================================================
const PageLoader = () => (
  <div className="min-h-screen bg-dark-400 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);
// ============================================================
// PUBLIC LAYOUT
// ============================================================
const PublicLayout = () => {
  const { accepted, checking } = useDisclaimer();
  if (checking) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  if (!accepted) {
    return <DisclaimerModal />;
  }
  return (
    <div className="min-h-screen bg-dark-400 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
// ============================================================
// PROTECTED ADMIN ROUTE
// ============================================================
const AdminRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/xmaster-admin" replace />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};
// ============================================================
// MAIN APP
// ============================================================
const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ====================================================
            PUBLIC ROUTES
            ==================================================== */}
        <Route element={<PublicLayout />}>
          {/* Root → redirect to Trending */}
          <Route index element={<Navigate to="/trending" replace />} />
          {/* Core routes */}
          <Route path="/watch/:id"       element={<WatchPage />} />
          <Route path="/watch/:id/:slug" element={<WatchPage />} />
          <Route path="/search"          element={<SearchPage />} />
          <Route path="/trending"        element={<TrendingPage />} />
          <Route path="/tag/:tag"        element={<SearchPage />} />
          {/* Premium section */}
          {PREMIUM_SECTION_ENABLED && (
            <>
              <Route path="/premium"      element={<PremiumPage />} />
              <Route path="/studio/:slug" element={<StudioPage />} />
            </>
          )}
          {/* Free section */}
          {FREE_SECTION_ENABLED && (
            <Route path="/free" element={<FreePage />} />
          )}
        </Route>
        {/* ====================================================
            ADMIN LOGIN — no layout wrapper
            ==================================================== */}
        <Route
          path="/xmaster-admin"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          }
        />
        {/* ====================================================
            PROTECTED ADMIN ROUTES
            ==================================================== */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="videos"     element={<VideosManager />} />
          <Route path="upload"     element={<UploadPage />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="ads"        element={<AdsManager />} />
          <Route path="comments"   element={<CommentsManager />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="duplicates" element={<DuplicateManager />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        {/* ====================================================
            FALLBACK
            ==================================================== */}
        <Route path="*" element={<Navigate to="/trending" replace />} />
      </Routes>
    </>
  );
};
export default App;
