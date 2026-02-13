import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiUploadCloud, FiFile, FiX, FiCheck, FiAlertCircle, 
  FiRefreshCw, FiPlay, FiPause, FiPlus, FiLink 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI, publicAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UploadPage = () => {
  const [activeTab, setActiveTab] = useState('upload'); // upload, file-code, abyss-files
  const [categories, setCategories] = useState([]);
  
  // Fetch categories
  useEffect(() => {
    publicAPI.getCategories()
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      })
      .catch(console.error);
  }, []);

  const tabs = [
    { id: 'upload', label: 'Upload Videos', icon: FiUploadCloud },
    { id: 'file-code', label: 'Add by File Code', icon: FiLink },
    { id: 'abyss-files', label: 'Import from Abyss', icon: FiFile },
  ];

  return (
    <AdminLayout title="Upload Videos">
      {/* Tabs */}
      <div className="bg-dark-200 rounded-xl border border-dark-100 mb-6">
        <div className="flex border-b border-dark-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'upload' && <BulkUploadSection categories={categories} />}
          {activeTab === 'file-code' && <FileCodeSection categories={categories} />}
          {activeTab === 'abyss-files' && <AbyssFilesSection categories={categories} />}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==================== BULK UPLOAD SECTION ====================
const BulkUploadSection = ({ categories }) => {
  const [queue, setQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('public');

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      size: file.size,
      status: 'pending', // pending, uploading, success, failed
      progress: 0,
      error: null,
      category: defaultCategory,
      videoStatus: defaultStatus,
    }));
    setQueue(prev => [...prev, ...newFiles]);
  }, [defaultCategory, defaultStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv']
    },
    multiple: true,
  });

  const updateQueueItem = (id, updates) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeFromQueue = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const startUpload = async () => {
    if (queue.length === 0) return;
    
    setIsUploading(true);
    setIsPaused(false);

    for (let i = currentIndex; i < queue.length; i++) {
      if (isPaused) {
        setCurrentIndex(i);
        return;
      }

      const item = queue[i];
      if (item.status === 'success') continue;

      updateQueueItem(item.id, { status: 'uploading', progress: 0 });

      try {
        const formData = new FormData();
        formData.append('video', item.file);
        formData.append('title', item.title);
        formData.append('status', item.videoStatus);
        if (item.category) formData.append('category', item.category);

        await adminAPI.uploadVideo(formData, (progress, loaded, total) => {
          updateQueueItem(item.id, { progress, uploadedBytes: loaded, totalBytes: total });
        });

        updateQueueItem(item.id, { status: 'success', progress: 100 });
        toast.success(`Uploaded: ${item.title}`);
      } catch (error) {
        console.error('Upload failed:', error);
        updateQueueItem(item.id, { 
          status: 'failed', 
          error: error.response?.data?.error || 'Upload failed' 
        });
      }
    }

    setIsUploading(false);
    setCurrentIndex(0);
  };

  const pauseUpload = () => {
    setIsPaused(true);
  };

  const resumeUpload = () => {
    setIsPaused(false);
    startUpload();
  };

  const retryFailed = () => {
    setQueue(prev => prev.map(item => 
      item.status === 'failed' ? { ...item, status: 'pending', error: null } : item
    ));
  };

  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status !== 'success'));
  };

  const clearAll = () => {
    if (!isUploading) {
      setQueue([]);
    }
  };

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const successCount = queue.filter(q => q.status === 'success').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Default Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Default Category</label>
          <select
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            className="input-field"
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Default Status</label>
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
            className="input-field"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-dark-100 hover:border-gray-600'
        }`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-lg text-white mb-2">
          {isDragActive ? 'Drop videos here...' : 'Drag & drop videos here'}
        </p>
        <p className="text-gray-500">or click to browse files</p>
        <p className="text-gray-600 text-sm mt-4">
          Supports: MP4, MKV, AVI, MOV, WebM, FLV (Max 10GB each)
        </p>
      </div>

      {/* Queue Stats */}
      {queue.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-dark-100 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span className="text-gray-400">Pending: {pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-400">Completed: {successCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-400">Failed: {failedCount}</span>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex gap-2">
            {failedCount > 0 && (
              <button onClick={retryFailed} className="btn-secondary text-sm">
                <FiRefreshCw className="w-4 h-4" />
                Retry Failed
              </button>
            )}
            {successCount > 0 && (
              <button onClick={clearCompleted} className="btn-secondary text-sm">
                Clear Completed
              </button>
            )}
            {!isUploading && (
              <button onClick={clearAll} className="btn-secondary text-sm">
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          {queue.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              categories={categories}
              onUpdate={(updates) => updateQueueItem(item.id, updates)}
              onRemove={() => removeFromQueue(item.id)}
              isUploading={isUploading}
            />
          ))}
        </div>
      )}

      {/* Start/Pause Button */}
      {queue.length > 0 && pendingCount > 0 && (
        <div className="flex justify-center gap-4">
          {!isUploading ? (
            <button onClick={startUpload} className="btn-primary px-8 py-3 text-lg">
              <FiPlay className="w-5 h-5" />
              Start Upload ({pendingCount} videos)
            </button>
          ) : isPaused ? (
            <button onClick={resumeUpload} className="btn-primary px-8 py-3 text-lg">
              <FiPlay className="w-5 h-5" />
              Resume Upload
            </button>
          ) : (
            <button onClick={pauseUpload} className="btn-secondary px-8 py-3 text-lg">
              <FiPause className="w-5 h-5" />
              Pause Upload
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Queue Item Component
const QueueItem = ({ item, categories, onUpdate, onRemove, isUploading }) => {
  const statusColors = {
    pending: 'bg-gray-500',
    uploading: 'bg-blue-500',
    success: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const statusIcons = {
    pending: null,
    uploading: <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />,
    success: <FiCheck className="w-4 h-4" />,
    failed: <FiAlertCircle className="w-4 h-4" />,
  };

  return (
    <div className={`bg-dark-100 rounded-lg p-4 ${item.status === 'failed' ? 'border border-red-500/50' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`w-10 h-10 rounded-lg ${statusColors[item.status]} flex items-center justify-center text-white flex-shrink-0`}>
          {statusIcons[item.status] || <FiFile className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {item.status === 'pending' ? (
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="w-full bg-transparent text-white font-medium focus:outline-none focus:bg-dark-200 px-2 py-1 rounded -ml-2"
                  placeholder="Video title"
                />
              ) : (
                <p className="text-white font-medium truncate">{item.title}</p>
              )}
              <p className="text-gray-500 text-sm">
                {(item.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {item.status === 'pending' && (
              <select
                value={item.category}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="px-3 py-1.5 bg-dark-200 border border-dark-100 rounded text-sm text-white"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            )}

            {item.status !== 'uploading' && (
              <button
                onClick={onRemove}
                className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-red-500"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

                    {/* Progress Bar with MB */}
          {item.status === 'uploading' && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">
                  Uploading... {item.uploadedBytes ? (item.uploadedBytes / (1024 * 1024)).toFixed(1) : ((item.size * item.progress) / (100 * 1024 * 1024)).toFixed(1)}MB / {item.totalBytes ? (item.totalBytes / (1024 * 1024)).toFixed(1) : (item.size / (1024 * 1024)).toFixed(1)}MB
                </span>
                <span className="text-white font-medium">{item.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-dark-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {item.status === 'failed' && item.error && (
            <p className="text-red-500 text-sm mt-2">{item.error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== FILE CODE SECTION ====================
const FileCodeSection = ({ categories }) => {
  const [fileCodes, setFileCodes] = useState([{ file_code: '', title: '' }]);
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('public');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const addRow = () => {
    setFileCodes([...fileCodes, { file_code: '', title: '' }]);
  };

  const removeRow = (index) => {
    setFileCodes(fileCodes.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setFileCodes(fileCodes.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async () => {
    const validCodes = fileCodes.filter(fc => fc.file_code.trim());
    if (validCodes.length === 0) {
      toast.error('Please enter at least one file code');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const videos = validCodes.map(fc => ({
        file_code: fc.file_code.trim(),
        title: fc.title.trim() || fc.file_code.trim(),
        category: defaultCategory || null,
        status: defaultStatus,
      }));

      const response = await adminAPI.bulkAddFileCodes(videos);
      setResults(response.data.results);
      
      // Clear successful entries
      const successCodes = response.data.results.success.map(s => s.file_code);
      setFileCodes(fileCodes.filter(fc => !successCodes.includes(fc.file_code.trim())));
      
      if (response.data.results.success.length > 0) {
        toast.success(`Added ${response.data.results.success.length} videos`);
      }
      if (response.data.results.failed.length > 0) {
        toast.error(`${response.data.results.failed.length} failed`);
      }
    } catch (error) {
      toast.error('Failed to add videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length > 1) {
      e.preventDefault();
      const newCodes = lines.map(line => {
        const parts = line.split(/[\t,]/);
        return {
          file_code: parts[0]?.trim() || '',
          title: parts[1]?.trim() || '',
        };
      });
      setFileCodes([...fileCodes.filter(fc => fc.file_code), ...newCodes]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-dark-100 rounded-lg p-4">
        <p className="text-gray-300 text-sm">
          Enter Abyss.to file codes to add videos to your platform. You can paste multiple codes (one per line) or with titles (code, title format).
        </p>
      </div>

      {/* Default Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            className="input-field"
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
            className="input-field"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>
      </div>

      {/* File Code Inputs */}
      <div className="space-y-3">
        {fileCodes.map((row, index) => (
          <div key={index} className="flex gap-3">
            <input
              type="text"
              value={row.file_code}
              onChange={(e) => updateRow(index, 'file_code', e.target.value)}
              onPaste={index === 0 ? handlePaste : undefined}
              placeholder="File code (e.g., abc123xyz)"
              className="input-field flex-1"
            />
            <input
              type="text"
              value={row.title}
              onChange={(e) => updateRow(index, 'title', e.target.value)}
              placeholder="Title (optional)"
              className="input-field flex-1"
            />
            <button
              onClick={() => removeRow(index)}
              className="p-3 hover:bg-dark-100 rounded-lg text-gray-400 hover:text-red-500"
              disabled={fileCodes.length === 1}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      <button onClick={addRow} className="btn-secondary w-full">
        <FiPlus className="w-5 h-5" />
        Add Another
      </button>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? 'Adding Videos...' : `Add ${fileCodes.filter(fc => fc.file_code.trim()).length} Videos`}
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.success.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-green-500 font-medium mb-2">
                Successfully Added ({results.success.length})
              </h4>
              <div className="space-y-1 text-sm text-green-400">
                {results.success.map((s, i) => (
                  <p key={i}>{s.file_code}</p>
                ))}
              </div>
            </div>
          )}
          {results.failed.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-500 font-medium mb-2">
                Failed ({results.failed.length})
              </h4>
              <div className="space-y-1 text-sm">
                {results.failed.map((f, i) => (
                  <p key={i} className="text-red-400">
                    {f.file_code}: {f.error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== ABYSS FILES SECTION ====================
const AbyssFilesSection = ({ categories }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0 });
  const [defaultCategory, setDefaultCategory] = useState('');

  useEffect(() => {
    fetchAbyssFiles();
  }, [page]);

  const fetchAbyssFiles = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAbyssFiles(page, 50);
      if (response.data.success) {
        setFiles(response.data.files);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch files from Abyss');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (fileCode) => {
    setSelectedFiles(prev =>
      prev.includes(fileCode)
        ? prev.filter(fc => fc !== fileCode)
        : [...prev, fileCode]
    );
  };

  const handleSelectAll = () => {
    const notAdded = files.filter(f => !f.alreadyAdded).map(f => f.file_code);
    if (selectedFiles.length === notAdded.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(notAdded);
    }
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    setImporting(true);
    try {
      const videos = selectedFiles.map(file_code => {
        const file = files.find(f => f.file_code === file_code);
        return {
          file_code,
          title: file?.title || file_code,
          category: defaultCategory || null,
        };
      });

      const response = await adminAPI.bulkAddFileCodes(videos);
      
      // Update files list
      const successCodes = response.data.results.success.map(s => s.file_code);
      setFiles(files.map(f => 
        successCodes.includes(f.file_code) ? { ...f, alreadyAdded: true } : f
      ));
      setSelectedFiles([]);
      
      toast.success(`Imported ${response.data.results.success.length} videos`);
    } catch (error) {
      toast.error('Failed to import videos');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <select
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            className="input-field w-48"
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          
          <button onClick={handleSelectAll} className="btn-secondary">
            Select All Available
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="btn-primary"
          >
            {importing ? 'Importing...' : `Import ${selectedFiles.length} Videos`}
          </button>
        )}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map((file) => (
          <div
            key={file.file_code}
            onClick={() => !file.alreadyAdded && handleSelectFile(file.file_code)}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
              file.alreadyAdded 
                ? 'opacity-50 cursor-not-allowed' 
                : selectedFiles.includes(file.file_code)
                  ? 'ring-2 ring-primary-500'
                  : 'hover:ring-2 hover:ring-gray-500'
            }`}
          >
            <div className="aspect-video bg-dark-100">
              <img
                src={`https://abyss.to/thumb/${file.file_code}.jpg`}
                alt={file.title}
                className="w-full h-full object-cover"
                onError={(e) => {
  e.target.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=";
}}

              />
            </div>
            
            {/* Selection Overlay */}
            {selectedFiles.includes(file.file_code) && (
              <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Already Added Badge */}
            {file.alreadyAdded && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                Added
              </div>
            )}

            <div className="p-2">
              <p className="text-white text-sm truncate">{file.title || file.file_code}</p>
              <p className="text-gray-500 text-xs">{file.file_code}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-gray-400">
          Page {page}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={files.length < 50}
          className="btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UploadPage;