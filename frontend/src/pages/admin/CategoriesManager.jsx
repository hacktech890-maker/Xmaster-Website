import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI, publicAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? Videos will be uncategorized.`)) return;

    try {
      await adminAPI.deleteCategory(category._id);
      setCategories(categories.filter(c => c._id !== category._id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingCategory) {
        const response = await adminAPI.updateCategory(editingCategory._id, data);
        if (response.data.success) {
          setCategories(categories.map(c =>
            c._id === editingCategory._id ? response.data.category : c
          ));
          toast.success('Category updated');
        }
      } else {
        const response = await adminAPI.createCategory(data);
        if (response.data.success) {
          setCategories([...categories, response.data.category]);
          toast.success('Category created');
        }
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Categories">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Categories">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <p className="text-gray-400">{categories.length} categories</p>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FiList className="w-4 h-4" />
            Bulk Add
          </button>
          <button onClick={handleCreate} className="btn-primary">
            <FiPlus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-dark-200 rounded-xl p-12 text-center border border-dark-100">
          <FiGrid className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 mb-4">
            {searchTerm ? 'No categories match your search' : 'No categories yet'}
          </p>
          {!searchTerm && (
            <button onClick={handleCreate} className="btn-primary">
              Create First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden"
              style={{ borderTop: `4px solid ${category.color || '#ef4444'}` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon || '📁'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      <p className="text-gray-500 text-sm">/{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-dark-100 rounded-lg text-gray-400 hover:text-white"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-100">
                  <span className="text-gray-500 text-sm">
                    {category.videoCount || 0} videos
                  </span>
                  <span className={`badge ${category.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <BulkCreateModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            fetchCategories();
          }}
        />
      )}
    </AdminLayout>
  );
};

// ==========================================
// BULK CREATE MODAL
// ==========================================
const BulkCreateModal = ({ onClose, onSuccess }) => {
  const [input, setInput] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#ef4444');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const preview = input.split(',').map(n => n.trim()).filter(Boolean);

  const handleSubmit = async () => {
    if (preview.length === 0) {
      toast.error('Enter at least one category name');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.bulkCreateCategories({ names: input, icon, color });
      if (res.data.success) {
        setResults(res.data.results);
        if (res.data.results.created.length > 0) {
          toast.success(`${res.data.results.created.length} categories created!`);
        }
        if (res.data.results.skipped.length > 0) {
          toast(`${res.data.results.skipped.length} already existed`, { icon: '⚠️' });
        }
      }
    } catch (error) {
      toast.error('Failed to create categories');
    } finally {
      setLoading(false);
    }
  };

  const icons = ['📁', '🎬', '🎮', '🎵', '💪', '🍳', '✈️', '🔧', '💰', '🎭', '⚽', '🎨', '💻', '🔥', '❤️', '⭐'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-dark-100">
        <div className="flex items-center justify-between p-5 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <FiList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Add Categories</h3>
              <p className="text-sm text-gray-400">Enter comma-separated category names</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!results ? (
            <>
              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Names (comma separated)
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-100 border border-dark-100 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="MILF, Teen, Anal, Amateur, Asian, Blonde, Brunette, BBW, Big Ass, Big Tits"
                />
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">{preview.length} categories to create:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.map((name, i) => (
                      <span key={i} className="px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-full border border-green-500/20">
                        {icon} {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Icon</label>
                  <div className="flex flex-wrap gap-1.5">
                    {icons.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                          icon === ic ? 'bg-primary-500 ring-2 ring-primary-400' : 'bg-dark-100 hover:bg-dark-300'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-9 h-9 rounded-lg transition-all ${
                          color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-200' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || preview.length === 0}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="w-5 h-5" />
                    Create {preview.length} Categories
                  </>
                )}
              </button>
            </>
          ) : (
            // Results
            <div className="space-y-4">
              {results.created.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-green-400 font-medium mb-2">✅ Created ({results.created.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.created.map((c, i) => (
                      <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {results.skipped.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <h4 className="text-yellow-400 font-medium mb-2">⚠️ Already Existed ({results.skipped.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.skipped.map((c, i) => (
                      <span key={i} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {results.failed.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h4 className="text-red-400 font-medium mb-2">❌ Failed ({results.failed.length})</h4>
                  <div className="space-y-1">
                    {results.failed.map((c, i) => (
                      <p key={i} className="text-red-400 text-sm">{c.name}: {c.error}</p>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={onSuccess}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CATEGORY MODAL (Create/Edit Single)
// ==========================================
const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '📁',
    color: category?.color || '#ef4444',
    isActive: category?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);

  const icons = ['📁', '🎬', '🎮', '🎵', '📚', '💪', '🍳', '✈️', '🔧', '💰', '🎭', '⚽', '🎨', '💻', '📱', '🌍', '🔥', '❤️', '⭐', '💎'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <h3 className="text-lg font-semibold text-white">
            {category ? 'Edit Category' : 'Create Category'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Category name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: ic })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    formData.icon === ic
                      ? 'bg-primary-500 ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-200'
                      : 'bg-dark-100 hover:bg-dark-300'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-200'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-300">Active (visible to users)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriesManager;