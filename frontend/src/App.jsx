// src/App.jsx
// REPLACED: Full route definitions with new layout system
// Preserves ALL existing routes + adds new premium routes
// Adds disclaimer gate, new pages, updated layouts

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Contexts
import { useAuth }       from './context/AuthContext';
import { useDisclaimer } from './context/DisclaimerContext';

// Feature flags
import {
  CATEGORIES_ENABLED,
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from './config/features';

// Common components (NOT lazy — needed immediately)
import Navbar         from './components/common/Navbar';
import Footer         from './components/common/Footer';
import ScrollToTop    from './components/common/ScrollToTop';
import LoadingSpinner from './components/common/LoadingSpinner';
import DisclaimerModal from './components/disclaimer/DisclaimerModal';

// ============================================================
// LAZY IMPORTS — Public Pages
// ============================================================

const HomePage      = lazy(() => import('./pages/public/HomePage'));
const WatchPage     = lazy(() => import('./pages/public/WatchPage'));
const SearchPage    = lazy(() => import('./pages/public/SearchPage'));
const TrendingPage  = lazy(() => import('./pages/public/TrendingPage'));
const CategoryPage  = lazy(() => import('./pages/public/CategoryPage'));
const PremiumPage   = lazy(() => import('./pages/public/PremiumPage'));
const FreePage      = lazy(() => import('./pages/public/FreePage'));
const StudioPage    = lazy(() => import('./pages/public/StudioPage'));

// ============================================================
// LAZY IMPORTS — Admin Pages
// ============================================================

const AdminLogin         = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard          = lazy(() => import('./pages/admin/Dashboard'));
const VideosManager      = lazy(() => import('./pages/admin/VideosManager'));
const UploadPage         = lazy(() => import('./pages/admin/UploadPage'));
const CategoriesManager  = lazy(() => import('./pages/admin/CategoriesManager'));
const AdsManager         = lazy(() => import('./pages/admin/AdsManager'));
const CommentsManager    = lazy(() => import('./pages/admin/CommentsManager'));
const ReportsPage        = lazy(() => import('./pages/admin/ReportsPage'));
const DuplicateManager   = lazy(() => import('./pages/admin/DuplicateManager'));

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
// Wraps all public pages with Navbar + Footer
// ============================================================

const PublicLayout = () => {
  const { accepted, checking } = useDisclaimer();

  // While checking localStorage, show nothing (prevents flash)
  if (checking) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Show disclaimer gate if not accepted
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
// ADMIN LAYOUT WRAPPER
// Checks auth before rendering admin pages
// AdminLayout itself is imported inside each admin page
// (keeps existing pattern — AdminLayout wraps content internally)
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
// MAIN APP COMPONENT
// ============================================================

const App = () => {
  return (
    <>
      <ScrollToTop />

      <Routes>

        {/* ====================================================
            PUBLIC ROUTES
            All wrapped in PublicLayout (Navbar + Footer + Disclaimer)
            ==================================================== */}
        <Route element={<PublicLayout />}>

          {/* Core routes — preserved from original */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/watch/:id"     element={<WatchPage />} />
          <Route path="/watch/:id/:slug" element={<WatchPage />} />
          <Route path="/search"        element={<SearchPage />} />
          <Route path="/trending"      element={<TrendingPage />} />
          <Route path="/tag/:tag"      element={<SearchPage />} />

          {/* Category routes — controlled by feature flag */}
          {CATEGORIES_ENABLED && (
            <Route path="/category/:slug" element={<CategoryPage />} />
          )}

          {/* NEW: Premium section */}
          {PREMIUM_SECTION_ENABLED && (
            <>
              <Route path="/premium"           element={<PremiumPage />} />
              <Route path="/studio/:slug"      element={<StudioPage />} />
            </>
          )}

          {/* NEW: Free/Desi content section */}
          {FREE_SECTION_ENABLED && (
            <Route path="/free"  element={<FreePage />} />
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
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="videos"       element={<VideosManager />} />
          <Route path="upload"       element={<UploadPage />} />
          <Route path="categories"   element={<CategoriesManager />} />
          <Route path="ads"          element={<AdsManager />} />
          <Route path="comments"     element={<CommentsManager />} />
          <Route path="reports"      element={<ReportsPage />} />
          <Route path="duplicates"   element={<DuplicateManager />} />
          {/* Default admin redirect */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* ====================================================
            FALLBACK — redirect unknown routes to home
            ==================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
};

export default App;