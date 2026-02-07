import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI, publicAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">{categories.length} categories</p>
        <button onClick={handleCreate} className="btn-primary">
          <FiPlus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-dark-200 rounded-xl p-12 text-center border border-dark-100">
          <FiGrid className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 mb-4">No categories yet</p>
          <button onClick={handleCreate} className="btn-primary">
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
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

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
};

// Category Modal
const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '📁',
    color: category?.color || '#ef4444',
    isActive: category?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);

  const icons = ['📁', '🎬', '🎮', '🎵', '📚', '💪', '🍳', '✈️', '🔧', '💰', '🎭', '⚽', '🎨', '💻', '📱', '🌍'];
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
          {/* Name */}
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

          {/* Description */}
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

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    formData.icon === icon
                      ? 'bg-primary-500 ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-200'
                      : 'bg-dark-100 hover:bg-dark-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-200'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Active */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
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