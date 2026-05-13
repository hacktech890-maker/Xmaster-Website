// src/pages/admin/UploadPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FiUpload, FiDownload, FiCheck,
  FiX, FiAlertCircle, FiPlus,
  FiTrash2, FiRefreshCw, FiInfo, FiCode,
  FiVideo, FiTag, FiFolder, FiStar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI }  from '../../services/api';
import AdminLayout   from '../../components/admin/AdminLayout';

const TABS = [
  { id: 'file',  label: 'File Upload',  icon: <FiUpload   className="w-4 h-4" /> },
  { id: 'code',  label: 'File Code',    icon: <FiCode     className="w-4 h-4" /> },
  { id: 'abyss', label: 'Abyss Import', icon: <FiDownload className="w-4 h-4" /> },
];

const DEFAULT_STATUS = 'private';

// ============================================================
// PREMIUM TOGGLE — reused across all tabs
// ============================================================
const PremiumToggle = ({ value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
      Content Type
    </label>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
          !value
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-white/[0.04] text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-current" />
        Public / Free
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
          value
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-white/[0.04] text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
        }`}
      >
        <FiStar className="w-3 h-3" />
        Premium
      </button>
    </div>
    {value && (
      <p className="text-[10px] text-amber-400/70 mt-1">
        This video will appear only in the Premium section.
      </p>
    )}
  </div>
);

// ============================================================
// CATEGORY SELECT — filters list based on isPremium selection
// ============================================================
const CategorySelect = ({ value, onChange, categories, isPremium }) => {
  // Show only categories matching the current isPremium flag
  const filtered = categories.filter(
    (c) => Boolean(c.isPremium) === Boolean(isPremium)
  );
  // Also show "all" fallback if filtered is empty
  const shown = filtered.length > 0 ? filtered : categories;

  return (
    <div className="relative">
      <FiFolder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none input-base pl-9 pr-8 cursor-pointer"
      >
        <option value="" className="bg-dark-300">No Category</option>
        {shown.length > 0 && (
          <>
            <optgroup
              label={isPremium ? '── Premium Categories ──' : '── Public Categories ──'}
              className="bg-dark-300 text-white/40"
            />
            {shown.map((cat) => (
              <option key={cat._id} value={cat._id} className="bg-dark-300">
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                {cat.isPremium ? ' ★' : ''}
              </option>
            ))}
          </>
        )}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
    </div>
  );
};

// ============================================================
// HOOK — load all categories once
// ============================================================
const useCategories = () => {
  const [categories,   setCategories]   = useState([]);
  const [loadingCats,  setLoadingCats]  = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingCats(true);
      try {
        // Fetch all categories (including premium ones) for admin
        const res  = await adminAPI.getCategories({ all: 'true' });
        const data = res?.data?.categories || res?.data || [];
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        // non-critical
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  return { categories, loadingCats };
};

// ============================================================
// UPLOAD PAGE
// ============================================================
const UploadPage = () => {
  const [activeTab, setActiveTab] = useState('file');
  const { categories, loadingCats } = useCategories();

  return (
    <AdminLayout title="Upload Content">
      <div className="max-w-3xl space-y-5">
        <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-600/25'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="animate-fade-in">
          {activeTab === 'file'  && <FileUploadTab  categories={categories} loadingCats={loadingCats} />}
          {activeTab === 'code'  && <FileCodeTab    categories={categories} loadingCats={loadingCats} />}
          {activeTab === 'abyss' && <AbyssImportTab categories={categories} loadingCats={loadingCats} />}
        </div>
      </div>
    </AdminLayout>
  );
};

// ============================================================
// FILE UPLOAD TAB
// ============================================================
const FileUploadTab = ({ categories, loadingCats }) => {
  const [file,      setFile]      = useState(null);
  const [title,     setTitle]     = useState('');
  const [tags,      setTags]      = useState('');
  const [category,  setCategory]  = useState('');
  const [status,    setStatus]    = useState(DEFAULT_STATUS);
  const [isPremium, setIsPremium] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  // Reset category when premium flag changes
  const handlePremiumChange = (val) => {
    setIsPremium(val);
    setCategory(''); // clear category so user picks the right type
  };

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setError('');
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)         { setError('Please select a video file'); return; }
    if (!title.trim()) { setError('Title is required');          return; }

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('video',     file);
    formData.append('title',     title.trim());
    formData.append('tags',      tags.trim());
    formData.append('status',    status);
    formData.append('isPremium', String(isPremium));
    if (category) formData.append('category', category);

    try {
      await adminAPI.uploadVideo(formData, (pct) => setProgress(pct));
      setDone(true);
      toast.success('Video uploaded successfully!');
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null); setTitle(''); setTags(''); setCategory('');
    setStatus(DEFAULT_STATUS); setIsPremium(false);
    setProgress(0); setDone(false); setError('');
  };

  if (done) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <FiCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Upload Complete!</h3>
        <p className="text-sm text-white/50 mb-6">
          Your video has been uploaded as{' '}
          {isPremium
            ? <span className="text-amber-400">★ Premium</span>
            : <span className="text-emerald-400">Public</span>
          }{' '}
          with status <span className="text-primary-400">{status}</span>.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleReset} className="btn-primary">Upload Another</button>
          <a href="/admin/videos" className="btn-secondary">Manage Videos</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`glass-panel rounded-2xl p-8 sm:p-12 border-2 border-dashed cursor-pointer text-center transition-all duration-250 ${
          isDragActive
            ? 'border-primary-600/60 bg-primary-600/[0.08]'
            : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <FiVideo className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-250 ${isDragActive ? 'border-primary-600 bg-primary-600/10' : 'border-white/15 bg-white/[0.03]'}`}>
              <FiUpload className={`w-6 h-6 ${isDragActive ? 'text-primary-400' : 'text-white/30'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">{isDragActive ? 'Drop your video here' : 'Drag & drop video file'}</p>
              <p className="text-xs text-white/40">or <span className="text-primary-400">browse files</span></p>
              <p className="text-[10px] text-white/25 mt-2">MP4, MKV, AVI, MOV, WMV · Max 2GB</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="glass-panel rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 font-medium">Uploading...</span>
            <span className="text-primary-400 font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-700 to-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Premium toggle — first so it filters the category list */}
        <PremiumToggle value={isPremium} onChange={handlePremiumChange} />

        <FormField label="Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            className="input-base"
            required
          />
        </FormField>

        <FormField label="Tags" hint="Comma separated: desi, indian, mms">
          <div className="relative">
            <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="input-base pl-9"
            />
          </div>
        </FormField>

        <FormField
          label={isPremium ? 'Premium Category' : 'Category'}
          hint={loadingCats ? 'Loading...' : `${categories.filter(c => Boolean(c.isPremium) === isPremium).length} available`}
        >
          <CategorySelect
            value={category}
            onChange={setCategory}
            categories={categories}
            isPremium={isPremium}
          />
        </FormField>

        <FormField label="Status">
          <StatusSelect value={status} onChange={setStatus} />
        </FormField>
      </div>

      <button
        type="submit"
        disabled={uploading || !file || !title.trim()}
        className={`w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 ${
          isPremium
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-[0_8px_25px_rgba(217,119,6,0.3)]'
            : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-[0_8px_25px_rgba(225,29,72,0.3)]'
        }`}
      >
        {uploading ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading {progress}%...</>
        ) : (
          <>{isPremium ? <FiStar className="w-4 h-4" /> : <FiUpload className="w-4 h-4" />}
          Upload {isPremium ? 'Premium ' : ''}Video</>
        )}
      </button>
    </form>
  );
};

// ============================================================
// FILE CODE TAB
// ============================================================
const FileCodeTab = ({ categories, loadingCats }) => {
  const [rows,       setRows]       = useState([{ fileCode: '', title: '', tags: '', category: '', status: DEFAULT_STATUS, isPremium: false }]);
  const [submitting, setSubmitting] = useState(false);
  const [results,    setResults]    = useState([]);
  const [error,      setError]      = useState('');

  const addRow    = () => setRows((p) => [...p, { fileCode: '', title: '', tags: '', category: '', status: DEFAULT_STATUS, isPremium: false }]);
  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    setRows((p) => p.map((r, idx) => {
      if (idx !== i) return r;
      // Reset category when premium changes
      if (field === 'isPremium') return { ...r, isPremium: val, category: '' };
      return { ...r, [field]: val };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.fileCode.trim());
    if (!valid.length) { setError('Enter at least one file code'); return; }
    setError('');
    setSubmitting(true);
    setResults([]);

    try {
      if (valid.length === 1) {
        await adminAPI.addByFileCode({
          file_code: valid[0].fileCode.trim(),
          title:     valid[0].title.trim(),
          tags:      valid[0].tags.trim(),
          status:    valid[0].status,
          isPremium: valid[0].isPremium,
          ...(valid[0].category ? { category: valid[0].category } : {}),
        });
        setResults([{ success: true, fileCode: valid[0].fileCode }]);
        toast.success('Video added successfully!');
      } else {
        const res  = await adminAPI.bulkAddFileCodes(
          valid.map((r) => ({
            file_code: r.fileCode.trim(),
            title:     r.title.trim(),
            tags:      r.tags.trim(),
            status:    r.status,
            isPremium: r.isPremium,
            ...(r.category ? { category: r.category } : {}),
          }))
        );
        const data         = res?.data?.results || [];
        const successCount = (data.success || []).length;
        setResults([
          ...(data.success   || []).map(r => ({ success: true,  fileCode: r.file_code })),
          ...(data.duplicates|| []).map(r => ({ success: true,  fileCode: r.file_code, note: 'duplicate' })),
          ...(data.failed    || []).map(r => ({ success: false, fileCode: r.file_code, error: r.error })),
        ]);
        toast.success(`${successCount} video(s) added`);
      }
      setRows([{ fileCode: '', title: '', tags: '', category: '', status: DEFAULT_STATUS, isPremium: false }]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add videos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/[0.08] border border-blue-500/15">
        <FiInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-px" />
        <p className="text-xs text-white/50 leading-relaxed">
          Enter abyss.to file codes to add videos. Thumbnail and embed URL will be auto-generated.
          Set each video as Public or Premium individually.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-panel rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Results</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {r.success
                ? <FiCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                : <FiX     className="w-3.5 h-3.5 text-red-400    flex-shrink-0" />
              }
              <span className="font-mono text-white/60">{r.fileCode}</span>
              {r.note  && <span className="text-amber-400">— {r.note}</span>}
              {r.error && <span className="text-red-400">— {r.error}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="space-y-3">
            {i > 0 && <div className="h-px bg-white/5" />}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40">Video {i + 1}</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-red-400/50 hover:text-red-400 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Premium toggle per row */}
            <PremiumToggle value={row.isPremium} onChange={(v) => updateRow(i, 'isPremium', v)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="File Code *">
                <div className="relative">
                  <FiCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    value={row.fileCode}
                    onChange={(e) => updateRow(i, 'fileCode', e.target.value)}
                    placeholder="e.g. abc123xyz"
                    className="input-base pl-9 font-mono text-xs"
                  />
                </div>
              </FormField>
              <FormField label="Title">
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(i, 'title', e.target.value)}
                  placeholder="Leave blank to auto-detect"
                  className="input-base"
                />
              </FormField>
              <FormField label="Tags">
                <input
                  type="text"
                  value={row.tags}
                  onChange={(e) => updateRow(i, 'tags', e.target.value)}
                  placeholder="tag1, tag2"
                  className="input-base"
                />
              </FormField>
              <FormField
                label={row.isPremium ? 'Premium Category' : 'Category'}
                hint={loadingCats ? 'Loading...' : undefined}
              >
                <CategorySelect
                  value={row.category}
                  onChange={(v) => updateRow(i, 'category', v)}
                  categories={categories}
                  isPremium={row.isPremium}
                />
              </FormField>
              <FormField label="Status">
                <StatusSelect value={row.status} onChange={(v) => updateRow(i, 'status', v)} />
              </FormField>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/40 border border-dashed border-white/10 hover:border-white/25 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FiPlus className="w-3.5 h-3.5" />Add Another File Code
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(225,29,72,0.3)]"
      >
        {submitting
          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Adding...</>
          : <><FiPlus className="w-4 h-4" />Add {rows.filter(r => r.fileCode.trim()).length > 1 ? `${rows.filter(r => r.fileCode.trim()).length} Videos` : 'Video'}</>
        }
      </button>
    </form>
  );
};

// ============================================================
// ABYSS IMPORT TAB
// ============================================================
const AbyssImportTab = ({ categories, loadingCats }) => {
  const [abyssFiles,    setAbyssFiles]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [importing,     setImporting]     = useState(new Set());
  const [imported,      setImported]      = useState(new Set());
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [batchCategory, setBatchCategory] = useState('');
  const [batchPremium,  setBatchPremium]  = useState(false);

  const handleBatchPremiumChange = (val) => {
    setBatchPremium(val);
    setBatchCategory(''); // reset category when type changes
  };

  const loadAbyssFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await adminAPI.getAbyssFiles();
      const data = res?.data?.files || res?.data || [];
      setAbyssFiles(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load abyss.to files. Check your API credentials.');
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (file) => {
    setImporting((p) => new Set([...p, file.file_code]));
    try {
      await adminAPI.addByFileCode({
        file_code: file.file_code,
        title:     file.title || file.name || '',
        status:    DEFAULT_STATUS,
        isPremium: batchPremium,
        ...(batchCategory ? { category: batchCategory } : {}),
      });
      setImported((p) => new Set([...p, file.file_code]));
      toast.success(`"${file.title || file.file_code}" imported`);
    } catch {
      toast.error(`Failed to import ${file.file_code}`);
    } finally {
      setImporting((p) => { const next = new Set(p); next.delete(file.file_code); return next; });
    }
  };

  const filtered = abyssFiles.filter((f) => {
    const q = search.toLowerCase();
    return !q || (f.title || '').toLowerCase().includes(q) || (f.file_code || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-5 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <FiDownload className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Import from Abyss.to</h3>
        <p className="text-xs text-white/40 mb-5">Browse your abyss.to account files and import them directly.</p>
        <button onClick={loadAbyssFiles} disabled={loading} className="btn-primary">
          {loading
            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Loading...</>
            : <><FiRefreshCw className="w-4 h-4" />{abyssFiles.length ? 'Refresh' : 'Load Files'}</>
          }
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {abyssFiles.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] space-y-3">
            {/* Batch premium toggle */}
            <PremiumToggle value={batchPremium} onChange={handleBatchPremiumChange} />

            {/* Batch category filtered by premium type */}
            <FormField
              label={batchPremium ? 'Assign Premium Category to All Imports' : 'Assign Category to All Imports'}
              hint={loadingCats ? 'Loading...' : `${categories.filter(c => Boolean(c.isPremium) === batchPremium).length} available`}
            >
              <CategorySelect
                value={batchCategory}
                onChange={setBatchCategory}
                categories={categories}
                isPremium={batchPremium}
              />
            </FormField>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="input-base pl-9 h-9 text-sm"
                />
              </div>
              <span className="text-xs text-white/30 whitespace-nowrap">{filtered.length} / {abyssFiles.length} files</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {filtered.map((file) => {
              const isImporting = importing.has(file.file_code);
              const isImported  = imported.has(file.file_code) || file.alreadyAdded;
              return (
                <div key={file.file_code} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="w-16 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-dark-300">
                    <img
                      src={`https://abyss.to/splash/${file.file_code}.jpg`}
                      alt={file.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{file.title || file.name || 'Untitled'}</p>
                    <p className="text-[10px] text-white/35 font-mono">{file.file_code}</p>
                  </div>
                  <button
                    onClick={() => importFile(file)}
                    disabled={isImporting || isImported}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      isImported
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 cursor-default'
                        : isImporting
                          ? 'opacity-50 cursor-not-allowed bg-white/5 text-white/30 border-white/10'
                          : batchPremium
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25'
                            : 'bg-primary-600/15 text-primary-400 border-primary-600/25 hover:bg-primary-600/25'
                    }`}
                  >
                    {isImported
                      ? <><FiCheck className="w-3 h-3 inline mr-1" />Done</>
                      : isImporting
                        ? <><span className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin inline-block mr-1" />Importing</>
                        : batchPremium
                          ? <><FiStar className="w-3 h-3 inline mr-1" />Import</>
                          : 'Import'
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
const FormField = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
      {label}
      {hint && <span className="text-[10px] text-white/25 normal-case tracking-normal font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const StatusSelect = ({ value, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none input-base pr-8 cursor-pointer"
    >
      <option value="private" className="bg-dark-300">Private (default)</option>
      <option value="public"  className="bg-dark-300">Public</option>
      <option value="draft"   className="bg-dark-300">Draft</option>
    </select>
    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
  </div>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default UploadPage;