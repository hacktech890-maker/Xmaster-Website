// src/components/common/Modal.jsx
// Reusable premium modal component

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

// ============================================================
// MODAL COMPONENT
// ============================================================

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',    // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose = true,
  className = '',
}) => {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const SIZE_MAP = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="
        fixed inset-0 z-50
        flex items-center justify-center p-4
        bg-black/70 backdrop-blur-md
        animate-fade-in
      "
    >
      <div
        className={`
          relative w-full ${SIZE_MAP[size] || SIZE_MAP.md}
          glass-modal
          shadow-[0_40px_120px_rgba(0,0,0,0.8)]
          animate-scale-in
          ${className}
        `}
      >
        {/* Top accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-600/50 to-transparent rounded-t-2xl" />

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
            {title && (
              <h2 className="text-lg font-bold text-white">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="
                  ml-auto p-2 rounded-lg
                  text-white/40 hover:text-white
                  hover:bg-white/10
                  transition-all duration-150
                "
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;