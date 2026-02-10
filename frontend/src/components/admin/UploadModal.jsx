import React, { useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (category) formData.append('category', category);

      await onUpload(formData, (prog) => setProgress(prog));

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={!uploading ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-200 rounded-2xl w-full max-w-lg shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-100">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Video</h2>
          {!uploading && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg">
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-dark-100 rounded-xl p-6 text-center">
              {file ? (
                <div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-red-500 mt-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to select video</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, MKV, AVI, MOV (Max 10GB)</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                <span className="text-gray-900 dark:text-white font-medium">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-dark-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || !title.trim() || uploading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;