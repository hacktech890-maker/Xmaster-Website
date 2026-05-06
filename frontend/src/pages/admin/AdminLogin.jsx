// src/pages/admin/AdminLogin.jsx
// Premium admin login page
// Preserves: existing adminAPI.login() call, AuthContext.login()

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle } from 'react-icons/fi';

import { useAuth }   from '../../context/AuthContext';
import { adminAPI }  from '../../services/api';

// ============================================================
// ADMIN LOGIN
// ============================================================

const AdminLogin = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [attempts,  setAttempts]  = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    if (attempts >= 5) {
      setError('Too many failed attempts. Please wait before trying again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Existing API call — preserved
      const res   = await adminAPI.login(password);
      const token = res?.data?.token || res?.token;

      if (!token) throw new Error('No token received');

      login(token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setAttempts((p) => p + 1);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Invalid password. Please try again.');
      } else if (status === 429) {
        setError('Too many requests. Please wait a moment.');
      } else {
        setError('Login failed. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="
      min-h-screen bg-dark-500
      flex items-center justify-center
      p-4 relative overflow-hidden
    ">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="
          absolute top-1/4 left-1/4 w-96 h-96 rounded-full
          bg-primary-600/5 blur-3xl
        " />
        <div className="
          absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full
          bg-primary-800/5 blur-3xl
        " />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card */}
      <div className="
        relative w-full max-w-sm
        animate-scale-in
      ">
        {/* Outer glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/8 to-transparent" />

        <div className="
          relative rounded-2xl overflow-hidden
          bg-dark-300 border border-white/8
          shadow-[0_40px_100px_rgba(0,0,0,0.7)]
        ">
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary-600/60 to-transparent" />

          <div className="p-8">

            {/* Logo + title */}
            <div className="text-center mb-8">
              <div className="
                inline-flex items-center justify-center
                w-14 h-14 rounded-2xl mb-4
                bg-gradient-to-br from-primary-600/20 to-primary-900/20
                border border-primary-600/30
              ">
                <FiShield className="w-6 h-6 text-primary-400" />
              </div>
              <h1 className="text-xl font-black text-white mb-1">
                Admin Panel
              </h1>
              <p className="text-xs text-white/30">
                xmaster.guru — Restricted Access
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Error */}
              {error && (
                <div className="
                  flex items-start gap-2.5 p-3 rounded-xl
                  bg-red-500/10 border border-red-500/20
                  animate-fade-in
                ">
                  <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <div className="
                    absolute left-3 top-1/2 -translate-y-1/2
                    text-white/25 pointer-events-none
                  ">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoFocus
                    autoComplete="current-password"
                    disabled={loading || attempts >= 5}
                    className="
                      input-base pl-10 pr-10
                      disabled:opacity-50 disabled:pointer-events-none
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      text-white/25 hover:text-white/60
                      transition-colors duration-150
                    "
                    tabIndex={-1}
                  >
                    {showPass
                      ? <FiEyeOff className="w-4 h-4" />
                      : <FiEye    className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !password.trim() || attempts >= 5}
                className="
                  w-full py-3 rounded-xl
                  font-bold text-sm text-white
                  bg-gradient-to-r from-primary-600 to-primary-700
                  hover:from-primary-500 hover:to-primary-600
                  disabled:opacity-40 disabled:pointer-events-none
                  transition-all duration-200
                  shadow-[0_8px_25px_rgba(225,29,72,0.3)]
                  hover:shadow-[0_12px_35px_rgba(225,29,72,0.45)]
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiLock className="w-4 h-4" />
                    Access Panel
                  </>
                )}
              </button>

            </form>

            {/* Attempts warning */}
            {attempts > 0 && attempts < 5 && (
              <p className="
                text-center text-[10px] text-amber-400/60 mt-4
              ">
                {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
              </p>
            )}

          </div>

          {/* Bottom */}
          <div className="px-8 pb-6 text-center">
            <p className="text-[10px] text-white/15">
              Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;