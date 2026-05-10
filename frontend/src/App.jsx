// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth }       from './context/AuthContext';
import { useDisclaimer } from './context/DisclaimerContext';
import {
  PREMIUM_SECTION_ENABLED,
  FREE_SECTION_ENABLED,
} from './config/features';
import Navbar          from './components/common/Navbar';
import Footer          from './components/common/Footer';
import ScrollToTop     from './components/common/ScrollToTop';
import LoadingSpinner  from './components/common/LoadingSpinner';
import DisclaimerModal from './components/disclaimer/DisclaimerModal';

// ── Public Pages ─────────────────────────────────────────────
const WatchPage  = lazy(() => import('./pages/public/WatchPage'));
const SearchPage = lazy(() => import('./pages/public/SearchPage'));
const PremiumPage = lazy(() => import('./pages/public/PremiumPage'));
const FreePage   = lazy(() => import('./pages/public/FreePage'));
const StudioPage = lazy(() => import('./pages/public/StudioPage'));

// ── Legal Pages ──────────────────────────────────────────────
const PrivacyPage    = lazy(() => import('./pages/legal/PrivacyPage'));
const TermsPage      = lazy(() => import('./pages/legal/TermsPage'));
const DmcaPage       = lazy(() => import('./pages/legal/DmcaPage'));
const DisclaimerPage = lazy(() => import('./pages/legal/DisclaimerPage'));
const Statement2257  = lazy(() => import('./pages/legal/Statement2257'));

// ── Admin Pages ──────────────────────────────────────────────
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard         = lazy(() => import('./pages/admin/Dashboard'));
const VideosManager     = lazy(() => import('./pages/admin/VideosManager'));
const UploadPage        = lazy(() => import('./pages/admin/UploadPage'));
const CategoriesManager = lazy(() => import('./pages/admin/CategoriesManager'));
const AdsManager        = lazy(() => import('./pages/admin/AdsManager'));
const CommentsManager   = lazy(() => import('./pages/admin/CommentsManager'));
const ReportsPage       = lazy(() => import('./pages/admin/ReportsPage'));
const DuplicateManager  = lazy(() => import('./pages/admin/DuplicateManager'));
const ContactManager    = lazy(() => import('./pages/admin/ContactManager'));

// ── Loading fallback ─────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-dark-400 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// ── Public layout ─────────────────────────────────────────────
const PublicLayout = () => {
  const { accepted, checking } = useDisclaimer();
  if (checking) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  if (!accepted) return <DisclaimerModal />;
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

// ── Protected admin route ─────────────────────────────────────
const AdminRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/xmaster-admin" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

// ── Root redirect target ──────────────────────────────────────
// Trending removed — redirect to /free if enabled, else /search
const ROOT_REDIRECT = FREE_SECTION_ENABLED ? '/free' : '/search';

// ── Main App ──────────────────────────────────────────────────
const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<Navigate to={ROOT_REDIRECT} replace />} />

          <Route path="/watch/:id"       element={<WatchPage />} />
          <Route path="/watch/:id/:slug" element={<WatchPage />} />
          <Route path="/search"          element={<SearchPage />} />
          <Route path="/tag/:tag"        element={<SearchPage />} />

          {PREMIUM_SECTION_ENABLED && (
            <>
              <Route path="/premium"      element={<PremiumPage />} />
              <Route path="/studio/:slug" element={<StudioPage />} />
            </>
          )}

          {FREE_SECTION_ENABLED && (
            <Route path="/free" element={<FreePage />} />
          )}

          <Route path="/privacy"    element={<PrivacyPage />} />
          <Route path="/terms"      element={<TermsPage />} />
          <Route path="/dmca"       element={<DmcaPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/2257"       element={<Statement2257 />} />
        </Route>

        {/* Admin login — no layout */}
        <Route
          path="/xmaster-admin"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Protected admin routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="videos"     element={<VideosManager />} />
          <Route path="upload"     element={<UploadPage />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="ads"        element={<AdsManager />} />
          <Route path="comments"   element={<CommentsManager />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="duplicates" element={<DuplicateManager />} />
          <Route path="contacts"   element={<ContactManager />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to={ROOT_REDIRECT} replace />} />
      </Routes>
    </>
  );
};

export default App;