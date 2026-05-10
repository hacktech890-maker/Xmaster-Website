// src/components/common/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';

const FOOTER_LINKS = {
  Browse: [
    { label: 'Home',   path: '/'       },
    { label: 'Free',   path: '/free'   },
    { label: 'Search', path: '/search' },
  ],
  Legal: [
    { label: 'Terms of Service', path: '/terms'      },
    { label: 'Privacy Policy',   path: '/privacy'    },
    { label: 'DMCA / Copyright', path: '/dmca'       },
    { label: 'Disclaimer',       path: '/disclaimer' },
    { label: '2257 Statement',   path: '/2257'       },
  ],
};

const ContactForm = () => {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async () => {
    if (!name.trim())                              { setErrMsg('Please enter your name.');              return; }
    if (!email.trim() || !isValidEmail(email))    { setErrMsg('Please enter a valid email address.'); return; }
    if (message.trim().length > 2000)             { setErrMsg('Message is too long (max 2000 characters).'); return; }
    setErrMsg('');
    setStatus('loading');
    try {
      await publicAPI.submitContact({
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        message: message.trim(),
      });
      setStatus('success');
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      setStatus('error');
      setErrMsg(err?.response?.data?.error || 'Failed to send message. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-center">
        <p className="text-sm font-semibold text-emerald-400 mb-1">Message sent!</p>
        <p className="text-xs text-white/40">We'll get back to you as soon as possible.</p>
        <button onClick={() => setStatus('idle')} className="mt-3 text-xs text-white/30 hover:text-white/60 transition-colors">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errMsg && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errMsg}
        </p>
      )}
      <input
        type="text" placeholder="Your name *" value={name}
        onChange={(e) => setName(e.target.value)} maxLength={80}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-primary-600/40 focus:bg-white/[0.06] transition-all duration-200"
      />
      <input
        type="email" placeholder="Your email *" value={email}
        onChange={(e) => setEmail(e.target.value)} maxLength={120}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-primary-600/40 focus:bg-white/[0.06] transition-all duration-200"
      />
      <textarea
        placeholder="Message (optional)" value={message}
        onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={2000}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-primary-600/40 focus:bg-white/[0.06] transition-all duration-200 resize-none"
      />
      <button
        onClick={handleSubmit} disabled={status === 'loading'}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 transition-colors duration-200"
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
};

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 bg-dark-500 border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary-600/40 to-transparent" />
      <div className="container-site py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600/10 border border-primary-600/20">
              <span className="text-primary-500 font-black text-sm">18+</span>
              <span className="text-xs text-white/40">Adults only</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-sm text-white/40 hover:text-primary-400 transition-colors duration-150">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
              Get in Touch
            </h3>
            <ContactForm />
            <p className="text-[11px] text-white/25 mt-3 leading-relaxed">
              For DMCA removal requests please use the{' '}
              <Link to="/dmca" className="text-primary-500/70 hover:text-primary-400 transition-colors">
                DMCA page
              </Link>.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20 text-center sm:text-left">
            © {year} Xmaster. All rights reserved. All models are 18+ years of age.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/20">
            <Link to="/terms"      className="hover:text-white/50 transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy"    className="hover:text-white/50 transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/dmca"       className="hover:text-white/50 transition-colors">DMCA</Link>
            <span>·</span>
            <Link to="/disclaimer" className="hover:text-white/50 transition-colors">Disclaimer</Link>
          </div>
        </div>

        {/* 2257 */}
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