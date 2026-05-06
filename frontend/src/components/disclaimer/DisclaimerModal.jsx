// src/components/disclaimer/DisclaimerModal.jsx
// Premium fullscreen 18+ age verification gate
// Shows before user can access any content
// Acceptance stored in localStorage for 30 days

import React, { useEffect, useState } from 'react';
import { useDisclaimer } from '../../context/DisclaimerContext';

// ============================================================
// DISCLAIMER MODAL COMPONENT
// ============================================================

const DisclaimerModal = () => {
  const { handleAccept, handleExit } = useDisclaimer();
  const [visible, setVisible]         = useState(false);
  const [exiting, setExiting]         = useState(false);

  // Animate in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const onAccept = () => {
    setExiting(true);
    setTimeout(handleAccept, 500);
  };

  const onExit = () => {
    handleExit();
  };

  return (
    <div
      style={{ zIndex: 9999 }}
      className={`
        fixed inset-0 flex items-center justify-center p-4
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* ── Backdrop ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

      {/* ── Animated background elements ─────────────────────── */}
      <BackgroundEffects />

      {/* ── Modal Card ───────────────────────────────────────── */}
      <div
        className={`
          relative w-full max-w-lg mx-auto
          transition-all duration-500
          ${visible && !exiting
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
          }
        `}
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary-600/30 via-transparent to-transparent" />

        {/* Card body */}
        <div className="
          relative rounded-2xl overflow-hidden
          bg-gradient-to-b from-dark-300 to-dark-400
          border border-white/10
          shadow-[0_40px_120px_rgba(0,0,0,0.8)]
        ">
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-600 to-transparent" />

          <div className="p-8 sm:p-10">

            {/* ── Logo / Brand ───────────────────────────────── */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="
                  w-10 h-10 rounded-xl
                  bg-gradient-to-br from-primary-600 to-primary-800
                  flex items-center justify-center
                  shadow-[0_0_20px_rgba(225,29,72,0.4)]
                ">
                  <span className="text-white font-black text-lg">X</span>
                </div>
                <span className="text-white font-bold text-2xl tracking-tight">
                  Xmaster
                </span>
              </div>
            </div>

            {/* ── 18+ Badge ──────────────────────────────────── */}
            <div className="flex justify-center mb-6">
              <div className="
                relative inline-flex items-center justify-center
                w-24 h-24 rounded-full
                bg-gradient-to-br from-primary-600/20 to-primary-900/20
                border-2 border-primary-600/50
                animate-[glowPulse_2s_ease-in-out_infinite]
              ">
                {/* Inner ring */}
                <div className="
                  absolute inset-2 rounded-full
                  border border-primary-600/30
                " />
                <span className="
                  text-3xl font-black text-primary-500
                  tracking-tighter
                ">
                  18+
                </span>
              </div>
            </div>

            {/* ── Headline ───────────────────────────────────── */}
            <div className="text-center mb-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Adults Only
              </h1>
              <p className="text-sm text-white/40 mt-1 font-medium tracking-wide uppercase">
                Age Verification Required
              </p>
            </div>

            {/* ── Divider ────────────────────────────────────── */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/8" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600/60" />
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* ── Warning Text ───────────────────────────────── */}
            <div className="
              rounded-xl p-4 mb-6
              bg-white/[0.03] border border-white/8
              text-center
            ">
              <p className="text-white/70 text-sm leading-relaxed">
                This website contains{' '}
                <span className="text-white font-semibold">
                  adult content including explicit material.
                </span>
                {' '}By entering, you confirm that you are{' '}
                <span className="text-primary-400 font-bold">18 years of age or older</span>
                {' '}and agree to our{' '}
                <a
                  href="/terms"
                  className="text-primary-400 underline underline-offset-2 hover:text-primary-300 transition-colors"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>

            {/* ── Legal Bullets ──────────────────────────────── */}
            <ul className="space-y-2 mb-8">
              {[
                'I am 18 years of age or older',
                'Adult content is legal in my jurisdiction',
                'I agree to the Terms of Service',
                'I want to access this website voluntarily',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                  <span className="
                    flex-shrink-0 mt-0.5
                    w-3.5 h-3.5 rounded-full
                    bg-primary-600/20 border border-primary-600/40
                    flex items-center justify-center
                  ">
                    <svg className="w-2 h-2 text-primary-500" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* ── Action Buttons ─────────────────────────────── */}
            <div className="flex flex-col gap-3">

              {/* Enter button */}
              <button
                onClick={onAccept}
                className="
                  relative w-full py-4 rounded-xl
                  font-bold text-base text-white
                  bg-gradient-to-r from-primary-600 to-primary-700
                  hover:from-primary-500 hover:to-primary-600
                  active:scale-[0.98]
                  transition-all duration-200
                  shadow-[0_8px_30px_rgba(225,29,72,0.35)]
                  hover:shadow-[0_12px_40px_rgba(225,29,72,0.5)]
                  overflow-hidden group
                "
              >
                {/* Shimmer effect on hover */}
                <span className="
                  absolute inset-0
                  bg-gradient-to-r from-transparent via-white/10 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%]
                  transition-transform duration-700
                " />
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  I am 18+ — Enter Site
                </span>
              </button>

              {/* Exit button */}
              <button
                onClick={onExit}
                className="
                  w-full py-3.5 rounded-xl
                  font-medium text-sm text-white/40
                  bg-white/[0.04] border border-white/8
                  hover:bg-white/[0.07] hover:text-white/60
                  hover:border-white/15
                  active:scale-[0.98]
                  transition-all duration-200
                "
              >
                I am Under 18 — Exit
              </button>
            </div>

            {/* ── Footer Note ────────────────────────────────── */}
            <p className="text-center text-[10px] text-white/20 mt-6 leading-relaxed">
              This site uses cookies. By entering you accept our cookie policy.
              All performers are 18+ years of age. Content is protected by copyright.
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// BACKGROUND EFFECTS — animated orbs behind modal
// ============================================================

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">

    {/* Top-left red orb */}
    <div className="
      absolute -top-32 -left-32 w-96 h-96 rounded-full
      bg-primary-600/8 blur-3xl
      animate-[bounceSubtle_6s_ease-in-out_infinite]
    " />

    {/* Bottom-right red orb */}
    <div className="
      absolute -bottom-32 -right-32 w-80 h-80 rounded-full
      bg-primary-800/10 blur-3xl
      animate-[bounceSubtle_8s_ease-in-out_infinite_reverse]
    " />

    {/* Center glow */}
    <div className="
      absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
      w-[600px] h-[600px] rounded-full
      bg-primary-600/4 blur-3xl
    " />

    {/* Subtle grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
  </div>
);

export default DisclaimerModal;