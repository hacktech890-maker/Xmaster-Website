// src/components/admin/UploadModal.jsx
// Quick upload modal for admin — used from dashboard / videos page
// Lightweight version of UploadPage

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiCheck, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI } from '../../services/api';
import Modal        from '../common/Modal';

// ============================================================
// UPLOAD MODAL
// ============================================================

const UploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file,      setFile]      = useState(null);
  const [title,     setTitle]     = useState('');
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setError('');
    if (!title) {
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name);
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.webm'] },
    maxFiles: 1,
  });

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setTitle('');
    setProgress(0);
    setError('');
    onClose();
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('File and title are required');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('status', 'private');

    setUploading(true);
    setError('');

    try {
      await adminAPI.uploadVideo(formData, (pct) => setProgress(pct));
      toast.success('Video uploaded!');
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Quick Upload"
      size="md"
      showClose={!uploading}
    >
      <div className="space-y-4">

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`
            rounded-xl p-6 border-2 border-dashed cursor-pointer
            text-center transition-all duration-250
            ${isDragActive
              ? 'border-primary-600/60 bg-primary-600/8'
              : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/12 hover:border-white/25 hover:bg-white/3'
            }
          `}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FiFile className="w-8 h-8 text-emerald-400" />
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-white/40">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FiUpload className={`w-8 h-8 ${isDragActive ? 'text-primary-400' : 'text-white/25'}`} />
              <p className="text-sm text-white/60">
                {isDragActive ? 'Drop here' : 'Drag video or click to browse'}
              </p>
            </div>
          )}
        </div>

        {/* Title input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            className="input-base"
          />
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Uploading...</span>
              <span className="text-primary-400 font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-700 to-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
            className="
              flex-1 py-2.5 rounded-xl font-bold text-sm text-white
              bg-gradient-to-r from-primary-600 to-primary-700
              hover:from-primary-500 hover:to-primary-600
              disabled:opacity-40 disabled:pointer-events-none
              flex items-center justify-center gap-2
              transition-all duration-200
            "
          >
            {uploading ? (
              <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading {progress}%</>
            ) : (
              <><FiUpload className="w-4 h-4" />Upload</>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl text-sm btn-ghost border border-white/8"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;