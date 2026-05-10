// src/pages/legal/LegalPage.jsx
// Reusable layout wrapper for all legal pages
import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const LegalPage = ({ title, lastUpdated, children }) => (
  <div className="min-h-screen bg-dark-400">
    <div className="bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-8 sm:py-12">
      <div className="container-site">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 text-xs text-white/40 hover:text-white/70 transition-colors">
          <FiArrowLeft className="w-3.5 h-3.5" />Home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-xs text-white/30">Last updated: {lastUpdated}</p>
        )}
      </div>
    </div>

    <div className="container-site py-8 sm:py-12">
      <div className="max-w-3xl prose-legal">
        {children}
      </div>
    </div>
  </div>
);

// Shared prose styles via inline className helpers
export const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    <div className="text-sm text-white/55 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const P = ({ children }) => (
  <p className="text-sm text-white/55 leading-relaxed">{children}</p>
);

export const Ul = ({ items }) => (
  <ul className="list-disc list-inside space-y-1 text-sm text-white/50 leading-relaxed pl-2">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

export default LegalPage;