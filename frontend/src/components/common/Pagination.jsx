// src/components/common/Pagination.jsx
// Modern premium pagination component

import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

// ============================================================
// PAGINATION COMPONENT
// ============================================================

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible    = 5,
  className     = '',
}) => {
  if (!totalPages || totalPages <= 1) return null;

  // ── Page range calculation ─────────────────────────────────
  const getPageRange = () => {
    const half  = Math.floor(maxVisible / 2);
    let start   = Math.max(1, currentPage - half);
    let end     = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = getPageRange();

  // ── Button helpers ─────────────────────────────────────────

  const PageBtn = ({ page, active = false, disabled = false, children, label }) => (
    <button
      onClick={() => !disabled && !active && onPageChange(page)}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-lg text-sm font-medium
        transition-all duration-150
        ${active
          ? 'bg-primary-600 text-white shadow-glow-sm cursor-default'
          : disabled
            ? 'text-white/20 cursor-not-allowed'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }
      `}
    >
      {children ?? page}
    </button>
  );

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 ${className}`}
    >
      {/* First page */}
      {showFirstLast && (
        <PageBtn
          page={1}
          disabled={currentPage === 1}
          label="First page"
        >
          <FiChevronsLeft className="w-4 h-4" />
        </PageBtn>
      )}

      {/* Previous */}
      <PageBtn
        page={currentPage - 1}
        disabled={currentPage === 1}
        label="Previous page"
      >
        <FiChevronLeft className="w-4 h-4" />
      </PageBtn>

      {/* Start ellipsis */}
      {pages[0] > 1 && (
        <>
          <PageBtn page={1} label="Page 1" />
          {pages[0] > 2 && (
            <span className="w-9 h-9 flex items-center justify-center text-white/30 text-sm">
              …
            </span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map((page) => (
        <PageBtn
          key={page}
          page={page}
          active={page === currentPage}
          label={`Page ${page}`}
        />
      ))}

      {/* End ellipsis */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="w-9 h-9 flex items-center justify-center text-white/30 text-sm">
              …
            </span>
          )}
          <PageBtn page={totalPages} label={`Page ${totalPages}`} />
        </>
      )}

      {/* Next */}
      <PageBtn
        page={currentPage + 1}
        disabled={currentPage === totalPages}
        label="Next page"
      >
        <FiChevronRight className="w-4 h-4" />
      </PageBtn>

      {/* Last page */}
      {showFirstLast && (
        <PageBtn
          page={totalPages}
          disabled={currentPage === totalPages}
          label="Last page"
        >
          <FiChevronsRight className="w-4 h-4" />
        </PageBtn>
      )}

      {/* Page info */}
      <span className="hidden sm:block ml-3 text-xs text-white/30 font-medium">
        {currentPage} / {totalPages}
      </span>
    </nav>
  );
};

export default Pagination;