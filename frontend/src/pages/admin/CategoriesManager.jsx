// src/pages/admin/CategoriesManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiPlus, FiTrash2, FiEdit2, FiCheck,
  FiMove, FiTag, FiAlertCircle, FiStar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI, publicAPI } from '../../services/api';
import AdminLayout    from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [dragIndex,  setDragIndex]  = useState(null);
  const [processing, setProcessing] = useState(null);
  // Filter: 'all' | 'public' | 'premium'
  const [viewFilter, setViewFilter] = useState('all');

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL categories (including inactive) for admin view
      let res;
      if (adminAPI.getCategories) res = await adminAPI.getCategories({ all: 'true' });
      else                         res = await publicAPI.getCategories();
      const data = res?.data?.categories || res?.data || [];
      if (mountedRef.current) setCategories(Array.isArray(data) ? data : []);
    } catch {
      if (mountedRef.current) setError('Failed to load categories');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const res = await adminAPI.createCategory(formData);
      const cat = res?.data?.category || res?.data;
      if (cat) setCategories((p) => [...p, cat]);
      toast.success('Category created');
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const res = await adminAPI.updateCategory(id, formData);
      const updated = res?.data?.category || { ...formData, _id: id };
      setCategories((p) => p.map((c) => c._id === id ? { ...c, ...updated } : c));
      toast.success('Category updated');
      setEditingCat(null);
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Videos in it will become uncategorised.')) return;
    setProcessing(id);
    try {
      await adminAPI.deleteCategory(id);
      setCategories((p) => p.filter((c) => c._id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    } finally {
      if (mountedRef.current) setProcessing(null);
    }
  };

  const handleDragStart = (i) => setDragIndex(i);
  const handleDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const reordered = [...categories];
    const [moved]   = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setCategories(reordered);
    setDragIndex(i);
  };
  const handleDragEnd = async () => {
    setDragIndex(null);
    try { await adminAPI.reorderCategories(categories.map((c) => c._id)); }
    catch { toast.error('Failed to save order'); }
  };

  // Filtered view
  const visibleCategories = categories.filter((c) => {
    if (viewFilter === 'premium') return c.isPremium;
    if (viewFilter === 'public')  return !c.isPremium;
    return true;
  });

  const premiumCount = categories.filter((c) =>  c.isPremium).length;
  const publicCount  = categories.filter((c) => !c.isPremium).length;

  return (
    <AdminLayout
      title="Categories"
      actions={
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5">
          <FiPlus className="w-3.5 h-3.5" />New Category
        </button>
      }
    >
      <div className="max-w-2xl space-y-4">
        {showForm && (
          <CategoryForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            title="New Category"
          />
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <FiAlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button onClick={fetchCategories} className="ml-auto text-xs text-white/40 hover:text-white underline">Retry</button>
          </div>
        )}

        {/* Filter tabs */}
        {!loading && !error && (
          <div className="glass-panel rounded-xl p-1 flex gap-1">
            {[
              { id: 'all',     label: `All (${categories.length})` },
              { id: 'public',  label: `Public (${publicCount})` },
              { id: 'premium', label: `★ Premium (${premiumCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setViewFilter(f.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewFilter === f.id
                    ? f.id === 'premium'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-primary-600/20 text-primary-400 border border-primary-600/25'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="glass-panel rounded-2xl p-8 flex justify-center">
            <LoadingSpinner size="md" label="Loading categories..." />
          </div>
        )}

        {!loading && !error && (
          <div className="glass-panel rounded-2xl overflow-hidden">
            {visibleCategories.length === 0 ? (
              <div className="p-10 text-center">
                <FiTag className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/30 mb-1">
                  {viewFilter === 'premium' ? 'No premium categories yet' :
                   viewFilter === 'public'  ? 'No public categories yet' :
                   'No categories yet'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {/* Header row */}
                <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.02]">
                  <span className="w-5" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex-1">Category Name</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest w-20 text-center">Type</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest w-16 text-center">Videos</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest w-20 text-right">Actions</span>
                </div>

                {visibleCategories.map((cat, i) =>
                  editingCat?._id === cat._id ? (
                    <div key={cat._id} className="p-4">
                      <CategoryForm
                        initialData={cat}
                        onSave={(data) => handleUpdate(cat._id, data)}
                        onCancel={() => setEditingCat(null)}
                        title="Edit Category"
                      />
                    </div>
                  ) : (
                    <div
                      key={cat._id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors ${
                        dragIndex === i   ? 'opacity-50 bg-white/5' : ''
                      } ${processing === cat._id ? 'opacity-50' : ''}`}
                    >
                      <span className="w-5 cursor-grab text-white/20 hover:text-white/50 transition-colors">
                        <FiMove className="w-4 h-4" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/80">{cat.name}</p>
                          {cat.isPremium && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              <FiStar className="w-2.5 h-2.5 fill-amber-400" />PREMIUM
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 font-mono">/{cat.slug}</p>
                      </div>

                      {/* Type badge */}
                      <span className={`w-20 text-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        cat.isPremium
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {cat.isPremium ? '★ Premium' : 'Public'}
                      </span>

                      <span className="w-16 text-center text-xs font-semibold text-white/40">
                        {cat.videoCount || 0}
                      </span>

                      <div className="flex items-center gap-1.5 w-20 justify-end">
                        <button
                          onClick={() => setEditingCat(cat)}
                          className="p-1.5 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          disabled={processing === cat._id}
                          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// ============================================================
// CATEGORY FORM — extended with isPremium toggle
// ============================================================
const CategoryForm = ({ initialData, onSave, onCancel, title }) => {
  const [name,      setName]      = useState(initialData?.name      || '');
  const [slug,      setSlug]      = useState(initialData?.slug      || '');
  const [isPremium, setIsPremium] = useState(initialData?.isPremium || false);
  const [saving,    setSaving]    = useState(false);

  const handleNameChange = (v) => {
    setName(v);
    if (!initialData) {
      setSlug(v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name:      name.trim(),
        slug:      slug.trim() || undefined,
        isPremium,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-xl p-4 space-y-4 border border-primary-600/20 animate-fade-in-down"
    >
      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{title}</p>

      {/* Premium / Public toggle */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/40">Category Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPremium(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              !isPremium
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.04] text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            Public
          </button>
          <button
            type="button"
            onClick={() => setIsPremium(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isPremium
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-white/[0.04] text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
            }`}
          >
            <FiStar className="w-3 h-3" />
            Premium
          </button>
        </div>
        {isPremium && (
          <p className="text-[10px] text-amber-400/70">
            Videos in this category will appear only in the Premium section.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/40">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Category name"
            required
            autoFocus
            className="input-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/40">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated"
            className="input-base font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 disabled:opacity-40 ${
            isPremium
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
              : 'btn-primary'
          }`}
        >
          {saving
            ? <><span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />Saving...</>
            : <><FiCheck className="w-3.5 h-3.5" />Save {isPremium ? 'Premium ' : ''}Category</>
          }
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-xs px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CategoriesManager;