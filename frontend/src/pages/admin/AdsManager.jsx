// src/pages/admin/AdsManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiPlus, FiTrash2, FiEdit2, FiToggleLeft,
  FiToggleRight, FiDollarSign,
  FiMonitor, FiSmartphone, FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI }   from '../../services/api';
import AdminLayout    from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdsManager = () => {
  const [ads,        setAds]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingAd,  setEditingAd]  = useState(null);
  const [processing, setProcessing] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res  = await adminAPI.getAllAds();
      const data = res?.data?.ads || res?.data || [];
      if (mountedRef.current) setAds(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load ads'); }
    finally  { if (mountedRef.current) setLoading(false); }
  };

  const handleCreate = async (formData) => {
    try {
      const res = await adminAPI.createAd(formData);
      const ad  = res?.data?.ad || res?.data;
      if (ad) setAds((p) => [...p, ad]);
      toast.success('Ad created');
      setShowForm(false);
    } catch { toast.error('Failed to create ad'); }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await adminAPI.updateAd(id, formData);
      setAds((p) => p.map((a) => a._id === id ? { ...a, ...formData } : a));
      toast.success('Ad updated');
      setEditingAd(null);
    } catch { toast.error('Failed to update ad'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    setProcessing(id);
    try {
      await adminAPI.deleteAd(id);
      setAds((p) => p.filter((a) => a._id !== id));
      toast.success('Ad deleted');
    } catch { toast.error('Failed to delete ad'); }
    finally  { if (mountedRef.current) setProcessing(null); }
  };

  const handleToggle = async (ad) => {
    setProcessing(ad._id);
    try {
      await adminAPI.toggleAd(ad._id);
      setAds((p) => p.map((a) => a._id === ad._id ? { ...a, active: !a.active } : a));
      toast.success(ad.active ? 'Ad paused' : 'Ad activated');
    } catch { toast.error('Failed to toggle ad'); }
    finally  { if (mountedRef.current) setProcessing(null); }
  };

  return (
    <AdminLayout
      title="Ad Management"
      actions={
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5">
          <FiPlus className="w-3.5 h-3.5" />New Ad
        </button>
      }
    >
      <div className="max-w-3xl space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/15">
          <FiDollarSign className="w-4 h-4 text-amber-400 flex-shrink-0 mt-px" />
          <p className="text-xs text-white/50 leading-relaxed">
            Note: Live ad codes are currently hardcoded in WatchPage and HomePage.
            This manager controls additional API-based ad placements.
            Edit <code className="text-amber-400">src/config/ads.js</code> to update live ad codes.
          </p>
        </div>

        {showForm && <AdForm onSave={handleCreate} onCancel={() => setShowForm(false)} title="New Ad Placement" />}

        {loading ? (
          <div className="glass-panel rounded-2xl p-8 flex justify-center"><LoadingSpinner size="md" /></div>
        ) : ads.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <FiDollarSign className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No ad placements configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              editingAd?._id === ad._id ? (
                <AdForm key={ad._id} initialData={ad} onSave={(data) => handleUpdate(ad._id, data)} onCancel={() => setEditingAd(null)} title="Edit Ad" />
              ) : (
                <div key={ad._id} className={`glass-panel rounded-xl p-4 transition-all duration-200 ${processing === ad._id ? 'opacity-60' : ''} ${!ad.active ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${ad.active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-white/80">{ad.placement || 'Unknown Placement'}</span>
                        <span className={`px-2 py-px rounded-full text-[9px] font-bold border ${ad.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-gray-500/15 text-gray-400 border-gray-500/25'}`}>
                          {ad.active ? 'Active' : 'Paused'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/30">
                          {ad.device === 'mobile' ? <><FiSmartphone className="w-3 h-3" />Mobile</> : ad.device === 'desktop' ? <><FiMonitor className="w-3 h-3" />Desktop</> : 'All devices'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/30 mb-2">
                        <span>{(ad.impressions || 0).toLocaleString()} impressions</span>
                        <span>{(ad.clicks || 0).toLocaleString()} clicks</span>
                        {ad.impressions > 0 && <span>CTR: {((ad.clicks / ad.impressions) * 100).toFixed(2)}%</span>}
                      </div>
                      <div className="mt-2 p-2 rounded-lg bg-black/30 border border-white/5 font-mono text-[10px] text-white/30 line-clamp-2 overflow-hidden">
                        {ad.code?.substring(0, 120)}...
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => handleToggle(ad)} disabled={processing === ad._id} title={ad.active ? 'Pause' : 'Activate'} className={`p-2 rounded-lg transition-all duration-150 ${ad.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-white/10'} disabled:opacity-50`}>
                        {ad.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingAd(ad)} className="p-2 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ad._id)} disabled={processing === ad._id} className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all duration-150">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const AdForm = ({ initialData, onSave, onCancel, title }) => {
  const [placement, setPlacement] = useState(initialData?.placement || '');
  const [code,      setCode]      = useState(initialData?.code      || '');
  const [device,    setDevice]    = useState(initialData?.device    || 'all');
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placement.trim() || !code.trim()) return;
    setSaving(true);
    try { await onSave({ placement: placement.trim(), code: code.trim(), device }); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-5 space-y-4 border border-primary-600/20 animate-fade-in-down">
      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/40">Placement *</label>
          <input type="text" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="e.g. watch_sidebar" required className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/40">Device</label>
          <select value={device} onChange={(e) => setDevice(e.target.value)} className="input-base appearance-none">
            <option value="all"     className="bg-dark-300">All Devices</option>
            <option value="desktop" className="bg-dark-300">Desktop Only</option>
            <option value="mobile"  className="bg-dark-300">Mobile Only</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/40">Ad Code *</label>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste ad script/HTML here..." rows={6} required className="input-base font-mono text-xs resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">
          {saving ? 'Saving...' : <><FiCheck className="w-3.5 h-3.5" />Save Ad</>}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-xs px-4 py-2">Cancel</button>
      </div>
    </form>
  );
};

export default AdsManager;