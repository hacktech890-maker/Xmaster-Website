import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;