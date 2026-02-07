import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye, FiEyeOff, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatViews } from '../../utils/helpers';

const AdsManager = () => {
  const [ads, setAds] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adsRes, placementsRes] = await Promise.all([
        adminAPI.getAllAds(),
        adminAPI.getAdPlacements(),
      ]);
      
      if (adsRes.data.success) setAds(adsRes.data.ads);
      if (placementsRes.data.success) setPlacements(placementsRes.data.placements);
    } catch (error) {
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAd(null);
    setShowModal(true);
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setShowModal(true);
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.name}"?`)) return;

    try {
      await adminAPI.deleteAd(ad._id);
      setAds(ads.filter(a => a._id !== ad._id));
      toast.success('Ad deleted');
    } catch (error) {
      toast.error('Failed to delete ad');
    }
  };

  const handleToggle = async (ad) => {
    try {
      const response = await adminAPI.toggleAd(ad._id);
      if (response.data.success) {
        setAds(ads.map(a => 
          a._id === ad._id ? { ...a, enabled: response.data.enabled } : a
        ));
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle ad');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingAd) {
        const response = await adminAPI.updateAd(editingAd._id, data);
        if (response.data.success) {
          setAds(ads.map(a => 
            a._id === editingAd._id ? response.data.ad : a
          ));
          toast.success('Ad updated');
        }
      } else {
        const response = await adminAPI.createAd(data);
        if (response.data.success) {
          setAds([...ads, response.data.ad]);
          toast.success('Ad created');
        }
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save ad');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Ads Manager">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  // Group ads by placement
  const adsByPlacement = placements.reduce((acc, p) => {
    acc[p.id] = {
      ...p,
      ads: ads.filter(a => a.placement === p.id),
    };
    return acc;
  }, {});

  return (
    <AdminLayout title="Ads Manager">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <p className="text-gray-400 text-sm">Total Ads</p>
          <p className="text-2xl font-bold text-white mt-1">{ads.length}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <p className="text-gray-400 text-sm">Active Ads</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {ads.filter(a => a.enabled).length}
          </p>
        </div>
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <p className="text-gray-400 text-sm">Total Impressions</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">
            {formatViews(ads.reduce((sum, a) => sum + (a.impressions || 0), 0))}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Manage ad placements across your site</p>
        <button onClick={handleCreate} className="btn-primary">
          <FiPlus className="w-5 h-5" />
          Add Ad
        </button>
      </div>

      {/* Placements */}
      <div className="space-y-6">
        {Object.values(adsByPlacement).map((placement) => (
          <div key={placement.id} className="bg-dark-200 rounded-xl border border-dark-100">
            <div className="p-4 border-b border-dark-100 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{placement.name}</h3>
                <p className="text-gray-500 text-sm">Size: {placement.size}</p>
              </div>
              <span className="text-gray-400 text-sm">
                {placement.ads.length} ad{placement.ads.length !== 1 ? 's' : ''}
              </span>
            </div>

            {placement.ads.length > 0 ? (
              <div className="divide-y divide-dark-100">
                {placement.ads.map((ad) => (
                  <div key={ad._id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        ad.enabled ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        <FiDollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{ad.name}</p>
                        <p className="text-gray-500 text-sm">
                          {formatViews(ad.impressions || 0)} impressions • {formatViews(ad.clicks || 0)} clicks
                          {ad.impressions > 0 && (
                            <span className="text-primary-500 ml-2">
                              ({((ad.clicks / ad.impressions) * 100).toFixed(2)}% CTR)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`badge ${ad.device === 'all' ? 'badge-success' : 'badge-warning'}`}>
                        {ad.device}
                      </span>
                      <button
                        onClick={() => handleToggle(ad)}
                        className={`p-2 rounded-lg transition-colors ${
                          ad.enabled
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                        }`}
                      >
                        {ad.enabled ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-2 hover:bg-dark-100 rounded-lg text-gray-400 hover:text-white"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No ads in this placement</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <AdModal
          ad={editingAd}
          placements={placements}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
};

// Ad Modal
const AdModal = ({ ad, placements, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: ad?.name || '',
    placement: ad?.placement || 'home_top',
    type: ad?.type || 'script',
    code: ad?.code || '',
    device: ad?.device || 'all',
    enabled: ad?.enabled !== false,
    priority: ad?.priority || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <h3 className="text-lg font-semibold text-white">
            {ad ? 'Edit Ad' : 'Create Ad'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Homepage Banner Ad"
              required
            />
          </div>

          {/* Placement & Device */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Placement *</label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="input-field"
              >
                {placements.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Device</label>
              <select
                value={formData.device}
                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                className="input-field"
              >
                <option value="all">All Devices</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
            >
              <option value="script">Script (JavaScript)</option>
              <option value="html">HTML</option>
              <option value="banner">Banner Image</option>
            </select>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Code *</label>
            <textarea
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input-field font-mono text-sm resize-none"
              rows={8}
              placeholder="Paste your ad code here..."
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              Paste the complete ad code from your ad network (Google Ads, etc.)
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              className="input-field w-32"
              min="0"
              max="100"
            />
            <p className="text-gray-500 text-xs mt-1">
              Higher priority ads show first (0-100)
            </p>
          </div>

          {/* Enabled */}
          <div>
            <label className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-300">Enabled (show to users)</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : 'Save Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdsManager;