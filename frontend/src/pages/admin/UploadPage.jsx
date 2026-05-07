// src/pages/admin/UploadPage.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FiUpload, FiDownload, FiCheck,
  FiX, FiAlertCircle, FiPlus,
  FiTrash2, FiRefreshCw, FiInfo, FiCode,
  FiVideo, FiTag,
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

const UploadPage = () => {
  const [activeTab, setActiveTab] = useState('file');

  return (
    <AdminLayout title="Upload Content">
      <div className="max-w-3xl space-y-5">
        <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? 'bg-primary-600/20 text-primary-400 border border-primary-600/25' : 'text-white/40 hover:text-white/70'}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="animate-fade-in">
          {activeTab === 'file'  && <FileUploadTab  />}
          {activeTab === 'code'  && <FileCodeTab    />}
          {activeTab === 'abyss' && <AbyssImportTab />}
        </div>
      </div>
    </AdminLayout>
  );
};

const FileUploadTab = () => {
  const [file,      setFile]      = useState(null);
  const [title,     setTitle]     = useState('');
  const [tags,      setTags]      = useState('');
  const [status,    setStatus]    = useState(DEFAULT_STATUS);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [done,      setDone]      = useState(false);
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
    formData.append('video',  file);
    formData.append('title',  title.trim());
    formData.append('tags',   tags.trim());
    formData.append('status', status);

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
    setFile(null); setTitle(''); setTags('');
    setStatus(DEFAULT_STATUS); setProgress(0); setDone(false); setError('');
  };

  if (done) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <FiCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Upload Complete!</h3>
        <p className="text-sm text-white/50 mb-6">
          Your video has been uploaded and is now <span className="text-amber-400">{status}</span>.
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
      <div
        {...getRootProps()}
        className={`glass-panel rounded-2xl p-8 sm:p-12 border-2 border-dashed cursor-pointer text-center transition-all duration-250 ${isDragActive ? 'border-primary-600/60 bg-primary-600/[0.08]' : file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'}`}
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
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
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

      {uploading && (
        <div className="glass-panel rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 font-medium">Uploading...</span>
            <span className="text-primary-400 font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-700 to-primary-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
        <FormField label="Title *">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" className="input-base" required />
        </FormField>
        <FormField label="Tags" hint="Comma separated: desi, indian, mms">
          <div className="relative">
            <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" className="input-base pl-9" />
          </div>
        </FormField>
        <FormField label="Status">
          <StatusSelect value={status} onChange={setStatus} />
        </FormField>
      </div>

      <button
        type="submit"
        disabled={uploading || !file || !title.trim()}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(225,29,72,0.3)]"
      >
        {uploading ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading {progress}%...</>
        ) : (
          <><FiUpload className="w-4 h-4" />Upload Video</>
        )}
      </button>
    </form>
  );
};

const FileCodeTab = () => {
  const [rows,       setRows]       = useState([{ fileCode: '', title: '', tags: '', status: DEFAULT_STATUS }]);
  const [submitting, setSubmitting] = useState(false);
  const [results,    setResults]    = useState([]);
  const [error,      setError]      = useState('');

  const addRow    = () => setRows((p) => [...p, { fileCode: '', title: '', tags: '', status: DEFAULT_STATUS }]);
  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setRows((p) => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.fileCode.trim());
    if (!valid.length) { setError('Enter at least one file code'); return; }
    setError('');
    setSubmitting(true);
    setResults([]);

    try {
      if (valid.length === 1) {
        await adminAPI.addByFileCode({ fileCode: valid[0].fileCode.trim(), title: valid[0].title.trim(), tags: valid[0].tags.trim(), status: valid[0].status });
        setResults([{ success: true, fileCode: valid[0].fileCode }]);
        toast.success('Video added successfully!');
      } else {
        const res  = await adminAPI.bulkAddFileCodes(valid.map((r) => ({ fileCode: r.fileCode.trim(), title: r.title.trim(), tags: r.tags.trim(), status: r.status })));
        const data = res?.data?.results || [];
        setResults(data);
        const successCount = data.filter((r) => r.success).length;
        toast.success(`${successCount}/${data.length} videos added`);
      }
      setRows([{ fileCode: '', title: '', tags: '', status: DEFAULT_STATUS }]);
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
          Enter abyss.to file codes to add videos. The thumbnail and embed URL will be automatically generated.
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
              {r.success ? <FiCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <FiX className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              <span className="font-mono text-white/60">{r.fileCode}</span>
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
                <button type="button" onClick={() => removeRow(i)} className="text-red-400/50 hover:text-red-400 transition-colors">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="File Code *">
                <div className="relative">
                  <FiCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input type="text" value={row.fileCode} onChange={(e) => updateRow(i, 'fileCode', e.target.value)} placeholder="e.g. abc123xyz" className="input-base pl-9 font-mono text-xs" />
                </div>
              </FormField>
              <FormField label="Title">
                <input type="text" value={row.title} onChange={(e) => updateRow(i, 'title', e.target.value)} placeholder="Leave blank to auto-detect" className="input-base" />
              </FormField>
              <FormField label="Tags">
                <input type="text" value={row.tags} onChange={(e) => updateRow(i, 'tags', e.target.value)} placeholder="tag1, tag2" className="input-base" />
              </FormField>
              <FormField label="Status">
                <StatusSelect value={row.status} onChange={(v) => updateRow(i, 'status', v)} />
              </FormField>
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/40 border border-dashed border-white/10 hover:border-white/25 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 flex items-center justify-center gap-2">
          <FiPlus className="w-3.5 h-3.5" />Add Another File Code
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(225,29,72,0.3)]"
      >
        {submitting ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Adding...</>
        ) : (
          <><FiPlus className="w-4 h-4" />Add {rows.filter((r) => r.fileCode.trim()).length > 1 ? `${rows.filter((r) => r.fileCode.trim()).length} Videos` : 'Video'}</>
        )}
      </button>
    </form>
  );
};

const AbyssImportTab = () => {
  const [abyssFiles, setAbyssFiles] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [importing,  setImporting]  = useState(new Set());
  const [imported,   setImported]   = useState(new Set());
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');

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
      await adminAPI.addByFileCode({ fileCode: file.file_code, title: file.title || file.name || '', status: DEFAULT_STATUS });
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
          {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Loading...</> : <><FiRefreshCw className="w-4 h-4" />{abyssFiles.length ? 'Refresh' : 'Load Files'}</>}
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
          <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="input-base pl-9 h-9 text-sm" />
            </div>
            <span className="text-xs text-white/30 whitespace-nowrap">{filtered.length} / {abyssFiles.length} files</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {filtered.map((file) => {
              const isImporting = importing.has(file.file_code);
              const isImported  = imported.has(file.file_code);
              return (
                <div key={file.file_code} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="w-16 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-dark-300">
                    <img src={`https://abyss.to/splash/${file.file_code}.jpg`} alt={file.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{file.title || file.name || 'Untitled'}</p>
                    <p className="text-[10px] text-white/35 font-mono">{file.file_code}</p>
                  </div>
                  <button
                    onClick={() => importFile(file)}
                    disabled={isImporting || isImported}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${isImported ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 cursor-default' : isImporting ? 'opacity-50 cursor-not-allowed bg-white/5 text-white/30 border-white/10' : 'bg-primary-600/15 text-primary-400 border-primary-600/25 hover:bg-primary-600/25'}`}
                  >
                    {isImported ? <><FiCheck className="w-3 h-3 inline mr-1" />Done</> : isImporting ? <><span className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin inline-block mr-1" />Importing</> : 'Import'}
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none input-base pr-8 cursor-pointer">
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