import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiEdit2, FiTrash2, FiStar,
  FiEye, FiCheck, FiX, FiPlus,
  FiCopy, FiExternalLink, FiCheckCircle,
  FiDownload, FiUpload, FiHash, FiLink,
  FiClipboard, FiTag, FiFileText, FiChevronDown,
  FiChevronUp, FiRefreshCw, FiAlertCircle,FiLock, FiGlobe,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import AdminLayout from '../../components/admin/AdminLayout';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatViews, formatDate, debounce } from '../../utils/helpers';
import { adminAPI, publicAPI } from '../../services/api';

// ==========================================
// BULK EDIT TITLES MODAL
// ==========================================
const BulkEditTitlesModal = ({ videos, onClose, onSave }) => {
  const [titleData, setTitleData] = useState('');
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('paste'); // paste, preview

  const parseTitles = () => {
    const lines = titleData.split('\n').filter(l => l.trim());
    const mapped = videos.map((video, index) => ({
      id: video._id,
      currentTitle: video.title,
      newTitle: lines[index] ? lines[index].trim() : video.title,
      changed: lines[index] ? lines[index].trim() !== video.title : false,
    }));
    setPreview(mapped);
    setStep('preview');
  };

  const handleSave = async () => {
    const updates = preview.filter(p => p.changed).map(p => ({
      id: p.id,
      title: p.newTitle,
    }));

    if (updates.length === 0) {
      toast('No changes to save', { icon: '📝' });
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.bulkUpdateTitles(updates);
      if (res.data.success) {
        toast.success(`Updated ${res.data.results.success} titles`);
        if (res.data.results.failed > 0) {
          toast.error(`${res.data.results.failed} failed`);
        }
        onSave();
      }
    } catch (error) {
      toast.error('Failed to update titles');
    } finally {
      setLoading(false);
    }
  };

  const generateNumberedTitles = () => {
    const baseName = window.prompt('Enter base title name:', 'Post');
    if (!baseName) return;
    const titles = videos.map((_, i) => `${baseName} (${String(i + 1).padStart(2, '0')})`);
    setTitleData(titles.join('\n'));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-dark-100">
        <div className="flex items-center justify-between p-5 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <FiEdit2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Edit Titles</h3>
              <p className="text-sm text-gray-400">Paste {videos.length} titles from Excel (one per line)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'paste' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={generateNumberedTitles} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">
                  🔢 Generate Numbered Titles
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Paste titles below (one per line, matching video order):
                </label>
                <textarea
                  value={titleData}
                  onChange={(e) => setTitleData(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 bg-dark-100 border border-dark-100 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={`Title Post (01)\nTitle Post (02)\nTitle Post (03)\n...paste from Excel here`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {titleData.split('\n').filter(l => l.trim()).length} titles entered for {videos.length} videos
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-4">
                <h4 className="text-white font-medium mb-2 text-sm">Current videos order:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {videos.map((v, i) => (
                    <p key={v._id} className="text-gray-400 text-xs font-mono">
                      {String(i + 1).padStart(2, '0')}. {v.title}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={parseTitles}
                disabled={!titleData.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Preview Changes →
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">
                  {preview.filter(p => p.changed).length} changes to apply
                </h4>
                <button onClick={() => setStep('paste')} className="px-3 py-2 bg-dark-100 text-gray-400 rounded-lg text-sm">
                  ← Back to Edit
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {preview.map((item, i) => (
                  <div key={item.id} className={`p-3 rounded-xl ${item.changed ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-dark-100'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-mono">#{String(i + 1).padStart(2, '0')}</span>
                      {item.changed ? (
                        <span className="text-blue-400 font-medium">CHANGED</span>
                      ) : (
                        <span className="text-gray-600">unchanged</span>
                      )}
                    </div>
                    {item.changed ? (
                      <>
                        <p className="text-red-400 text-sm line-through">{item.currentTitle}</p>
                        <p className="text-green-400 text-sm font-medium">{item.newTitle}</p>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">{item.currentTitle}</p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={loading || preview.filter(p => p.changed).length === 0}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Apply {preview.filter(p => p.changed).length} Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BULK ADD TAGS MODAL
// ==========================================
const BulkAddTagsModal = ({ videos, onClose, onSave }) => {
  const [tagData, setTagData] = useState('');
  const [mode, setMode] = useState('append'); // append or replace
  const [loading, setLoading] = useState(false);
  const [applyMode, setApplyMode] = useState('same'); // same = same tags for all, perline = different tags per video

  const handleApply = async () => {
    if (!tagData.trim()) {
      toast.error('Enter at least one tag');
      return;
    }

    setLoading(true);
    try {
      let updates;

      if (applyMode === 'same') {
        // Same tags for all selected videos
        const tags = tagData.split(/[,\n]/).map(t => t.trim().toLowerCase()).filter(Boolean);
        updates = videos.map(v => ({
          id: v._id,
          tags: tags,
          mode: mode,
        }));
      } else {
        // Different tags per line for each video
        const lines = tagData.split('\n').filter(l => l.trim());
        updates = videos.map((v, i) => {
          const lineTags = (lines[i] || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          return {
            id: v._id,
            tags: lineTags,
            mode: mode,
          };
        });
      }

      const res = await adminAPI.bulkUpdateTags(updates);
      if (res.data.success) {
        toast.success(`Updated tags for ${res.data.results.success} videos`);
        onSave();
      }
    } catch (error) {
      toast.error('Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-dark-100">
        <div className="flex items-center justify-between p-5 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <FiTag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Add Tags</h3>
              <p className="text-sm text-gray-400">Add tags to {videos.length} selected videos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setApplyMode('same')}
              className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                applyMode === 'same'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-dark-100 text-gray-400 border-dark-100 hover:text-white'
              }`}
            >
              🏷️ Same tags for all
            </button>
            <button
              onClick={() => setApplyMode('perline')}
              className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                applyMode === 'perline'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-dark-100 text-gray-400 border-dark-100 hover:text-white'
              }`}
            >
              📋 Different tags per video
            </button>
          </div>

          {/* Append/Replace */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('append')}
              className={`flex-1 p-2 rounded-lg text-sm ${
                mode === 'append' ? 'bg-blue-500/20 text-blue-400' : 'bg-dark-100 text-gray-400'
              }`}
            >
              ➕ Append to existing
            </button>
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 p-2 rounded-lg text-sm ${
                mode === 'replace' ? 'bg-red-500/20 text-red-400' : 'bg-dark-100 text-gray-400'
              }`}
            >
              🔄 Replace all tags
            </button>
          </div>

          {/* Tag Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {applyMode === 'same'
                ? 'Enter tags (comma separated):'
                : 'Enter tags per video (one line per video, comma separated):'}
            </label>
            <textarea
              value={tagData}
              onChange={(e) => setTagData(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-dark-100 border border-dark-100 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder={
                applyMode === 'same'
                  ? 'tag1, tag2, tag3, tag4'
                  : 'tag1, tag2 (for video 1)\ntag3, tag4 (for video 2)\ntag5, tag6 (for video 3)'
              }
            />
          </div>

          <button
            onClick={handleApply}
            disabled={loading || !tagData.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <FiTag className="w-5 h-5" />
                Apply Tags to {videos.length} Videos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BULK SHARE LINKS PANEL (No Telegram)
// ==========================================
const BulkShareLinksPanel = ({ onClose }) => {
  const [count, setCount] = useState(50);
  const [videos, setVideos] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [allCopied, setAllCopied] = useState(false);
  const [phase, setPhase] = useState('setup'); // setup, preview

  const handleFetchVideos = async () => {
    if (count < 1) {
      toast.error('Enter a number greater than 0');
      return;
    }
    setFetching(true);
    try {
      const res = await adminAPI.bulkShareLinks({ mode: 'first', count });
      if (res.data.success) {
        setVideos(res.data.videos);
        setPhase('preview');
        if (res.data.videos.length === 0) {
          toast('No videos found', { icon: '📭' });
        } else {
          toast.success(`Found ${res.data.videos.length} videos`);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch videos');
    } finally {
      setFetching(false);
    }
  };

  const copyShareUrl = async (url, index) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 1500);
    } catch (e) {
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 1500);
    }
  };

  const copyAllUrls = async () => {
    const allUrls = videos.map(v => v.shareUrl).join('\n');
    try {
      await navigator.clipboard.writeText(allUrls);
      setAllCopied(true);
      toast.success(`Copied ${videos.length} URLs to clipboard`);
      setTimeout(() => setAllCopied(false), 3000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = allUrls;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setAllCopied(true);
      toast.success(`Copied ${videos.length} URLs to clipboard`);
      setTimeout(() => setAllCopied(false), 3000);
    }
  };

  const copyAllWithTitles = async () => {
    const data = videos.map(v => `${v.title}\t${v.shareUrl}`).join('\n');
    try {
      await navigator.clipboard.writeText(data);
      toast.success(`Copied ${videos.length} titles + URLs (Excel format)`);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = data;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(`Copied ${videos.length} titles + URLs (Excel format)`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-dark-100">
        <div className="flex items-center justify-between p-5 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <FiLink className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generate Share Links</h3>
              <p className="text-sm text-gray-400">Get shareable video links for any platform</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {phase === 'setup' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How many videos?
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                    min="1"
                    max="5000"
                    className="flex-1 px-4 py-3 bg-dark-100 border border-dark-100 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleFetchVideos}
                    disabled={fetching || count < 1}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {fetching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FiSearch className="w-5 h-5" />
                        Fetch Videos
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 200, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      count === n
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-white font-semibold">{videos.length} Videos</h4>
                <div className="flex gap-2">
                  <button onClick={() => { setPhase('setup'); setVideos([]); }} className="px-3 py-2 bg-dark-100 text-gray-400 rounded-lg text-sm">← Back</button>
                  <button
                    onClick={copyAllUrls}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      allCopied ? 'bg-green-500 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {allCopied ? <><FiCheck className="w-4 h-4" /> Copied!</> : <><FiCopy className="w-4 h-4" /> Copy URLs</>}
                  </button>
                  <button
                    onClick={copyAllWithTitles}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <FiClipboard className="w-4 h-4" /> Copy with Titles
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {videos.map((video, index) => (
                  <div key={video._id} className="flex items-center gap-3 p-3 bg-dark-100 rounded-xl hover:bg-dark-300 transition-colors">
                    <span className="text-gray-500 text-sm font-mono w-8 text-right flex-shrink-0">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{video.title}</p>
                      <p className="text-gray-500 text-xs truncate">{video.shareUrl}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => copyShareUrl(video.shareUrl, index)}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          copiedIndex === index ? 'bg-green-500/20 text-green-400' : 'hover:bg-dark-200 text-gray-400 hover:text-white'
                        }`}
                      >
                        {copiedIndex === index ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      </button>
                      <a href={video.shareUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-dark-200 rounded-lg text-gray-400 hover:text-white">
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EXPORT MODAL
// ==========================================
const ExportModal = ({ selectedIds, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('all'); // all, selected

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const ids = exportType === 'selected' && selectedIds.length > 0 ? selectedIds : undefined;
      const res = await adminAPI.exportVideosCSV(ids);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xmaster-videos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV downloaded!');
      onClose();
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setLoading(true);
    try {
      const ids = exportType === 'selected' && selectedIds.length > 0 ? selectedIds.join(',') : undefined;
      const res = await adminAPI.exportVideos({ ids });
      if (res.data.success) {
        const jsonStr = JSON.stringify(res.data.videos, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xmaster-videos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('JSON downloaded!');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setLoading(true);
    try {
      const ids = exportType === 'selected' && selectedIds.length > 0 ? selectedIds.join(',') : undefined;
      const res = await adminAPI.exportVideos({ ids });
      if (res.data.success) {
        const tsvData = 'Title\tShare URL\tTags\tViews\tDuration\tCategory\n' +
          res.data.videos.map(v =>
            `${v.title}\t${v.shareUrl}\t${v.tags}\t${v.views}\t${v.duration}\t${v.category}`
          ).join('\n');
        await navigator.clipboard.writeText(tsvData);
        toast.success(`Copied ${res.data.videos.length} video metadata (paste into Excel)`);
        onClose();
      }
    } catch (error) {
      toast.error('Failed to copy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl max-w-lg w-full border border-dark-100">
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <FiDownload className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Export Video Metadata</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Export scope */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportType('all')}
              className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                exportType === 'all'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-dark-100 text-gray-400 border-dark-100'
              }`}
            >
              📦 Export All Videos
            </button>
            <button
              onClick={() => setExportType('selected')}
              disabled={selectedIds.length === 0}
              className={`p-3 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
                exportType === 'selected'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-dark-100 text-gray-400 border-dark-100'
              }`}
            >
              ☑️ Selected ({selectedIds.length})
            </button>
          </div>

          <div className="bg-dark-100 rounded-xl p-4 text-sm text-gray-400">
            <p className="font-medium text-white mb-2">Export includes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Video Title</li>
              <li>Shareable Link</li>
              <li>Tags</li>
              <li>Views, Duration, Category</li>
              <li>File Code, Upload Date</li>
            </ul>
          </div>

          {/* Export Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiFileText className="w-5 h-5" />
              Download CSV (Excel)
            </button>
            <button
              onClick={handleExportJSON}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiDownload className="w-5 h-5" />
              Download JSON
            </button>
            <button
              onClick={handleCopyToClipboard}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiClipboard className="w-5 h-5" />
              Copy to Clipboard (Excel Format)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN VIDEOS MANAGER
// ==========================================
const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedVideos, setSelectedVideos] = useState([]);

  // Modals
  const [editingVideo, setEditingVideo] = useState(null);
  const [showShareLinks, setShowShareLinks] = useState(false);
  const [showBulkTitles, setShowBulkTitles] = useState(false);
  const [showBulkTags, setShowBulkTags] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Bulk select by number
  const [selectCount, setSelectCount] = useState('');
  const [showSelectInput, setShowSelectInput] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [featured, setFeatured] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getVideos({ page, limit: 50, search, status, featured, sort });
      if (response.data.success) {
        setVideos(response.data.videos);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, featured, sort]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const debouncedSearch = debounce((value) => {
    setSearch(value);
    setPage(1);
  }, 500);

  const handleToggleFeatured = async (video) => {
    try {
      const response = await adminAPI.toggleFeatured(video._id);
      if (response.data.success) {
        setVideos(videos.map(v => v._id === video._id ? { ...v, featured: response.data.featured } : v));
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteVideo(video._id);
      setVideos(videos.filter(v => v._id !== video._id));
      toast.success('Video deleted successfully');
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    if (!window.confirm(`Delete ${selectedVideos.length} videos? This cannot be undone.`)) return;
    try {
      await adminAPI.bulkDeleteVideos(selectedVideos);
      setVideos(videos.filter(v => !selectedVideos.includes(v._id)));
      setSelectedVideos([]);
      toast.success(`${selectedVideos.length} videos deleted`);
    } catch (error) {
      toast.error('Failed to delete videos');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVideos(videos.map(v => v._id));
    } else {
      setSelectedVideos([]);
    }
  };

  const handleSelectVideo = (videoId) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectByCount = () => {
    const num = parseInt(selectCount);
    if (!num || num < 1) {
      toast.error('Enter a valid number');
      return;
    }
    const toSelect = videos.slice(0, Math.min(num, videos.length)).map(v => v._id);
    setSelectedVideos(toSelect);
    setShowSelectInput(false);
    setSelectCount('');
    toast.success(`Selected ${toSelect.length} videos`);
  };

  const copySelectedLinks = async () => {
    if (selectedVideos.length === 0) {
      toast.error('No videos selected');
      return;
    }
    try {
      const res = await adminAPI.bulkShareLinks({ ids: selectedVideos, mode: 'selected' });
      if (res.data.success) {
        const urls = res.data.videos.map(v => v.shareUrl).join('\n');
        await navigator.clipboard.writeText(urls);
        toast.success(`Copied ${res.data.videos.length} share links to clipboard`);
      }
    } catch (error) {
      toast.error('Failed to copy links');
    }
  };

  const copySelectedWithTitles = async () => {
    if (selectedVideos.length === 0) {
      toast.error('No videos selected');
      return;
    }
    try {
      const res = await adminAPI.bulkShareLinks({ ids: selectedVideos, mode: 'selected' });
      if (res.data.success) {
        const data = res.data.videos.map(v => `${v.title}\t${v.shareUrl}`).join('\n');
        await navigator.clipboard.writeText(data);
        toast.success(`Copied ${res.data.videos.length} titles + links (Excel format)`);
      }
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const selectedVideoObjects = videos.filter(v => selectedVideos.includes(v._id));

  return (
    <AdminLayout title="Videos Manager">
      {/* Modals */}
      {showShareLinks && <BulkShareLinksPanel onClose={() => setShowShareLinks(false)} />}
      {showBulkTitles && selectedVideoObjects.length > 0 && (
        <BulkEditTitlesModal
          videos={selectedVideoObjects}
          onClose={() => setShowBulkTitles(false)}
          onSave={() => { setShowBulkTitles(false); fetchVideos(); }}
        />
      )}
      {showBulkTags && selectedVideoObjects.length > 0 && (
        <BulkAddTagsModal
          videos={selectedVideoObjects}
          onClose={() => setShowBulkTags(false)}
          onSave={() => { setShowBulkTags(false); fetchVideos(); }}
        />
      )}
      {showExport && (
        <ExportModal selectedIds={selectedVideos} onClose={() => setShowExport(false)} />
      )}
      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSave={(updatedVideo) => {
            setVideos(videos.map(v => v._id === updatedVideo._id ? updatedVideo : v));
            setEditingVideo(null);
            toast.success('Video updated successfully');
          }}
        />
      )}

      {/* ==================== TOP TOOLBAR ==================== */}
      <div className="bg-dark-200 rounded-xl p-4 mb-6 border border-dark-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search videos..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Status</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
            <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Videos</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-dark-100 border border-dark-100 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Most Viewed</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowShareLinks(true)} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              <FiLink className="w-4 h-4" />
              <span className="hidden sm:inline">Share Links</span>
            </button>
            <button onClick={() => setShowExport(true)} className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link to="/admin/upload" className="btn-primary">
              <FiPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Video</span>
            </Link>
          </div>
        </div>

        {/* ==================== BULK ACTIONS BAR ==================== */}
        <div className="mt-4 pt-4 border-t border-dark-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Select by number */}
            <div className="flex items-center gap-2">
              {showSelectInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectCount}
                    onChange={(e) => setSelectCount(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-24 px-3 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelectByCount(); }}
                  />
                  <button onClick={handleSelectByCount} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowSelectInput(false); setSelectCount(''); }} className="px-3 py-2 bg-dark-100 text-gray-400 rounded-lg text-sm">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowSelectInput(true)} className="px-3 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                  <FiHash className="w-4 h-4" />
                  Select by Number
                </button>
              )}
            </div>

            {selectedVideos.length > 0 && (
              <>
                <span className="text-sm text-primary-400 font-medium">
                  {selectedVideos.length} selected
                </span>
                <div className="h-4 w-px bg-dark-100"></div>

                <button onClick={() => setShowBulkTitles(true)} className="px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                  <FiEdit2 className="w-3.5 h-3.5" />
                  Bulk Titles
                </button>
                <button onClick={() => setShowBulkTags(true)} className="px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5" />
                  Bulk Tags
                </button>
                <button onClick={copySelectedLinks} className="px-3 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                  <FiCopy className="w-3.5 h-3.5" />
                  Copy Links
                </button>
                <button onClick={copySelectedWithTitles} className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                  <FiClipboard className="w-3.5 h-3.5" />
                  Copy with Titles
                </button>

              <button
  onClick={async () => {
    try {
      const res = await adminAPI.bulkUpdateStatus({ ids: selectedVideos, status: 'public' });
      if (res.data.success) {
        toast.success(`Published ${res.data.modifiedCount} videos`);
        fetchVideos();
        setSelectedVideos([]);
      }
    } catch (e) { toast.error('Failed'); }
  }}
  className="px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5"
>
  <FiCheckCircle className="w-3.5 h-3.5" />
  Publish
</button>
<button
  onClick={async () => {
    try {
      const res = await adminAPI.bulkUpdateStatus({ ids: selectedVideos, status: 'private' });
      if (res.data.success) {
        toast.success(`Made ${res.data.modifiedCount} videos private`);
        fetchVideos();
        setSelectedVideos([]);
      }
    } catch (e) { toast.error('Failed'); }
  }}
  className="px-3 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5"
>
  <FiLock className="w-3.5 h-3.5" />
  Make Private
</button>

                <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button onClick={() => setSelectedVideos([])} className="px-3 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg text-sm transition-colors">
                  Clear Selection
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== VIDEOS TABLE ==================== */}
      <div className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No videos found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-300">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedVideos.length === videos.length && videos.length > 0} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Video</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Featured</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id} className="border-t border-dark-100 hover:bg-dark-100/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedVideos.includes(video._id)} onChange={() => handleSelectVideo(video._id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-xs">{video.title}</p>
                          <p className="text-gray-500 text-sm">{video.file_code}</p>
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {video.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-dark-100 text-gray-500 rounded">#{tag}</span>
                              ))}
                              {video.tags.length > 3 && (
                                <span className="text-[10px] text-gray-600">+{video.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-300">
                        <FiEye className="w-4 h-4" />
                        {formatViews(video.views)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${video.status === 'public' ? 'badge-success' : video.status === 'private' ? 'badge-danger' : 'badge-warning'}`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleFeatured(video)} className={`p-2 rounded-lg transition-colors ${video.featured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-dark-100 text-gray-500 hover:text-yellow-500'}`}>
                        <FiStar className="w-5 h-5" fill={video.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(video.uploadDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingVideo(video)} className="p-2 hover:bg-dark-100 rounded-lg text-gray-400 hover:text-white transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(video)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-dark-100">
          <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// EDIT VIDEO MODAL
// ==========================================
// ==========================================
// EDIT VIDEO MODAL (UPDATED with Categories)
// ==========================================
const EditVideoModal = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: video.title || '',
    description: video.description || '',
    tags: video.tags?.join(', ') || '',
    status: video.status || 'public',
    featured: video.featured || false,
    category: video.category?._id || video.category || '',
    categories: (video.categories || []).map(c => c._id || c),
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');

  // Fetch categories
  useEffect(() => {
    publicAPI.getCategories()
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      })
      .catch(console.error);
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const toggleCategory = (catId) => {
    setFormData(prev => {
      const current = prev.categories || [];
      const isSelected = current.includes(catId);

      let newCategories;
      if (isSelected) {
        newCategories = current.filter(id => id !== catId);
      } else {
        newCategories = [...current, catId];
      }

      // Primary category = first in list
      const newPrimary = newCategories.length > 0 ? newCategories[0] : '';

      return {
        ...prev,
        categories: newCategories,
        category: newPrimary,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await adminAPI.updateVideo(video._id, {
        title: formData.title,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: formData.status,
        featured: formData.featured,
        category: formData.category || null,
        categories: formData.categories || [],
      });
      if (response.data.success) {
        onSave(response.data.video);
      }
    } catch (error) {
      toast.error('Failed to update video');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryNames = formData.categories
    .map(id => categories.find(c => c._id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <h3 className="text-lg font-semibold text-white">Edit Video</h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">File Code</p>
              <p className="text-white font-mono">{video.file_code}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="input-field resize-none" />
          </div>

          {/* ★ NEW: Categories Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categories
              <span className="text-gray-500 font-normal ml-2">
                ({formData.categories.length} selected)
              </span>
            </label>

            {/* Selected categories */}
            {selectedCategoryNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCategoryNames.map((cat, i) => (
                  <span
                    key={cat._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 text-primary-400 text-sm rounded-full border border-primary-500/30"
                  >
                    {cat.icon || '📁'} {cat.name}
                    {i === 0 && <span className="text-[10px] text-primary-300 ml-1">(Primary)</span>}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search categories */}
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category list */}
            <div className="max-h-40 overflow-y-auto bg-dark-100 rounded-lg p-2 space-y-1">
              {filteredCategories.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-2">No categories found</p>
              ) : (
                filteredCategories.map(cat => {
                  const isSelected = formData.categories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        isSelected
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{cat.icon || '📁'}</span>
                      <span className="flex-1">{cat.name}</span>
                      {isSelected && <FiCheck className="w-4 h-4 text-primary-400" />}
                      <span className="text-xs text-gray-500">{cat.videoCount || 0}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="tag1, tag2, tag3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Featured</label>
              <label className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg cursor-pointer">
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded" />
                <span className="text-gray-300">Featured on homepage</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideosManager;