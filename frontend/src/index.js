// src/index.js
// UPDATED: Added DisclaimerProvider + removed SW killer (replaced with no-op SW)
// All existing providers preserved in correct order

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Global styles (must be first)
import './index.css';

// Context providers
import { ThemeProvider }      from './context/ThemeContext';
import { AuthProvider }       from './context/AuthContext';
import { DisclaimerProvider } from './context/DisclaimerContext';

// Main app
import App from './App';

// ============================================================
// SERVICE WORKER — Disable cleanly
// Original code killed SWs aggressively; this is a cleaner approach
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

// ============================================================
// TOAST CONFIGURATION
// Global toast settings for consistent UX
// ============================================================

const TOAST_CONFIG = {
  position: 'bottom-right',
  duration: 4000,
  style: {
    background: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '14px',
    padding: '12px 16px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  },
  error: {
    iconTheme: {
      primary: '#e11d48',
      secondary: '#ffffff',
    },
    duration: 5000,
  },
};

// ============================================================
// RENDER
// ============================================================

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <DisclaimerProvider>

              <App />

              {/* Global toast notifications */}
              <Toaster
                position={TOAST_CONFIG.position}
                toastOptions={{
                  duration: TOAST_CONFIG.duration,
                  style:    TOAST_CONFIG.style,
                  success:  TOAST_CONFIG.success,
                  error:    TOAST_CONFIG.error,
                }}
              />

            </DisclaimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);