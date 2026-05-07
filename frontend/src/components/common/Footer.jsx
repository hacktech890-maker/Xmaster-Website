// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiMail, FiShield, FiTrendingUp } from 'react-icons/fi';

const FOOTER_LINKS = {
  Browse: [
    { label: 'Home',        path: '/'        },
    { label: 'Trending',    path: '/trending' },
    { label: 'Premium',     path: '/premium'  },
    { label: 'Free Videos', path: '/free'     },
    { label: 'Search',      path: '/search'   },
  ],
  Legal: [
    { label: 'Terms of Service', path: '/terms'   },
    { label: 'Privacy Policy',   path: '/privacy' },
    { label: 'DMCA',             path: '/dmca'    },
    { label: '2257 Statement',   path: '/2257'    },
    { label: 'Content Removal',  path: '/removal' },
  ],
  Support: [
    { label: 'Contact Us',     path: '/contact'   },
    { label: 'Report Content', path: '#'          },
    { label: 'Advertise',      path: '/advertise' },
  ],
};

const POPULAR_TAGS = [
  'Indian','Desi','MMS','Bhabhi','Tamil',
  'Telugu','College','Amateur','Webcam','Viral',
  'Hidden Cam','Selfie','Couple',
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 bg-dark-500 border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px
                      bg-gradient-to-r from-transparent via-primary-600/40 to-transparent" />

      <div className="container-site py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-glow-sm">
                <span className="text-white font-black text-lg">X</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">xmaster</span>
            </Link>

            <p className="text-sm text-white/40 leading-relaxed max-w-xs mb-5">
              Free adult video streaming platform. Watch the latest Indian
              MMS, desi clips, and premium content in HD quality.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600/10 border border-primary-600/20 mb-5">
              <span className="text-primary-500 font-black text-sm">18+</span>
              <span className="text-xs text-white/40">Adults only</span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { icon: <FiTwitter className="w-4 h-4" />, label: 'Twitter', href: '#' },
                { icon: <FiMail    className="w-4 h-4" />, label: 'Email',   href: 'mailto:support@xmaster.guru' },
                { icon: <FiShield  className="w-4 h-4" />, label: 'DMCA',    href: '/dmca' },
              ].map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    w-9 h-9 rounded-xl flex items-center justify-center
                    bg-white/[0.06] hover:bg-white/[0.12]
                    border border-white/[0.08] hover:border-white/[0.18]
                    text-white/40 hover:text-white
                    transition-all duration-200
                  "
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link
                      to={path}
                      className="text-sm text-white/40 hover:text-primary-400 transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-white/[0.06]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FiTrendingUp className="w-3.5 h-3.5" />
            Popular Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <Link
                key={tag}
                to={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="
                  px-3 py-1 rounded-full text-xs
                  bg-white/5 hover:bg-primary-600/15
                  border border-white/[0.08] hover:border-primary-600/25
                  text-white/40 hover:text-white
                  transition-all duration-200
                "
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20 text-center sm:text-left">
            © {year} Xmaster. All rights reserved. All models are 18+ years of age.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/20">
            <Link to="/terms"   className="hover:text-white/50 transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/dmca"    className="hover:text-white/50 transition-colors">DMCA</Link>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-white/20 leading-relaxed text-center">
            This site contains sexually explicit material. All persons depicted herein were
            at least 18 years of age at the time of the photography/video. All models,
            actors, actresses and other persons appearing in any visual depiction of
            actual sexually explicit conduct appearing or otherwise contained in this
            website were over the age of eighteen (18) years at the time of the creation
            of such depictions. Records required pursuant to 18 U.S.C. 2257 are kept by
            the custodian of records.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;