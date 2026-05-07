// src/pages/public/PremiumPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiStar, FiAward } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { PREMIUM_STUDIOS } from '../../config/studios';

const PremiumPage = () => {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'featured'
    ? PREMIUM_STUDIOS.filter((s) => s.featured)
    : PREMIUM_STUDIOS;

  return (
    <>
      <Helmet>
        <title>Premium Studios — Xmaster</title>
        <meta name="description" content="Browse premium adult studios on Xmaster." />
      </Helmet>

      <div className="min-h-screen bg-dark-400">
        <div className="relative overflow-hidden bg-gradient-to-b from-dark-500 to-dark-400 border-b border-white/5 py-12 sm:py-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
          <div className="container-site relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20">
              <FiAward className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">Premium Studios</h1>
            <p className="text-base text-white/50 max-w-md mx-auto mb-6">
              Browse exclusive content from the world's top adult studios
            </p>
            <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/[0.08]">
              {['all', 'featured'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${filter === f ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-white/40 hover:text-white/70'}`}
                >
                  {f === 'all' ? 'All Studios' : 'Featured'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container-site py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((studio, i) => (
              <Link
                key={studio.id}
                to={`/studio/${studio.slug}`}
                className="group relative rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both', aspectRatio: '16/9' }}
              >
                <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100 opacity-85" style={{ background: studio.gradient }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 25% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)` }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                  <span className="font-black text-white text-sm sm:text-base text-shadow leading-tight mb-1.5 group-hover:scale-105 transition-transform duration-300">
                    {studio.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-black/30 text-white/80 border border-white/20">
                    {studio.badge}
                  </span>
                </div>
                {studio.featured && (
                  <div className="absolute top-2 right-2">
                    <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PremiumPage;